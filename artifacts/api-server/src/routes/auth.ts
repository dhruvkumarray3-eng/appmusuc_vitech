import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, historyTable } from "@workspace/db";
import { eq, gte, sql, desc } from "drizzle-orm";
import { TelegramLoginBody } from "@workspace/api-zod";

const router = Router();

// ── Global master switch ── owner login = khula sabke liye, logout = band
let appUnlocked = false;

// GET /api/auth/status — sabke liye check karo app khuli hai ya nahi
router.get("/auth/status", (_req, res) => {
  res.json({ unlocked: appUnlocked });
});

// POST /api/auth/owner-login — owner apna ID + password daale, app sabke liye khul jaaye
router.post("/auth/owner-login", (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const { telegramId, password } = req.body ?? {};

  if (!ownerId) return res.status(500).json({ error: "OWNER_TELEGRAM_ID not configured" });
  if (!ownerPassword) return res.status(500).json({ error: "OWNER_PASSWORD not configured" });

  // ID check
  if (String(telegramId) !== String(ownerId)) {
    return res.json({ allowed: false, reason: "id", unlocked: appUnlocked });
  }
  // Password check
  if (String(password) !== String(ownerPassword)) {
    return res.json({ allowed: false, reason: "password", unlocked: appUnlocked });
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

// GET /api/auth/stats — owner panel ke liye live stats
router.get("/auth/stats", async (_req, res) => {
  try {
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [activeTodayResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(usersTable)
      .where(gte(usersTable.lastLogin, today));

    const [listenersResult] = await db
      .select({ count: sql<number>`count(distinct ${historyTable.telegramId})::int` })
      .from(historyTable);

    const recentUsers = await db
      .select({
        telegramId: usersTable.telegramId,
        firstName: usersTable.firstName,
        username: usersTable.username,
        lastLogin: usersTable.lastLogin,
      })
      .from(usersTable)
      .orderBy(desc(usersTable.lastLogin))
      .limit(20);

    return res.json({
      unlocked: appUnlocked,
      totalRegistered: totalResult?.count ?? 0,
      activeToday: activeTodayResult?.count ?? 0,
      totalListeners: listenersResult?.count ?? 0,
      recentUsers,
    });
  } catch (e) {
    req.log?.error(e);
    return res.status(500).json({ error: "DB error" });
  }
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
