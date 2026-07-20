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

export default router;
