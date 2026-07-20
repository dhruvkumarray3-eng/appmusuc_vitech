const YOUTUBE_API_KEY = "AIzaSyAJwGWTd-xoRRZLaA-fL9naZJ7d7Ufqebg";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const results = document.getElementById("results");
const player = document.getElementById("player");
const lyrics = document.getElementById("lyrics") || { innerText: "" };
const app = document.getElementById("app");
const loading = document.getElementById("loading");
const welcome = document.getElementById("welcome");
const nowPlayingTitle = document.getElementById("nowPlayingTitle");
const nowPlayingArtist = document.getElementById("nowPlayingArtist");
const currentThumbnail = document.getElementById("currentThumbnail");

// 🌸 FLOW
setTimeout(() => {
  welcome.style.display = "none";
  loading.classList.remove("hidden");
  setTimeout(() => {
    loading.classList.add("hidden");
    app.classList.remove("hidden");
  }, 1500);
}, 1500);

// 🔐 TELEGRAM LOGIN
let userId = "guest";
if (window.Telegram?.WebApp) {
  const user = Telegram.WebApp.initDataUnsafe.user;
  if (user) userId = user.id;
}

// 🎧 QUEUE
let queue = [];

// 🚫 FILTER
const banned = ["sex","porn","xxx","drugs"];
const safe = t => !banned.some(w => t.toLowerCase().includes(w));

// 🔍 SEARCH with YouTube API
async function searchSongs() {
  const q = searchInput.value.trim();
  if (!q) return;

  results.innerHTML = '<div style="text-align: center; opacity: 0.7;">🔍 Searching...</div>';
  
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&safeSearch=strict&maxResults=15&key=${YOUTUBE_API_KEY}`
    );

    if (!res.ok) throw new Error("YouTube API error");
    const data = await res.json();

    results.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      results.innerHTML = '<div style="opacity: 0.7;">❌ No songs found</div>';
      return;
    }

    data.items.forEach((v, idx) => {
      if (!safe(v.snippet.title)) return;
      
      const id = v.id.videoId;
      const title = v.snippet.title;
      const thumbnail = v.snippet.thumbnails.medium.url;

      const songDiv = document.createElement("div");
      songDiv.className = "song";
      songDiv.innerHTML = `
        <img src="${thumbnail}" alt="${title}" style="width: 60px; height: 60px; border-radius: 6px; object-fit: cover;">
        <div style="flex: 1;">
          <p style="margin: 0; font-weight: bold;">${title}</p>
        </div>
        <button class="play-btn" data-id="${id}" data-title="${title}">▶️ Play</button>
      `;
      
      results.appendChild(songDiv);
    });

    // Add event listeners to play buttons
    document.querySelectorAll(".play-btn").forEach(btn => {
      btn.addEventListener("click", function() {
        const id = this.dataset.id;
        const title = this.dataset.title;
        playSong(id, title);
      });
    });

  } catch (e) {
    results.innerHTML = `<div style="color: red;">❌ Error: ${e.message}</div>`;
    console.error(e);
  }
}

// ▶️ PLAY from YouTube
function playSong(id, title) {
  // Update UI
  nowPlayingTitle.textContent = title;
  nowPlayingArtist.textContent = "YouTube";
  currentThumbnail.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  // Play YouTube video in iframe
  player.innerHTML = `
    <iframe width="100%" height="300" 
    src="https://www.youtube.com/embed/${id}?autoplay=1" 
    frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
  `;

  addHistory({ id, title });
  getLyrics(title);
  
  // Scroll to player
  player.scrollIntoView({ behavior: "smooth" });
}

// Search on Enter key
searchInput?.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchSongs();
});

// 🎤 VOICE SEARCH
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice search not supported in your browser");
    return;
  }

  const rec = new SpeechRecognition();
  rec.onresult = e => {
    const transcript = e.results[0][0].transcript;
    searchInput.value = transcript;
    searchSongs();
  };
  rec.onerror = () => alert("Voice search failed");
  rec.start();
}

// 🎶 LYRICS (free API)
async function getLyrics(title) {
  if (!lyrics.innerText) return;
  
  try {
    const artist = "various";
    const res = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
    const data = await res.json();
    lyrics.innerText = data.lyrics || "No lyrics found";
  } catch (e) {
    lyrics.innerText = "Lyrics not available";
  }
}

// 🕓 HISTORY (BACKEND)
async function addHistory(song) {
  try {
    await fetch("http://localhost:3000/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegramId: userId, song })
    }).catch(() => {});
  } catch (e) {
    console.log("History save failed");
  }
}
