import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { TelegramLoginBody } from "@workspace/api-zod";

const router = Router();

// ── Global master switch ── owner login = khula sabke liye, logout = band
let appUnlocked = false;

// GET /api/auth/status — sabke liye check karo app khuli hai ya nahi
router.get("/auth/status", (_req, res) => {
  res.json({ unlocked: appUnlocked });
});

// POST /api/auth/owner-login — owner apna ID daale, app sabke liye khul jaaye
router.post("/auth/owner-login", (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const { telegramId } = req.body ?? {};
  if (!ownerId) return res.status(500).json({ error: "OWNER_TELEGRAM_ID not configured" });
  if (String(telegramId) !== String(ownerId)) {
    return res.json({ allowed: false, unlocked: appUnlocked });
  }
  appUnlocked = true;
  return res.json({ allowed: true, unlocked: true });
});

// POST /api/auth/owner-logout — owner app band kare sabke liye
router.post("/auth/owner-logout", (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const { telegramId } = req.body ?? {};
  if (String(telegramId) === String(ownerId)) {
    appUnlocked = false;
  }
  return res.json({ unlocked: appUnlocked });
});

// POST /api/auth/telegram (existing — user record save karna)
router.post("/auth/telegram", async (req, res) => {
  try {
    const parsed = TelegramLoginBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });
    const { telegramId, firstName, lastName, username, photoUrl } = parsed.data;

    const existing = await db.select().from(usersTable).where(eq(usersTable.telegramId, telegramId)).limit(1);
    let user;
    if (existing.length === 0) {
      const inserted = await db.insert(usersTable).values({ telegramId, firstName, lastName, username, photoUrl }).returning();
      user = inserted[0];
    } else {
      const updated = await db.update(usersTable)
        .set({ lastLogin: new Date(), ...(photoUrl ? { photoUrl } : {}) })
        .where(eq(usersTable.telegramId, telegramId))
        .returning();
      user = updated[0];
    }
    return res.json({ id: String(user.id), telegramId: user.telegramId, firstName: user.firstName ?? null });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
