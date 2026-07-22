import { Router } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const router = Router();

const BOT_API = "https://api.telegram.org";

// ── helpers ──────────────────────────────────────────────────────────────────

function safeClean(pattern: string) {
  try { execAsync(`rm -f ${pattern}`); } catch { /* ignore */ }
}

async function downloadWithYtDlp(
  videoId: string,
  type: "audio" | "video",
  outBase: string
): Promise<string> {
  const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;

  let cmd: string;
  if (type === "audio") {
    // Download as best audio → convert to mp3 with ffmpeg (Telegram plays natively)
    cmd = [
      "yt-dlp",
      "--no-playlist --no-warnings --no-part",
      "--socket-timeout 20",
      "-f \"bestaudio\"",
      "--extract-audio --audio-format mp3 --audio-quality 192K",
      `-o "${outBase}.%(ext)s"`,
      `"${ytUrl}"`,
    ].join(" ");
  } else {
    // 480p mp4 – keeps file under Telegram 50 MB limit for most videos
    cmd = [
      "yt-dlp",
      "--no-playlist --no-warnings --no-part",
      "--socket-timeout 20",
      "-f \"best[height<=480][ext=mp4]/best[height<=480]/worst[ext=mp4]/worst\"",
      "--merge-output-format mp4",
      `-o "${outBase}.%(ext)s"`,
      `"${ytUrl}"`,
    ].join(" ");
  }

  await execAsync(cmd, { timeout: 120_000 });

  // Find the downloaded file
  const dir = path.dirname(outBase);
  const base = path.basename(outBase);
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(base + "."));
  if (!files.length) throw new Error("yt-dlp produced no output file");
  return path.join(dir, files[0]);
}

async function sendToTelegram(
  token: string,
  chatId: string,
  filePath: string,
  type: "audio" | "video",
  title: string,
  channelTitle: string
): Promise<void> {
  const fileBuffer = fs.readFileSync(filePath);
  const ext = filePath.split(".").pop() ?? (type === "audio" ? "mp3" : "mp4");
  const safeName = title.replace(/[^\w\s-]/g, "").trim().slice(0, 50) || "nobita_song";
  const filename = `${safeName}.${ext}`;
  const caption = `🎵 *${title}*\n_${channelTitle}_\n\n_Via NOBITA MUSIC_`;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("parse_mode", "Markdown");

  const mime = type === "audio" ? "audio/mpeg" : "video/mp4";
  const blob = new Blob([fileBuffer], { type: mime });

  if (type === "audio") {
    form.append("title", title.slice(0, 60));
    form.append("performer", channelTitle.slice(0, 60));
    form.append("audio", blob, filename);
    const r = await fetch(`${BOT_API}/bot${token}/sendAudio`, { method: "POST", body: form });
    if (!r.ok) throw new Error(`Telegram sendAudio ${r.status}: ${await r.text()}`);
  } else {
    form.append("video", blob, filename);
    const r = await fetch(`${BOT_API}/bot${token}/sendVideo`, { method: "POST", body: form });
    if (!r.ok) throw new Error(`Telegram sendVideo ${r.status}: ${await r.text()}`);
  }
}

async function sendMessage(token: string, chatId: string, text: string) {
  await fetch(`${BOT_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// ── route ────────────────────────────────────────────────────────────────────

/**
 * POST /api/music/send-to-telegram
 * Body: { telegramId, videoId, type: "audio"|"video", title?, channelTitle? }
 *
 * Downloads the song/video with yt-dlp and sends it directly to the user's
 * Telegram chat via the bot. No file is permanently stored on the server.
 */
router.post("/music/send-to-telegram", async (req, res) => {
  const {
    telegramId,
    videoId,
    type = "audio",
    title = "Song",
    channelTitle = "YouTube",
  } = req.body as {
    telegramId?: string;
    videoId?: string;
    type?: "audio" | "video";
    title?: string;
    channelTitle?: string;
  };

  if (!telegramId || !videoId) {
    return res.status(400).json({ error: "telegramId aur videoId required hain" });
  }
  if (!/^[a-zA-Z0-9_-]{6,16}$/.test(videoId)) {
    return res.status(400).json({ error: "Invalid videoId" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return res.status(500).json({ error: "Bot token missing" });

  const outBase = `/tmp/nobita_${videoId}_${Date.now()}`;
  let filePath: string | null = null;

  try {
    // Acknowledge fast — download takes time
    res.json({ success: true, message: "Download shuru ho gayi, Telegram check karo 🎵" });

    // Send "preparing" message to user immediately
    await sendMessage(token, telegramId,
      `⏳ *${title}* download ho rahi hai...\nThodi der mein Telegram pe milegi 🎵`
    );

    filePath = await downloadWithYtDlp(videoId, type, outBase);

    // Check file size (Telegram bot limit: 50 MB)
    const { size } = fs.statSync(filePath);
    if (size > 49 * 1024 * 1024) {
      await sendMessage(token, telegramId,
        `⚠️ *${title}* ka ${type === "video" ? "video" : "audio"} 50MB se bada hai, Telegram limit exceed ho gayi.\n\nYouTube se seedha suno: https://youtu.be/${videoId}`
      );
      return;
    }

    await sendToTelegram(token, telegramId, filePath, type, title, channelTitle);
  } catch (err: any) {
    req.log?.error({ err: err?.message }, "send-to-telegram failed");
    try {
      await sendMessage(token, telegramId,
        `❌ *${title}* send karne mein error aaya.\nYouTube link: https://youtu.be/${videoId}`
      );
    } catch { /* ignore secondary failure */ }
  } finally {
    if (filePath) safeClean(filePath);
    safeClean(`${outBase}.*`);
  }
});

export default router;
