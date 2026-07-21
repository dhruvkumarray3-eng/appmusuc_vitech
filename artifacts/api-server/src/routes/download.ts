import { Router } from "express";

const router = Router();

// GET /api/music/download?id=videoId&type=audio|video
router.get("/music/download", async (req, res) => {
  const id = req.query.id as string;
  const type = (req.query.type as string) === "audio" ? "audio" : "video";

  if (!id || !/^[a-zA-Z0-9_-]{8,16}$/.test(id)) {
    return res.status(400).json({ error: "Invalid video ID" });
  }

  const ytUrl = `https://www.youtube.com/watch?v=${id}`;

  try {
    const cobaltRes = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "NobitaMusic/1.0",
      },
      body: JSON.stringify(
        type === "audio"
          ? { url: ytUrl, downloadMode: "audio", audioFormat: "mp3", filenameStyle: "pretty" }
          : { url: ytUrl, downloadMode: "auto", videoQuality: "1080", filenameStyle: "pretty" }
      ),
      signal: AbortSignal.timeout(15_000),
    });

    if (!cobaltRes.ok) throw new Error(`cobalt ${cobaltRes.status}`);
    const data = await cobaltRes.json() as any;

    // tunnel / redirect → direct download URL
    if ((data.status === "tunnel" || data.status === "redirect") && data.url) {
      return res.json({ url: data.url, filename: data.filename ?? `nobita_${id}` });
    }

    // picker (video + audio streams) → pick first
    if (data.status === "picker" && Array.isArray(data.picker) && data.picker.length > 0) {
      return res.json({ url: data.picker[0].url, filename: `nobita_${id}` });
    }

    // cobalt returned something unexpected — fallback
    throw new Error("unexpected cobalt response");
  } catch (err) {
    req.log?.warn({ err }, "cobalt download failed, returning fallback");
    // Fallback: open cobalt frontend with the URL pre-filled
    const fallback = `https://cobalt.tools/?url=${encodeURIComponent(ytUrl)}`;
    return res.json({ url: fallback, fallback: true });
  }
});

export default router;
