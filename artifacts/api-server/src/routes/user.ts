import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";


const router = Router();

// GET /api/user/:telegramId
router.get("/user/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.telegramId, telegramId))
      .limit(1);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = users[0];
    return res.json({
      id: String(u.id),
      telegramId: u.telegramId,
      firstName: u.firstName ?? null,
      lastName: u.lastName ?? null,
      username: u.username ?? null,
      photoUrl: u.photoUrl ?? null,
      isNewUser: false,
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/user/:telegramId — update name and photo (upsert)
router.patch("/user/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const body = req.body ?? {};
  const firstName: string | undefined = typeof body.firstName === "string" ? body.firstName.slice(0, 64) : undefined;
  const photoUrl: string | null | undefined =
    body.photoUrl === null ? null :
    typeof body.photoUrl === "string" ? body.photoUrl.slice(0, 500_000) : undefined;

  try {
    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.telegramId, telegramId))
      .limit(1);

    if (existing.length === 0) {
      // New user — create record
      const [u] = await db
        .insert(usersTable)
        .values({ telegramId, firstName: firstName ?? null, photoUrl: photoUrl ?? null })
        .returning();
      return res.json({ success: true, firstName: u.firstName, photoUrl: u.photoUrl });
    } else {
      const updateData: Record<string, unknown> = { lastLogin: new Date() };
      if (firstName !== undefined) updateData.firstName = firstName;
      if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

      const [u] = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.telegramId, telegramId))
        .returning();
      return res.json({ success: true, firstName: u.firstName, photoUrl: u.photoUrl });
    }
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
