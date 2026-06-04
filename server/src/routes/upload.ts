import { Hono } from "hono";
import { put } from "@vercel/blob";
import { AuthEnv, authMiddleware, adminMiddleware } from "../middleware/auth.js";

export const uploadAdminRouter = new Hono<AuthEnv>();
uploadAdminRouter.use("*", authMiddleware, adminMiddleware);

uploadAdminRouter.post("/image", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  const blob = await put(`activities/images/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  return c.json({ url: blob.url });
});

uploadAdminRouter.post("/audio", async (c) => {
  const form = await c.req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }
  const blob = await put(`activities/audio/${Date.now()}-${file.name}`, file, {
    access: "public",
  });
  return c.json({ url: blob.url });
});
