import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, historyTable, favoritesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import https from "https";

const router = Router();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Send a message back to a Telegram chat
async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" });
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

// POST /api/bot/webhook  — receives updates from Telegram
router.post("/bot/webhook", async (req, res) => {
  // Always respond 200 immediately so Telegram doesn't retry
  res.sendStatus(200);

  try {
    const update = req.body;
    const message = update?.message;
    if (!message) return;

    const chatId: number = message.chat.id;
    const text: string = (message.text || "").trim();
    const fromId = String(message.from?.id ?? "");

    // /start
    if (text === "/start") {
      await sendMessage(
        chatId,
        `🎵 *NOBITA MUSIC* へようこそ!\n\nMain tumhara personal DJ hoon 🎧\n\n` +
        `*Commands:*\n` +
        `/history — Tumhari recently played songs\n` +
        `/favorites — Tumhare saved favorites\n` +
        `/help — Saari commands\n\n` +
        `Web app pe jaao aur apna Telegram ID *${fromId}* use karke login karo! 🚀`
      );
      return;
    }

    // /help
    if (text === "/help") {
      await sendMessage(
        chatId,
        `🎵 *NOBITA MUSIC — Help*\n\n` +
        `/start — Welcome message\n` +
        `/history — Tumhara last 5 played songs\n` +
        `/favorites — Tumhare favorite songs\n` +
        `/myid — Apna Telegram ID jaano\n\n` +
        `Web app use karo music search aur play karne ke liye! 🎧`
      );
      return;
    }

    // /myid
    if (text === "/myid") {
      await sendMessage(chatId, `🆔 Tumhara Telegram ID: *${fromId}*\n\nIse web app mein login karne ke liye use karo.`);
      return;
    }

    // /history
    if (text === "/history") {
      const rows = await db
        .select()
        .from(historyTable)
        .where(eq(historyTable.telegramId, fromId))
        .orderBy(desc(historyTable.playedAt))
        .limit(5);

      if (rows.length === 0) {
        await sendMessage(chatId, `📭 Abhi tak koi song nahi suna. Web app pe jao aur music enjoy karo! 🎵`);
      } else {
        const list = rows.map((r, i) => `${i + 1}. ${r.songTitle ?? r.songId}`).join("\n");
        await sendMessage(chatId, `🎵 *Tumhara Recent History:*\n\n${list}`);
      }
      return;
    }

    // /favorites
    if (text === "/favorites") {
      const rows = await db
        .select()
        .from(favoritesTable)
        .where(eq(favoritesTable.telegramId, fromId))
        .limit(10);

      if (rows.length === 0) {
        await sendMessage(chatId, `💔 Koi favorites nahi mile. Web app pe songs save karo! 🎵`);
      } else {
        const list = rows.map((r, i) => `${i + 1}. ${r.songId}`).join("\n");
        await sendMessage(chatId, `❤️ *Tumhare Favorites:*\n\n${list}`);
      }
      return;
    }

    // Default — unknown command
    await sendMessage(
      chatId,
      `❓ Yeh command nahi pehchani. /help likho saari commands dekhne ke liye.`
    );
  } catch (e) {
    req.log?.error(e);
  }
});

// GET /api/bot/register-webhook?url=<your-deployed-url>
// Call this once after deploying to register the webhook with Telegram
router.get("/bot/register-webhook", async (req, res) => {
  if (!BOT_TOKEN) {
    return res.status(400).json({ error: "TELEGRAM_BOT_TOKEN not set" });
  }
  const baseUrl = (req.query.url as string) || `https://${req.headers.host}`;
  const webhookUrl = `${baseUrl}/api/bot/webhook`;

  return new Promise<void>((resolve) => {
    const body = JSON.stringify({ url: webhookUrl });
    const apiReq = https.request(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk) => (data += chunk));
        apiRes.on("end", () => {
          res.json({ webhookUrl, telegram: JSON.parse(data) });
          resolve();
        });
      }
    );
    apiReq.on("error", (err) => { res.status(500).json({ error: String(err) }); resolve(); });
    apiReq.write(body);
    apiReq.end();
  });
});

export default router;
