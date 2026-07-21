import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, historyTable, settingsTable } from "@workspace/db";
import { eq, gte, sql, desc } from "drizzle-orm";
import { TelegramLoginBody } from "@workspace/api-zod";

const router = Router();
const SETTINGS_KEY = "app";

// ── DB-backed master switch ──────────────────────────────────────────────────
// In-memory cache (fast reads), DB for persistence across restarts
let appUnlocked = false;

// Server start pe DB se state load karo
async function loadUnlockedState() {
  try {
    const rows = await db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.key, SETTINGS_KEY))
      .limit(1);
    if (rows.length > 0) {
      appUnlocked = rows[0].appUnlocked;
    }
  } catch {
    // DB ready nahi — default false rehega
  }
}
loadUnlockedState();

async function persistUnlocked(value: boolean) {
  appUnlocked = value;
  try {
    await db
      .insert(settingsTable)
      .values({ key: SETTINGS_KEY, appUnlocked: value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settingsTable.key,
        set: { appUnlocked: value, updatedAt: new Date() },
      });
  } catch {
    // ignore — in-memory state already updated
  }
}

// GET /api/auth/status — sabke liye check karo app khuli hai ya nahi
router.get("/auth/status", (_req, res) => {
  res.json({ unlocked: appUnlocked });
});

// POST /api/auth/owner-login — owner apna ID + password daale, app sabke liye khul jaaye
router.post("/auth/owner-login", async (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const { telegramId, password } = req.body ?? {};

  if (!ownerId) return res.status(500).json({ error: "OWNER_TELEGRAM_ID not configured" });
  if (!ownerPassword) return res.status(500).json({ error: "OWNER_PASSWORD not configured" });

  if (String(telegramId) !== String(ownerId)) {
    return res.json({ allowed: false, reason: "id", unlocked: appUnlocked });
  }
  if (String(password) !== String(ownerPassword)) {
    return res.json({ allowed: false, reason: "password", unlocked: appUnlocked });
  }

  await persistUnlocked(true);
  return res.json({ allowed: true, unlocked: true });
});

// POST /api/auth/owner-logout — owner app band kare sabke liye
router.post("/auth/owner-logout", async (req, res) => {
  const ownerId = process.env.OWNER_TELEGRAM_ID;
  const { telegramId } = req.body ?? {};
  if (String(telegramId) === String(ownerId)) {
    await persistUnlocked(false);
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

// POST /api/auth/telegram — user record save karna
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
