import { Hono } from "hono";
import Stripe from "stripe";
import { eq, and, count, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  organizations,
  organizationSubscriptions,
  classroomMembers,
  users,
} from "../db/schema.js";
import { authMiddleware, adminMiddleware, type AuthEnv } from "../middleware/auth.js";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[billing] STRIPE_SECRET_KEY not set — billing routes disabled");
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

const PRICE_IDS: Record<string, { plan: "starter" | "pro"; studentLimit: number }> = {
  [process.env.STRIPE_PRICE_STARTER ?? ""]: { plan: "starter", studentLimit: 30 },
  [process.env.STRIPE_PRICE_PRO ?? ""]: { plan: "pro", studentLimit: 100 },
};

const SUCCESS_URL =
  process.env.WEB_URL
    ? `${process.env.WEB_URL}/educator/billing/success`
    : "http://localhost:3001/educator/billing/success";

const CANCEL_URL =
  process.env.WEB_URL
    ? `${process.env.WEB_URL}/educator/pricing`
    : "http://localhost:3001/educator/pricing";

// ---- Public billing router (Stripe webhooks — no auth) ----

export const billingWebhookRouter = new Hono();

billingWebhookRouter.post("/webhooks", async (c) => {
  if (!stripe) return c.json({ error: "Billing not configured" }, 503);

  const sig = c.req.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return c.json({ error: "Missing signature" }, 400);

  let event: Stripe.Event;
  try {
    const body = await c.req.text();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.userId;
      const orgName = session.metadata?.orgName ?? "My Organization";
      const priceId = session.metadata?.priceId ?? "";
      const meta = PRICE_IDS[priceId];
      if (!userId || !meta) break;

      const stripeCustomerId = session.customer as string;
      const stripeSubId = session.subscription as string;

      // Fetch subscription for period end
      const sub = await stripe.subscriptions.retrieve(stripeSubId) as unknown as Record<string, unknown>;
      const periodEnd = sub.current_period_end as number | undefined;

      // Upsert organization
      const [org] = await db
        .insert(organizations)
        .values({ name: orgName, stripeCustomerId, createdBy: userId })
        .onConflictDoUpdate({
          target: organizations.stripeCustomerId,
          set: { name: orgName },
        })
        .returning({ id: organizations.id });

      await db.insert(organizationSubscriptions).values({
        organizationId: org.id,
        stripeSubscriptionId: stripeSubId,
        stripePriceId: priceId,
        plan: meta.plan,
        status: "active",
        studentLimit: meta.studentLimit,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      });

      await db
        .update(users)
        .set({ organizationId: org.id })
        .where(eq(users.id, userId));

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as unknown as Record<string, unknown>;
      const subId = sub.id as string;
      const items = (sub.items as { data: Array<{ price: { id: string } }> }).data;
      const priceId = items[0]?.price.id ?? "";
      const meta = PRICE_IDS[priceId];
      const periodEnd = sub.current_period_end as number | undefined;

      const statusMap: Record<string, "active" | "past_due" | "canceled"> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
      };
      const status = statusMap[sub.status as string] ?? "past_due";

      await db
        .update(organizationSubscriptions)
        .set({
          status,
          ...(meta ? { plan: meta.plan, studentLimit: meta.studentLimit } : {}),
          currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
          updatedAt: new Date(),
        })
        .where(eq(organizationSubscriptions.stripeSubscriptionId, subId));

      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as unknown as { id: string };
      await db
        .update(organizationSubscriptions)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(organizationSubscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as unknown as { subscription: string | null };
      const subId = invoice.subscription;
      if (!subId) break;
      await db
        .update(organizationSubscriptions)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(organizationSubscriptions.stripeSubscriptionId, subId));
      break;
    }
  }

  return c.json({ received: true });
});

// ---- Authenticated billing router ----

export const billingRouter = new Hono<AuthEnv>();
billingRouter.use("*", authMiddleware);

// GET /api/billing/educator/status
billingRouter.get("/educator/status", async (c) => {
  const userId = c.get("userId");

  const [user] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.organizationId) return c.json({ active: false });

  const [sub] = await db
    .select()
    .from(organizationSubscriptions)
    .where(eq(organizationSubscriptions.organizationId, user.organizationId))
    .limit(1);

  if (!sub) return c.json({ active: false });

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  const [{ studentCount }] = await db
    .select({ studentCount: count() })
    .from(classroomMembers)
    .where(eq(classroomMembers.userId, userId)); // naive — TODO: count org-wide if needed

  return c.json({
    active: sub.status === "active",
    plan: sub.plan,
    status: sub.status,
    studentLimit: sub.studentLimit,
    currentPeriodEnd: sub.currentPeriodEnd,
    organizationName: org?.name,
    studentCount,
  });
});

// POST /api/billing/educator/checkout
billingRouter.post("/educator/checkout", async (c) => {
  if (!stripe) return c.json({ error: "Billing not configured" }, 503);

  const userId = c.get("userId");
  const body = await c.req.json<{ priceId: string; orgName: string }>();

  if (!body.priceId || !PRICE_IDS[body.priceId]) {
    return c.json({ error: "Invalid price" }, 400);
  }

  const [user] = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: user?.email,
    line_items: [{ price: body.priceId, quantity: 1 }],
    success_url: `${SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: CANCEL_URL,
    metadata: {
      userId,
      orgName: body.orgName || user?.name || "My Organization",
      priceId: body.priceId,
    },
  });

  return c.json({ url: session.url });
});

// POST /api/billing/educator/portal
billingRouter.post("/educator/portal", async (c) => {
  if (!stripe) return c.json({ error: "Billing not configured" }, 503);

  const userId = c.get("userId");

  const [user] = await db
    .select({ organizationId: users.organizationId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user?.organizationId) return c.json({ error: "No organization" }, 404);

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);

  if (!org?.stripeCustomerId) return c.json({ error: "No billing account" }, 404);

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: process.env.WEB_URL
      ? `${process.env.WEB_URL}/educator/billing`
      : "http://localhost:3001/educator/billing",
  });

  return c.json({ url: session.url });
});

// ---- Admin billing router ----

export const billingAdminRouter = new Hono<AuthEnv>();
billingAdminRouter.use("*", authMiddleware);
billingAdminRouter.use("*", adminMiddleware);

// POST /api/admin/billing/provision — manually provision institution tier
billingAdminRouter.post("/provision", async (c) => {
  const body = await c.req.json<{ userId: string; orgName: string }>();

  const [org] = await db
    .insert(organizations)
    .values({ name: body.orgName, createdBy: body.userId })
    .returning({ id: organizations.id });

  await db.insert(organizationSubscriptions).values({
    organizationId: org.id,
    plan: "institution",
    status: "active",
    studentLimit: null, // unlimited
  });

  await db
    .update(users)
    .set({ organizationId: org.id })
    .where(eq(users.id, body.userId));

  return c.json({ organizationId: org.id });
});

// GET /api/admin/billing/organizations
billingAdminRouter.get("/organizations", async (c) => {
  const orgs = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      createdAt: organizations.createdAt,
      plan: organizationSubscriptions.plan,
      status: organizationSubscriptions.status,
      studentLimit: organizationSubscriptions.studentLimit,
      currentPeriodEnd: organizationSubscriptions.currentPeriodEnd,
    })
    .from(organizations)
    .leftJoin(
      organizationSubscriptions,
      eq(organizationSubscriptions.organizationId, organizations.id)
    );

  return c.json(orgs);
});
