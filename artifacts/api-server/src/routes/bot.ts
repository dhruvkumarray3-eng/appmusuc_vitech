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

    // Sirf /appmusucnobita pe react karo — baaki sab ignore
    if (text === "/appmusucnobita") {
      await telegramPost("sendMessage", {
        chat_id: chatId,
        text: "🎵 *NOBITA MUSIC* — App kholne ke liye neeche button dabao 👇",
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🎵 NOBITA MUSIC Kholo", web_app: { url: APP_URL } }
          ]]
        }
      });
    }
    // Baaki sab commands aur messages — bilkul ignore
  } catch (e) {
    req.log?.error(e);
  }
});

// GET /api/bot/register-webhook — webhook + Mini App menu button set karo
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });

  const baseUrl = (req.query.url as string) || APP_URL;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;

  const [webhookResult, menuResult, commandsResult] = await Promise.all([
    // Webhook register karo
    telegramPost("setWebhook", { url: webhookUrl }),
    // Left side ka menu button — Mini App Web App button
    telegramPost("setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "🎵 NOBITA MUSIC",
        web_app: { url: APP_URL }
      }
    }),
    // Sirf ek command — /appmusucnobita
    telegramPost("setMyCommands", {
      commands: [
        { command: "appmusucnobita", description: "🎵 NOBITA MUSIC app kholo" }
      ]
    }),
  ]);

  return res.json({ webhookUrl, webhook: webhookResult, menuButton: menuResult, commands: commandsResult });
});

export default router;
