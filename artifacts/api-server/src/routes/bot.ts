import { Router } from "express";
import https from "https";

const router = Router();
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.APP_URL || "";

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

// POST /api/bot/webhook
router.post("/bot/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return;

    const chatId: number = message.chat.id;
    const text: string = (message.text || "").trim();
    const user = message.from;
    const firstName = user?.first_name ?? "Dost";

    if (text === "/start" || text === "/appmusucnobita") {
      await telegramPost("sendMessage", {
        chat_id: chatId,
        text:
          `🎵 *Jai ho ${firstName}!*\n\n` +
          `NOBITA MUSIC mein aapka swagat hai 🎶\n` +
          `Neeche button dabao aur music ka maze lo 👇`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[
            { text: "🎵 NOBITA MUSIC Kholo", web_app: { url: APP_URL } }
          ]]
        }
      });
    }
    // Baaki sab ignore
  } catch (e) {
    req.log?.error(e);
  }
});

// GET /api/bot/register-webhook — fresh setup: delete old, register new
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });
  if (!APP_URL) return res.status(400).json({ error: "APP_URL not set" });

  const baseUrl = (req.query.url as string) || APP_URL;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;

  // Step 1: Purana webhook aur menu button hatao
  await telegramPost("deleteWebhook", { drop_pending_updates: true });
  await telegramPost("setChatMenuButton", { menu_button: { type: "default" } });

  // Step 2: Naya webhook lagao
  const [webhookResult, commandsResult] = await Promise.all([
    telegramPost("setWebhook", {
      url: webhookUrl,
      allowed_updates: ["message", "callback_query"],
    }),
    telegramPost("setMyCommands", {
      commands: [
        { command: "start", description: "🎵 NOBITA MUSIC shuru karo" },
        { command: "appmusucnobita", description: "🎵 NOBITA MUSIC app kholo" },
      ],
    }),
  ]);

  return res.json({
    webhookUrl,
    webhook: webhookResult,
    commands: commandsResult,
    menuButton: "reset to default (keyboard button removed)",
  });
});

// GET /api/bot/reset — emergency: sab kuch reset karo
router.get("/bot/reset", async (_req, res) => {
  if (!BOT_TOKEN) return res.status(400).json({ error: "No token" });
  const [w, m, c] = await Promise.all([
    telegramPost("deleteWebhook", { drop_pending_updates: true }),
    telegramPost("setChatMenuButton", { menu_button: { type: "default" } }),
    telegramPost("deleteMyCommands", {}),
  ]);
  return res.json({ deleteWebhook: w, resetMenu: m, deleteCommands: c });
});

export default router;
