import { Router } from "express";
import { db } from "@workspace/db";
import { historyTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AddHistoryBody } from "@workspace/api-zod";

const router = Router();

// POST /api/history
router.post("/history", async (req, res) => {
  try {
    const parsed = AddHistoryBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request body" });
    }
    const { telegramId, song } = parsed.data;

    await db.insert(historyTable).values({
      telegramId,
      songId: song.id,
      songTitle: song.title,
      songThumbnail: song.thumbnail ?? null,
    });

    // Return last 100 history items
    const rows = await db
      .select()
      .from(historyTable)
      .where(eq(historyTable.telegramId, telegramId))
      .orderBy(desc(historyTable.addedAt))
      .limit(100);

    return res.json({
      history: rows.map((r) => ({ id: r.songId, title: r.songTitle, thumbnail: r.songThumbnail ?? undefined })),
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/history/:telegramId
router.get("/history/:telegramId", async (req, res) => {
  try {
    const { telegramId } = req.params;
    const rows = await db
      .select()
      .from(historyTable)
      .where(eq(historyTable.telegramId, telegramId))
      .orderBy(desc(historyTable.addedAt))
      .limit(100);

    return res.json({
      history: rows.map((r) => ({ id: r.songId, title: r.songTitle, thumbnail: r.songThumbnail ?? undefined })),
    });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
