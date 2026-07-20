export default async function handler(req, res) {
  let webhookLoadError = null;

  try {
    await import('./webhook.js');
  } catch (err) {
    webhookLoadError = {
      message: err.message,
      stack: err.stack
    };
  }

  res.status(200).json({
    nodeVersion: process.version,
    webhookLoadError,
    message: "Dynamic import of webhook completed."
  });
}