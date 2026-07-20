import { Router } from "express";
import { db } from "@workspace/db";
import { playlistTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { AddToPlaylistBody } from "@workspace/api-zod";

const router = Router();

// POST /api/playlist/add
router.post("/playlist/add", async (req, res) => {
  try {
    const parsed = AddToPlaylistBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { telegramId, song } = parsed.data;

    await db.insert(playlistTable).values({
      telegramId,
      songId: song.id,
      songTitle: song.title,
      songThumbnail: song.thumbnail ?? null,
    });

    const rows = await db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.telegramId, telegramId))
      .orderBy(asc(playlistTable.addedAt));

    return res.json({
      playlist: rows.map((r) => ({ id: r.songId, title: r.songTitle, thumbnail: r.songThumbnail ?? undefined })),
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/playlist/:telegramId
router.get("/playlist/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const rows = await db
      .select()
      .from(playlistTable)
      .where(eq(playlistTable.telegramId, telegramId))
      .orderBy(asc(playlistTable.addedAt));

    return res.json({
      playlist: rows.map((r) => ({ id: r.songId, title: r.songTitle, thumbnail: r.songThumbnail ?? undefined })),
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
