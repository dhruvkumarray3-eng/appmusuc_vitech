import { Router } from "express";
import { db } from "@workspace/db";
import { favoritesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { AddFavoriteBody, RemoveFavoriteBody } from "@workspace/api-zod";

const router = Router();

// POST /api/favorites/add
router.post("/favorites/add", async (req, res) => {
  try {
    const parsed = AddFavoriteBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { telegramId, songId } = parsed.data;

    const existing = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.telegramId, telegramId), eq(favoritesTable.songId, songId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(favoritesTable).values({ telegramId, songId });
    }

    const rows = await db.select().from(favoritesTable).where(eq(favoritesTable.telegramId, telegramId));
    return res.json({ favorites: rows.map((r) => r.songId) });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites/remove
router.post("/favorites/remove", async (req, res) => {
  try {
    const parsed = RemoveFavoriteBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { telegramId, songId } = parsed.data;

    await db
      .delete(favoritesTable)
      .where(and(eq(favoritesTable.telegramId, telegramId), eq(favoritesTable.songId, songId)));

    const rows = await db.select().from(favoritesTable).where(eq(favoritesTable.telegramId, telegramId));
    return res.json({ favorites: rows.map((r) => r.songId) });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/favorites/:telegramId
router.get("/favorites/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const rows = await db.select().from(favoritesTable).where(eq(favoritesTable.telegramId, telegramId));
    return res.json({ favorites: rows.map((r) => r.songId) });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
