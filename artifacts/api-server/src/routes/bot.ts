import { Router } from "express";
import https from "https";

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const APP_URL = process.env.APP_URL || "https://c130c74f-2767-4fac-bc8a-c9474ed3a71b-00-7qvorv6tsq7d.pike.replit.dev";

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

async function searchYouTube(query: string): Promise<Array<{ title: string; videoId: string }>> {
  if (!YOUTUBE_API_KEY) return [];
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&safeSearch=strict&maxResults=5&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data: any = await res.json();
  return (data.items ?? []).map((v: any) => ({
    title: v.snippet.title,
    videoId: v.id.videoId,
  }));
}

// POST /api/bot/webhook
router.post("/bot/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body?.message;
    if (!message) return;

    const chatId: number = message.chat.id;
    const text: string = (message.text || "").trim();

    // /start — simple welcome, no app link
    if (text === "/start" || text.startsWith("/start ")) {
      await sendMessage(chatId, `🎵 *NOBITA MUSIC* mein aapka swagat hai!\n\nKoi bhi song ka naam likho, main YouTube se dhoondh dunga.\n\nApp kholne ke liye: /appmusucnobita`);
      return;
    }

    // /appmusucnobita — sirf yahi pe app link bhejega
    if (text === "/appmusucnobita") {
      await sendMessage(chatId, `🎵 *NOBITA MUSIC*\n\n${APP_URL}`);
      return;
    }

    // Ignore all other commands
    if (text.startsWith("/")) return;

    // Music search — plain text
    await telegramPost("sendChatAction", { chat_id: chatId, action: "typing" });
    const results = await searchYouTube(text);

    if (results.length === 0) {
      await sendMessage(chatId, `😔 *"${text}"* ke liye koi result nahi mila. Kuch aur try karo!`);
      return;
    }

    const buttons = results.map((r) => ([
      { text: `🎵 ${r.title.slice(0, 55)}`, url: `https://youtube.com/watch?v=${r.videoId}` }
    ]));

    await sendMessage(
      chatId,
      `🔍 *"${text}"* ke results:`,
      { inline_keyboard: buttons }
    );
  } catch (e) {
    req.log?.error(e);
  }
});

// GET /api/bot/register-webhook — webhook set karo, menu button hatao
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });

  const baseUrl = (req.query.url as string) || APP_URL;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;

  const [webhookResult, menuResult] = await Promise.all([
    telegramPost("setWebhook", { url: webhookUrl }),
    // Default menu button hatao (no green button)
    telegramPost("setChatMenuButton", { menu_button: { type: "default" } }),
  ]);

  return res.json({ webhookUrl, webhook: webhookResult, menuButton: menuResult });
});

export default router;
