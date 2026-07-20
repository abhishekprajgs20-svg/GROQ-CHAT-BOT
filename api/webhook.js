import { sendMessage, sendChatAction } from '../lib/telegram.js';
import { generateGroqReply, resetChatHistory } from '../lib/groq.js';

// A collection of natural short replies a friend might send.
const CASUAL_SHORT_REPLIES = [
  "lol",
  "bruh",
  "hmm",
  "yup",
  "nah",
  "ok",
  "cool",
  "ohhh",
  "accha",
  "sahi hai",
  "hnn",
  "wtff",
  "oohhh",
  "yes",
  "ha",
  "thik h",
  "wokay",
  "damn",
  "wait what?",
  "ikr"
];

// Helper to introduce a delay (simulating human typing time)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('Webhook server is running. Send POST requests from Telegram.');
  }

  const { body } = req;
  
  // Log update for debugging on Vercel
  console.log('Incoming Telegram Update:', JSON.stringify(body));

  // Verify that it contains a message
  if (!body || !body.message) {
    return res.status(200).send('No message found in update.');
  }

  const { message } = body;
  const chatId = message.chat.id;
  const messageId = message.message_id;
  
  // Handle non-text messages gracefully (e.g. Stickers or Photos)
  if (!message.text) {
    try {
      if (message.sticker) {
        await sendChatAction(chatId, 'typing');
        await delay(1000);
        await sendMessage(chatId, 'sticker mast hai 😂', messageId);
      } else if (message.photo) {
        await sendChatAction(chatId, 'typing');
        await delay(1200);
        await sendMessage(chatId, 'nice photo click bro 👍', messageId);
      } else {
        await sendChatAction(chatId, 'typing');
        await delay(800);
        await sendMessage(chatId, 'ye kya bhej diya? parse nahi kar paya main 😂', messageId);
      }
    } catch (err) {
      console.error('Error handling non-text message:', err);
    }
    return res.status(200).send('OK');
  }

  const text = message.text.trim();

  // Handle Commands
  if (text.startsWith('/')) {
    const command = text.split(' ')[0].toLowerCase();
    
    if (command === '/start') {
      await sendChatAction(chatId, 'typing');
      await delay(800);
      await sendMessage(
        chatId,
        "aur bata bhai! kaisa hai? chal chat karte hai. main ekdum real insaan ki tarah reply karunga. tabahi machate hai 😎",
        messageId
      );
      return res.status(200).send('OK');
    }
    
    if (command === '/reset') {
      resetChatHistory(chatId);
      await sendChatAction(chatId, 'typing');
      await delay(600);
      await sendMessage(chatId, "chal bhai, sab bhul gaya main. shuru se shuru karte hai! 🤝", messageId);
      return res.status(200).send('OK');
    }
  }

  try {
    // 1. Send typing indicator immediately to look human
    await sendChatAction(chatId, 'typing');

    // 2. Decide if we want to send a random short reply (e.g. 12% probability)
    // We only trigger this if the incoming text is NOT a command, and is short (<= 25 chars)
    const isShortInput = text.length <= 25;
    const triggerShortReply = isShortInput && Math.random() < 0.12;

    let finalReply = "";

    if (triggerShortReply) {
      // Pick a random casual reaction
      const randomIndex = Math.floor(Math.random() * CASUAL_SHORT_REPLIES.length);
      finalReply = CASUAL_SHORT_REPLIES[randomIndex];
      
      // typing delay for short responses (shorter delay)
      const typingTime = 600 + Math.floor(Math.random() * 500); // 600ms - 1100ms
      await delay(typingTime);
    } else {
      // Fetch response from Groq (Llama 3.1)
      finalReply = await generateGroqReply(chatId, text);

      // Typing speed simulation: longer text = longer typing status
      // Standard typing speed simulation: 50ms per character, capped between 800ms and 2200ms
      const calculatedDelay = Math.min(Math.max(finalReply.length * 40, 800), 2200);
      await delay(calculatedDelay);
    }

    // 3. Send the message
    await sendMessage(chatId, finalReply, messageId);

  } catch (error) {
    console.error('Error handling message processing:', error);
    try {
      await sendMessage(chatId, "kuch server error aa gya lagta h... ruko fir se try krte h 💀", messageId);
    } catch (e) {
      console.error('Failed to send error fallback message:', e);
    }
  }

  return res.status(200).send('OK');
}