# 🤖 Telegram Llama-3.1 Human-Like Chatbot (Vercel Ready)

Yeh ek super realistic, natural aur human-like Telegram Chatbot hai jo **Groq API (Llama 3.1 8B Instant)** ka use karta hai. Llama 3.1 models human-like tone aur Hinglish commands ko Gemini se behtar follow karte hain, aur Groq ki speed bohot hi fast hai!

## ✨ Features

- **💬 Llama 3.1 8B (Smart & Casual)**: Meta ka extremely smart open weights model jo normal dost ki tarah lowercase casual Hinglish me chat karta hai.
- **⚡ Typing status simulation**: Reply karne se pehle chat me "typing..." dikhega, jisse chat bilkul real-time aur natural lagegi.
- **🎲 Random Short Answers**: Kuch messages par bina AI call kiye direct short reactions dega (e.g. "lol", "bruh", "hmm", "yup").
- **🛡️ Auto Cooldown System**: Agar aap continuous fast chatting karte hain aur free rate limit (30 requests/min) hit hoti hai, to bot technical error dikhane ke bajaye real human ki tarah respond karega (*"bhai slow down, type karte karte ungliya dard ho gayi meri 😂"*) aur **30 seconds** ka cooldown leke apne aap recovery kar lega!
- **🚀 Vercel Serverless Ready**: No heavy client SDKs, complete native `fetch` client jo cold-starts ko zero kar deta hai aur fast execute hota hai.

---

## 🛠️ Step-by-Step Setup Guide

### 1. Telegram Bot Token Kaise lein?
1. Telegram par `@BotFather` search karein.
2. `/newbot` command send karein.
3. Bot ka **Name** aur fir ek unique **Username** enter karein (username ke end me `bot` hona zaroori hai, e.g. `MyLlamaFriendBot`).
4. `@BotFather` aapko ek **HTTP API Token** dega. Ise copy kar lein. Yeh aapka `TELEGRAM_BOT_TOKEN` hai.

### 2. Groq API Key Kaise lein?
1. **[Groq Console](https://console.groq.com/)** par jayein.
2. Apne Google account ya Email se free signup karein.
3. Left menu me **"API Keys"** par click karein.
4. **"Create API Key"** button par click karke key generate karein aur copy kar lein (Yeh `gsk_...` se start hoti hai). Yeh aapka `GROQ_API_KEY` hai.

### 3. Project Configuration (Local Setup)
1. Directory me `.env` name ki ek file banayein aur usme niche diye gaye details fill karein (aap `.env.example` file ko copy kar sakte hain):
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   GROQ_API_KEY=your_groq_api_key_here
   HUMAN_NAME=Rahul   # Aapka bot jo name use karega
   ```
2. Terminal me commands run karein:
   ```bash
   npm install
   ```

---

## 💻 Local Run & Testing

Local machine par bot ko bina kisi webhook configuration ke polling method se test karne ke liye:

1. Local terminal me run karein:
   ```bash
   npm start
   ```
   *Ya fir:*
   ```bash
   node local.js
   ```
2. Telegram par apne bot ko search karke `/start` bhej kar chat shuru karein!
3. Memory/History clear karne ke liye `/reset` send kar sakte hain.

---

## 🚀 Vercel Par Deploy Kaise Karein?

### Step A: Deploy to Vercel
1. Apne project ko Github par push karein (aapke liye ek new repository `GROQ-CHAT-BOT` already ban chuki hai).
2. Vercel dashboard par jayein ([https://vercel.com/](https://vercel.com/)) aur **Add New Project** select karein.
3. Apne Github repository **`GROQ-CHAT-BOT`** ko import karein.
4. Deployment settings me **Environment Variables** section open karke ye 3 keys add karein:
   - `TELEGRAM_BOT_TOKEN` = (Step 1 wala token)
   - `GROQ_API_KEY` = (Step 2 wali Groq API Key)
   - `HUMAN_NAME` = (Aapka custom bot name, e.g. `Rahul`)
5. **Deploy** button par click karein. Deploy hone ke baad Vercel aapko ek domain dega (e.g. `https://groq-chat-bot.vercel.app`). Copy kar lein.

### Step B: Telegram Webhook Set Karein
Deploy karne ke baad apne web browser ke address bar me ye URL open karein (apne tokens se badal kar):

```
https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_VERCEL_APP_URL>/api/webhook
```

- `<YOUR_TELEGRAM_BOT_TOKEN>` ko apne Telegram Bot token se replace karein.
- `<YOUR_VERCEL_APP_URL>` ko apne Vercel deploy domain se replace karein.

Aapko browser screen par ye response milega:
`{"ok":true,"result":true,"description":"Webhook was set"}`.

Aapka Llama 3.1 bot ab live hai aur super fast response dene ke liye taiyar hai!