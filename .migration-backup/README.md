# 🎵 RADHA MUSIC

A modern music streaming web app with Telegram authentication, YouTube integration, lyrics display, and a beautiful dark theme.

## ✨ Features

- 🔍 **YouTube Search** - Search millions of songs with safe content filtering
- 🎤 **Voice Search** - Search using voice commands
- 🎧 **Queue Management** - Create and manage playlists on the fly
- 🎶 **Live Lyrics** - Display song lyrics in real-time
- 🔐 **Telegram Auth** - Login with Telegram ID (no password needed)
- 💾 **History Tracking** - Keeps track of your played songs
- 🎬 **Auto Thumbnails** - YouTube video thumbnails for every song
- ✨ **Smooth Animations** - Beautiful slide-in, fade-in, and pulse animations
- 🎵 **Native Audio Player** - No iFrame, just pure HTML5 audio
- 💫 **Glassmorphic UI** - Modern dark theme with blur effects

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **APIs:** YouTube API v3, Lyrics.ovh
- **Auth:** Telegram WebApp API
- **Deployment:** Vercel-ready

## 📋 Prerequisites

- Node.js (v14+)
- Python 3 (for local frontend server)
- MongoDB Atlas account
- YouTube API Key
- Telegram Bot Token (optional)

## 🚀 Quick Start (Local)

### 1. Clone & Setup
```bash
git clone <repo-url>
cd app-music
```

### 2. Set Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Update `.env` with:
```env
MONGODB_URI=your_mongodb_uri
YOUTUBE_API_KEY=your_youtube_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
PORT=3000
```

### 3. Install Dependencies (Backend)
```bash
cd backend
npm install
```

### 4. Start Servers

**Backend:**
```bash
cd backend
npm start
# or
node server.js
```

**Frontend:**
```bash
cd frontend
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser!

## 🤖 Telegram Bot Integration

1. Create a bot with [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Add to `.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```
4. Backend will auto-register webhook (for production, set `WEBHOOK_URL` in `.env`)

## 🌐 Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repo
4. Add environment variables in Vercel dashboard
5. Deploy! 🚀

## 📁 Project Structure

```
app-music/
├── backend/
│   ├── server.js       # Express server with MongoDB
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── index.html      # UI structure
│   ├── script.js       # Music player logic
│   ├── style.css       # Glassmorphic design
│   └── package.json
├── .env                # Environment variables (DO NOT COMMIT)
├── .env.example        # Example environment file
├── vercel.json         # Vercel deployment config
└── README.md           # This file
```

## 🎨 API Endpoints

### Backend (`http://localhost:3000`)

- `GET /` - Health check
- `POST /auth/telegram` - Authenticate with Telegram
- `POST /history` - Save played songs
- `GET /history/:telegramId` - Get user history
- `POST /favorites/add` - Add song to favorites
- `GET /favorites/:telegramId` - Get user favorites
- `GET /user/:telegramId` - Get user profile
- `POST /telegram/webhook` - Telegram bot webhook
- `GET /api/search` - Search songs (JioSaavn API proxy)

## 📸 Features in Detail

### 🔍 YouTube Search
- Powered by YouTube API v3
- 15 search results per query
- Auto-filtered adult content

### 🎶 Lyrics Display
- Powered by Lyrics.ovh API
- Real-time lyrics fetching
- Fallback if not available

### 💾 History & Favorites
- Saved to MongoDB
- Persistent per user
- Sync across devices

### 🎤 Voice Search
- Uses Web Speech API
- Works in Chrome, Firefox, Edge
- 15-second recording timeout

## 🐛 Troubleshooting

**"YouTube API Error"** → Check if API key is valid in `.env`

**"MongoDB Connection Failed"** → Verify MongoDB URI and network access

**"Telegram Token Invalid"** → Double-check token from @BotFather

**"CORS Error"** → Backend should have CORS enabled automatically

## 📝 License

MIT License - Feel free to use and modify!

## 👨‍💻 Author

Created with ❤️ for music lovers

---

**Happy Listening! 🎵**

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Start Backend & Frontend

**Terminal 1 - Backend:**
```bash
cd backend
npm start
# Runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
python3 -m http.server 8000
# Runs on http://localhost:8000
```

### 5. Open in Browser
Visit: **http://localhost:8000**

## 🔐 Authentication

### Telegram Login
The app supports two authentication methods:

1. **Telegram WebApp** - Direct login from Telegram bot
2. **Guest Login** - Test the app without Telegram

When logged in via Telegram, the app automatically:
- Fetches user's first name, last name, username
- Creates/updates user profile in MongoDB
- Tracks play history
- Stores favorites

## 🌐 Deployment on Vercel

### 1. Connect Repository
```bash
npm install -g vercel
vercel
```

### 2. Set Environment Variables
In Vercel Dashboard:
- Add `MONGODB_URI`
- Add `YOUTUBE_API_KEY`
- Add `TELEGRAM_BOT_TOKEN`

### 3. Configure Vercel
The `vercel.json` is already configured:
- Backend: Node.js on `/api`
- Frontend: Static files on `/`

### 4. Deploy
```bash
vercel --prod
```

## 📱 API Endpoints

### Authentication
- `POST /auth/telegram` - Login with Telegram ID
  ```json
  {
    "telegramId": "123456",
    "firstName": "John",
    "lastName": "Doe",
    "username": "johndoe",
    "photoUrl": "..."
  }
  ```

### History
- `GET /history/:telegramId` - Get user's play history
- `POST /history` - Save a played song
  ```json
  {
    "telegramId": "123456",
    "song": {
      "id": "dQw4w9WgXcQ",
      "title": "Never Gonna Give You Up"
    }
  }
  ```

### Favorites
- `GET /favorites/:telegramId` - Get favorite songs
- `POST /favorites/add` - Add song to favorites

### User
- `GET /user/:telegramId` - Get user profile

## 🎨 Customization

### Change Colors
Edit `frontend/style.css`:
```css
--primary: #1db954;  /* Change primary color */
--dark-bg: #0f0f0f;  /* Change background */
```

### Add More APIs
Update `backend/server.js` to add:
- Spotify API integration
- Apple Music integration
- Custom playlist system

## 🐛 Troubleshooting

### MongoDB Connection Error
- Verify `MONGODB_URI` in `.env`
- Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0)
- Test connection: `mongosh "your-uri"`

### YouTube API Issues
- Verify API key is enabled for YouTube v3
- Check you haven't exceeded daily quota (10,000 requests)
- Try searching for a different query

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### CORS Errors
- Backend CORS is configured to accept all origins
- If issues persist, update `backend/server.js`:
```javascript
app.use(cors({
  origin: "https://your-domain.com"
}));
```

## 📚 Project Structure

```
app-music/
├── backend/
│   ├── server.js           # Express server & API routes
│   ├── package.json        # Node dependencies
│   └── node_modules/
├── frontend/
│   ├── index.html          # Main HTML
│   ├── script.js           # All JavaScript logic
│   ├── style.css           # All styles & animations
│   └── package.json
├── .env                    # Environment variables
├── vercel.json            # Vercel deployment config
└── README.md
```

## 🔒 Security Notes

- API keys are stored in `.env` (never commit this!)
- MongoDB credentials in `.env` are not exposed to frontend
- YouTube API key is used client-side (consider server proxy for production)
- CORS enabled for all origins (restrict in production)

## 📄 License

Open source - feel free to use and modify!

## 💬 Support

For issues or questions:
1. Check `backend/server.js` logs
2. Check browser console errors
3. Verify `.env` file has all required variables
4. Test API endpoints with Postman

---

**Made with ❤️ by Radha Music Team**
