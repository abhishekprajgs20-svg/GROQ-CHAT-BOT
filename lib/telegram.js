import dotenv from 'dotenv';
dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${token}`;

/**
 * Send a request to the Telegram Bot API.
 * @param {string} method - The API method name.
 * @param {object} body - The JSON body to send.
 */
async function callApi(method, body) {
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN is missing in environment variables.');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error(`Telegram API Error (${method}):`, data.description);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Telegram API (${method}):`, error);
    return null;
  }
}

/**
 * Send a plain text message to a chat.
 * @param {number|string} chatId - Telegram chat ID.
 * @param {string} text - Message text.
 * @param {number} [replyToMessageId] - Optional message ID to reply to.
 */
export async function sendMessage(chatId, text, replyToMessageId = null) {
  const body = {
    chat_id: chatId,
    text: text,
  };
  if (replyToMessageId) {
    body.reply_parameters = { message_id: replyToMessageId };
  }
  return callApi('sendMessage', body);
}

/**
 * Send a chat action, e.g., 'typing'.
 * @param {number|string} chatId - Telegram chat ID.
 * @param {string} action - Action type, e.g., 'typing'.
 */
export async function sendChatAction(chatId, action = 'typing') {
  return callApi('sendChatAction', {
    chat_id: chatId,
    action: action,
  });
}

/**
 * Set the webhook URL for the Telegram bot.
 * @param {string} url - The Vercel deployment URL (e.g., https://my-bot.vercel.app/api/webhook).
 */
export async function setWebhook(url) {
  return callApi('setWebhook', { url: url });
}

/**
 * Delete the webhook URL (used when switching to polling mode).
 */
export async function deleteWebhook() {
  return callApi('deleteWebhook');
}

/**
 * Get updates from Telegram (used in polling mode).
 * @param {number} offset - Offset for the updates.
 * @param {number} limit - Max updates to get.
 * @param {number} timeout - Timeout in seconds for long polling.
 */
export async function getUpdates(offset = 0, limit = 100, timeout = 30) {
  const data = await callApi('getUpdates', { offset, limit, timeout });
  return data && data.ok ? data.result : [];
}