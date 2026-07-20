import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { TelegramLoginBody } from "@workspace/api-zod";

const router = Router();

// POST /api/auth/owner-check — returns { allowed: true/false }
router.post("/auth/owner-check", (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const { telegramId } = req.body ?? {};
  if (!ownerId) return res.status(500).json({ error: "Owner not configured" });
  return res.json({ allowed: String(telegramId) === String(ownerId) });
});

// POST /api/auth/telegram
router.post("/auth/telegram", async (req, res) => {
  try {
    const parsed = TelegramLoginBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { telegramId, firstName, lastName, username, photoUrl } = parsed.data;

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.telegramId, telegramId))
      .limit(1);

    let user;
    let isNewUser = false;

    if (existing.length === 0) {
      const inserted = await db
        .insert(usersTable)
        .values({ telegramId, firstName, lastName, username, photoUrl })
        .returning();
      user = inserted[0];
      isNewUser = true;
    } else {
      const updated = await db
        .update(usersTable)
        .set({ lastLogin: new Date(), ...(photoUrl ? { photoUrl } : {}) })
        .where(eq(usersTable.telegramId, telegramId))
        .returning();
      user = updated[0];
    }

    return res.json({
      id: String(user.id),
      telegramId: user.telegramId,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      username: user.username ?? null,
      photoUrl: user.photoUrl ?? null,
      isNewUser,
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
