// Env that modules read at import time. Set before any module is required so
// auth.ts (CLERK_SECRET_KEY) and billing.ts (STRIPE_*) initialize cleanly.
process.env.CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "sk_test_dummy";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgres://test:test@localhost:5432/test";
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "sk_test_dummy";
process.env.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_dummy";
process.env.STRIPE_PRICE_STARTER = process.env.STRIPE_PRICE_STARTER ?? "price_starter";
process.env.STRIPE_PRICE_PRO = process.env.STRIPE_PRICE_PRO ?? "price_pro";
