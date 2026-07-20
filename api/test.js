export default async function handler(req, res) {
  let telegramLoadError = null;
  let groqLoadError = null;

  try {
    await import('../lib/telegram.js');
  } catch (err) {
    telegramLoadError = {
      message: err.message,
      stack: err.stack
    };
  }

  try {
    await import('../lib/groq.js');
  } catch (err) {
    groqLoadError = {
      message: err.message,
      stack: err.stack
    };
  }

  res.status(200).json({
    nodeVersion: process.version,
    telegramLoadError,
    groqLoadError,
    message: "Dynamic import diagnostic completed."
  });
}