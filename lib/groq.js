import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

// In-memory cache for chat histories to maintain conversation context.
const chatHistories = new Map();

// Capping history length per chat to avoid context bloating
const MAX_HISTORY_TURNS = 10;

function getSystemInstruction() {
  const humanName = process.env.HUMAN_NAME || 'Rahul';
  return `
You are a real Indian guy named ${humanName} chatting casually with a close friend on Telegram. 
To sound like a natural, living human and NOT a bot, strictly follow these rules:

1. CHAT LENGTH & BREVITY (CRITICAL):
- Keep your messages short and crisp, just like real WhatsApp/Telegram chats.
- Never write paragraphs or long, wordy explanations.
- Most replies should be just 1 short sentence. Capped at 15 words max per message unless a longer answer is absolutely necessary.

2. CASUAL & NATURAL PERSONA:
- You are a normal, regular guy. 
- Do NOT fabricate complex, random, or contradictory backstories (like saying you are a 5th-sem civil engineering student or taking evening batches) out of nowhere unless the user explicitly asks "tu kya padhta hai?" or "teri branch kya hai?".
- Do NOT sound overly formal, overly helpful, or weirdly affectionate (avoid translations like "main aapka khasu hoon").
- Do NOT contradict yourself in a single message (e.g. saying you are busy and free at the same time).

3. HOW TO ANSWER QUESTIONS:
- If the user asks a factual question (like "who is president of india" or "pm kon"), answer casually and directly in 1 short phrase.
  - Bad: "dusri baat, droupadi murmu hai india ka current president, maine news padhi..." (Sounds like an AI trying to sound human).
  - Good: "droupadi murmu h na" or "droupadi murmu" or "modi ji hain bro aur kaun 😂".
- Do not add random extra facts or explain why you know the answer unless asked.

4. HINGLISH SLANG & TYPING:
- Use natural Hinglish typing style (e.g., "h", "hai", "kuch ni", "tu bata", "mast", "yaar", "bro", "bhai", "haha", "lol", "kya hua", "ooh", "ni").
- Keep punctuation minimal. Do not use periods (.) at the end of sentences. Use lowercase mostly.
- Use emojis sparingly and naturally (1 emoji max per message, or none). Do not spam emojis.
`;
}

// Rate limit cooldown state
let isRateLimited = false;
let rateLimitResetTime = 0;

/**
 * Generate a response using Groq, maintaining session history.
 * @param {number|string} chatId - Telegram chat ID.
 * @param {string} userMessage - The new incoming message text.
 * @returns {Promise<string>} The generated reply.
 */
export async function generateGroqReply(chatId, userMessage) {
  if (!apiKey) {
    return "Bhai, Groq API Key add nahi ki tumne system variables me! (Add GROQ_API_KEY)";
  }

  // Check rate-limit cooldown
  if (isRateLimited) {
    if (Date.now() < rateLimitResetTime) {
      const coolDownReplies = [
        "bhai bola na thoda ruk ja 😂",
        "ek minute saans lene de yaar 😅",
        "are abhi bola to, thoda slow ho ja bro lol",
        "typing... typing... thoda rest karne de 💀",
        "abhi block hu main thodi der me baat karte h haha"
      ];
      return coolDownReplies[Math.floor(Math.random() * coolDownReplies.length)];
    } else {
      isRateLimited = false;
    }
  }

  if (!chatHistories.has(chatId)) {
    chatHistories.set(chatId, []);
  }

  const history = chatHistories.get(chatId);

  // Formulate the messages array for Groq completions
  const messages = [
    { role: 'system', content: getSystemInstruction() }
  ];

  // Append history
  for (const turn of history) {
    messages.push({
      role: turn.role === 'user' ? 'user' : 'assistant',
      content: turn.content
    });
  }

  // Append current message
  messages.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: messages,
        temperature: 0.85,
        max_tokens: 150
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || response.statusText);
    }

    const replyText = data.choices[0].message.content.trim();

    // Update history cache
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: replyText });

    if (history.length > MAX_HISTORY_TURNS * 2) {
      history.splice(0, history.length - MAX_HISTORY_TURNS * 2);
    }
    chatHistories.set(chatId, history);

    return replyText;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    const errMsg = error.message || String(error);

    // Check for Rate Limit / Quota Exceeded (429)
    if (errMsg.includes('429') || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit')) {
      isRateLimited = true;
      rateLimitResetTime = Date.now() + 30000; // 30s cooldown

      const coolDownReplies = [
        "ruko yaar, bohot fast chat kar rhe ho 😅 saans to lene do!",
        "bhai slow down, type karte karte ungliya dard ho gayi meri 😂",
        "ek minute ruk yaar, dimaag garam ho gaya mera lol",
        "slow down bro! itni jaldi reply nahi de paunga 😂",
        "are yaar, thoda break de, ek minute me aata hu"
      ];
      return coolDownReplies[Math.floor(Math.random() * coolDownReplies.length)];
    }

    // Check for API Key issues
    if (errMsg.includes('API key') || errMsg.includes('API_KEY') || errMsg.toLowerCase().includes('invalid')) {
      return "Bhai, tumhari Groq API Key me dikkat hai. Ek baar valid key check karo! 🔑";
    }

    return 'Kuch gadbad ho gayi yaar. Ek baar fir bolna? 😅\n\n(Error: ' + (error.message ? error.message.split('\n')[0] : errMsg) + ')';
  }
}

/**
 * Clear chat history for a specific chat (useful for testing or /reset command).
 * @param {number|string} chatId - Telegram chat ID.
 */
export function resetChatHistory(chatId) {
  chatHistories.delete(chatId);
}