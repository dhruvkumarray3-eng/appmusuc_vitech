require("dotenv").config({ path: __dirname + "/../.env" });
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://rj5706603:O95nvJYxapyDHfkw@cluster0.fzmckei.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// MongoDB Schema
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  username: String,
  photoUrl: String,
  history: [Object],
  favorites: [String],
  playlist: [Array],
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);

// Connect to MongoDB
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected")).catch(e => console.log("⚠️ MongoDB Error:", e.message));

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({ status: "🎵 RADHA MUSIC Backend Running", version: "1.0" });
});

// 🔐 TELEGRAM LOGIN/REGISTER
app.post("/auth/telegram", async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username, photoUrl } = req.body;

    if (!telegramId) {
      return res.status(400).json({ error: "Telegram ID required" });
    }

    let user = await User.findOne({ telegramId });

    if (!user) {
      // New user - register
      user = new User({
        telegramId,
        firstName,
        lastName,
        username,
        photoUrl,
        history: [],
        favorites: [],
        playlist: []
      });
    } else {
      // Existing user - update last login
      user.lastLogin = new Date();
      if (photoUrl) user.photoUrl = photoUrl;
    }

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        photoUrl: user.photoUrl,
        isNewUser: !user.lastLogin // Approximately detects new user
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 📤 GET USER PROFILE
app.get("/user/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 💾 SAVE HISTORY
app.post("/history", async (req, res) => {
  try {
    const { telegramId, song } = req.body;

    if (!telegramId) return res.status(400).json({ error: "Telegram ID required" });

    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.history.unshift(song);
    if (user.history.length > 100) user.history = user.history.slice(0, 100);

    await user.save();
    res.json({ status: "ok", history: user.history });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 📖 GET HISTORY
app.get("/history/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    res.json({ history: user?.history || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ❤️ ADD FAVORITE
app.post("/favorites/add", async (req, res) => {
  try {
    const { telegramId, songId } = req.body;
    const user = await User.findOne({ telegramId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.favorites.includes(songId)) {
      user.favorites.push(songId);
      await user.save();
    }

    res.json({ favorites: user.favorites });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET FAVORITES
app.get("/favorites/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.params.telegramId });
    res.json({ favorites: user?.favorites || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 🔍 SEARCH PROXY (JioSaavn API - bypasses CORS)
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: "Query required" });
    }

    // Call JioSaavn API from backend (no CORS issues)
    const response = await fetch(`https://www.jiosaavn.com/api.php?__call=search.getResults&query=${encodeURIComponent(query)}&_format=json&_marker=0%3F_marker%3D0`);
    const data = await response.json();
    
    res.json(data);
  } catch (e) {
    console.error("Search error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// 🤖 TELEGRAM BOT WEBHOOK
app.post("/telegram/webhook", async (req, res) => {
  try {
    const update = req.body;
    
    if (update.message && update.message.text === "/start") {
      const chatId = update.message.chat.id;
      const firstName = update.message.from.first_name;
      const userId = update.message.from.id;
      
      // Create or update user
      let user = await User.findOne({ telegramId: userId });
      if (!user) {
        user = new User({
          telegramId: userId,
          firstName: firstName,
          username: update.message.from.username,
          photoUrl: null,
          history: [],
          favorites: [],
          playlist: []
        });
        await user.save();
      }
      
      console.log(`✅ Telegram user registered: ${firstName} (${userId})`);
    }
    
    res.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    res.status(500).json({ error: e.message });
  }
});

// 📝 REGISTER TELEGRAM BOT WEBHOOK
async function registerWebhook() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN not set - skipping webhook registration");
    return;
  }
  
  try {
    const webhookUrl = process.env.WEBHOOK_URL || "http://localhost:3000/telegram/webhook";
    const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });
    
    const data = await response.json();
    if (data.ok) {
      console.log("🤖 Telegram webhook registered");
    } else {
      console.log("⚠️ Webhook registration failed:", data.description);
    }
  } catch (e) {
    console.log("⚠️ Webhook registration error:", e.message);
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎵 RADHA MUSIC Backend running on port ${PORT}`);
  registerWebhook(); // Register bot webhook on startup
});
