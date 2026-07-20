export default function handler(req, res) {
  res.status(200).json({
    nodeVersion: process.version,
    platform: process.platform,
    envKeysPresent: {
      telegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
      groqApiKey: !!process.env.GROQ_API_KEY,
      humanName: !!process.env.HUMAN_NAME
    },
    message: "Vercel Node.js runtime is working normally! 🚀"
  });
}