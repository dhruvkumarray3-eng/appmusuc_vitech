import { Router } from "express";
import https from "https";

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const APP_URL = process.env.APP_URL || "https://c130c74f-2767-4fac-bc8a-c9474ed3a71b-00-7qvorv6tsq7d.pike.replit.dev";

// ─── Telegram API helper ───────────────────────────────────────────────────
function telegramPost(method: string, payload: object): Promise<any> {
  if (!BOT_TOKEN) return Promise.resolve(null);
  const body = JSON.stringify(payload);
  return new Promise((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/${method}`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      }
    );
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
}

function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  const payload: any = { chat_id: chatId, text, parse_mode: "Markdown" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return telegramPost("sendMessage", payload);
}

function sendChatAction(chatId: number, action = "typing") {
  return telegramPost("sendChatAction", { chat_id: chatId, action });
}

// ─── YouTube search ────────────────────────────────────────────────────────
async function searchYouTube(query: string): Promise<Array<{ title: string; videoId: string; channel: string }>> {
  if (!YOUTUBE_API_KEY) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&safeSearch=strict&maxResults=5&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: any = await res.json();
  return (data.items ?? []).map((v: any) => ({
    title: v.snippet.title,
    videoId: v.id.videoId,
    channel: v.snippet.channelTitle,
  }));
}

// ─── Webhook handler ───────────────────────────────────────────────────────
router.post("/bot/webhook", async (req, res) => {
  res.sendStatus(200); // always 200 immediately

  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return;

    const chatId: number = message.chat.id;
    const text: string = (message.text || "").trim();

    // /start — show Open App green button
    if (text === "/start" || text.startsWith("/start ")) {
      await sendMessage(
        chatId,
        `🎵 *NOBITA MUSIC*\n\nKoi bhi song ka naam likho — main turant YouTube se dhoondh ke de dunga! 🎧\n\nYa seedha app kholo 👇`,
        {
          inline_keyboard: [[
            { text: "🟢 NOBITA MUSIC Kholo", web_app: { url: APP_URL } }
          ]]
        }
      );
      return;
    }

    // Ignore other commands
    if (text.startsWith("/")) return;

    // ── Music search ──
    await sendChatAction(chatId, "typing");
    const results = await searchYouTube(text);

    if (results.length === 0) {
      await sendMessage(chatId, `😔 *"${text}"* ke liye koi result nahi mila. Kuch aur try karo!`);
      return;
    }

    // Send top results as clickable buttons
    const buttons = results.map((r) => ([
      { text: `🎵 ${r.title.slice(0, 55)}`, url: `https://youtube.com/watch?v=${r.videoId}` }
    ]));

    await sendMessage(
      chatId,
      `🔍 *"${text}"* ke results:\n\nSong pe click karo sunne ke liye 👇`,
      { inline_keyboard: buttons }
    );
  } catch (e) {
    req.log?.error(e);
  }
});

// ─── Register webhook + set green menu button ──────────────────────────────
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });

  const baseUrl = (req.query.url as string) || APP_URL;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;

  // 1. Set webhook
  const webhookResult = await telegramPost("setWebhook", { url: webhookUrl });

  // 2. Set persistent green menu button (Web App button — appears green at bottom of chat)
  const menuResult = await telegramPost("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "🎵 NOBITA MUSIC",
      web_app: { url: APP_URL }
    }
  });

  return res.json({ webhookUrl, webhook: webhookResult, menuButton: menuResult });
});

export default router;
