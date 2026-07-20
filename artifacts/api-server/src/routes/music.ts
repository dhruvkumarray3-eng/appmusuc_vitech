import { Router } from "express";
import { SearchMusicQueryParams } from "@workspace/api-zod";

const router = Router();

const BANNED_WORDS = ["sex", "porn", "xxx", "drugs"];

function isSafe(title: string): boolean {
  const lower = title.toLowerCase();
  return !BANNED_WORDS.some((w) => lower.includes(w));
}

// GET /api/music/search
router.get("/music/search", async (req, res) => {
  try {
    const parsed = SearchMusicQueryParams.safeParse(req.query);
    if (!parsed.success || !parsed.data.q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const q = parsed.data.q;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
      // Return empty results if no API key configured
      req.log.warn("YOUTUBE_API_KEY not configured");
      return res.json({ items: [] });
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&safeSearch=strict&maxResults=15&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      req.log.error({ status: response.status }, "YouTube API error");
      return res.status(502).json({ error: "YouTube API error" });
    }

    const data = (await response.json()) as {
      items?: Array<{
        id: { videoId: string };
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: { medium: { url: string } };
        };
      }>;
    };

    const items = (data.items ?? [])
      .filter((v) => isSafe(v.snippet.title))
      .map((v) => ({
        id: v.id.videoId,
        title: v.snippet.title,
        thumbnail: v.snippet.thumbnails.medium.url,
        channelTitle: v.snippet.channelTitle,
      }));

    return res.json({ items });
  } catch (e) {
    req.log.error(e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
