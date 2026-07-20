import dotenv from 'dotenv';
import { getUpdates, deleteWebhook } from './lib/telegram.js';
import handler from './api/webhook.js';

dotenv.config();

async function startLocalPolling() {
  console.log('====================================================');
  console.log('      Telegram Human-Like Bot: Local Polling Mode    ');
  console.log('====================================================');

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env file.');
    console.error('Please create a .env file and add your token.');
    process.exit(1);
  }
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ Error: GROQ_API_KEY is not set in .env file.');
    console.error('Please add GROQ_API_KEY to your .env file.');
    process.exit(1);
  }

  console.log('🔄 Cleaning up active webhooks to enable polling...');
  await deleteWebhook();
  console.log('✅ Webhook cleared. Bot is now listening for messages.');
  console.log('🤖 Send a message to your bot on Telegram to test it.');
  console.log('💡 Press Ctrl+C to stop.');

  let offset = 0;

  // Infinite polling loop
  while (true) {
    try {
      // Long-polling: waits up to 10 seconds for new messages before returning
      const updates = await getUpdates(offset, 100, 10);
      
      for (const update of updates) {
        // Set offset to the next update ID to acknowledge current update
        offset = update.update_id + 1;

        // Mock req and res objects for Vercel Webhook handler
        const req = {
          method: 'POST',
          body: update
        };

        const res = {
          statusCode: 200,
          status: function (code) {
            this.statusCode = code;
            return this;
          },
          send: function (msg) {
            this.body = msg;
            return this;
          }
        };

        // Execute the handler asynchronously
        handler(req, res).catch((err) => {
          console.error('❌ Error running handler on local update:', err);
        });
      }
    } catch (error) {
      console.error('⚠️ Polling error occurred:', error.message || error);
      // Wait 5 seconds before retrying to prevent rapid loop execution in case of continuous failures
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// Start the polling
startLocalPolling();