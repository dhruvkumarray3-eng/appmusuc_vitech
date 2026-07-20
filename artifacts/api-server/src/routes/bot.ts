import { Router } from "express";
import https from "https";

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || "https://c130c74f-2767-4fac-bc8a-c9474ed3a71b-00-7qvorv6tsq7d.pike.replit.dev";

function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  if (!BOT_TOKEN) return Promise.resolve();
  const payload: any = { chat_id: chatId, text, parse_mode: "Markdown" };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const body = JSON.stringify(payload);
  return new Promise<void>((resolve) => {
    const req = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => { res.resume(); res.on("end", () => resolve()); }
    );
    req.on("error", () => resolve());
    req.write(body);
    req.end();
  });
}

// POST /api/bot/webhook
router.post("/bot/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body?.message;
    if (!message) return;
    const chatId: number = message.chat.id;

    await sendMessage(
      chatId,
      `🎵 *NOBITA MUSIC*\n\nYoutube jaisi music search karo, songs play karo! 🎧`,
      {
        inline_keyboard: [[
          { text: "🎵 Open NOBITA MUSIC", url: APP_URL }
        ]]
      }
    );
  } catch (e) {
    req.log?.error(e);
  }
});

// GET /api/bot/register-webhook?url=<base-url>
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });
  const baseUrl = (req.query.url as string) || APP_URL;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;
  const body = JSON.stringify({ url: webhookUrl });
  return new Promise<void>((resolve) => {
    const apiReq = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (apiRes) => {
        let data = "";
        apiRes.on("data", (c) => (data += c));
        apiRes.on("end", () => { res.json({ webhookUrl, telegram: JSON.parse(data) }); resolve(); });
      }
    );
    apiReq.on("error", (err) => { res.status(500).json({ error: String(err) }); resolve(); });
    apiReq.write(body);
    apiReq.end();
  });
});

export default router;
