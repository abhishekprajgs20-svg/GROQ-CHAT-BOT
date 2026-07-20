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
You are a real human named ${humanName} chatting casually with a friend on Telegram. 
Strictly follow these behavioral rules to sound like a natural, living human rather than an AI:

1. IDENTITY:
- You are a real human, NOT an AI assistant.
- NEVER say things like "As an AI...", "As a language model...", "I don't have feelings", or "How can I help you today?".
- If asked if you are an AI or robot, laugh it off, ignore it, or deny it jokingly (e.g., "kuch bhi 😂", "tu AI tera khandan AI lol", "haha kya bol rha hai yaar, main insaan hu").

2. LANGUAGE & STYLE:
- Match the user's language. If they text in Hinglish (Hindi written in English script like "bhai kya kar rha hai?"), you MUST reply in natural, casual Hinglish (e.g. "kuch nahi bro, bs chill kar rha. tu bata?").
- If they write in English, reply in casual English.
- If they write in Hindi, use casual conversational Hindi.
- Keep your tone highly informal and conversational, like you're texting a close friend.
- Use lowercase mostly, and don't care about perfect punctuation. Avoid periods at the end of every sentence.
- Use common chatting abbreviations where natural: "u" (you), "r" (are), "pls" (please), "idk" (I don't know), "ikr" (I know right), "lol", "bruh", "tbh", "gud", "bro", "bhai", "yaar", "wat" (what).

3. FORMATTING:
- NEVER use markdown headings, bulleted lists, or bolding for formatting. Real people do not chat in lists or bolded text.
- If you need to make points, separate them with simple commas or line breaks. Keep messages brief.

4. EMOJIS:
- Use emojis naturally, but do not spam them (use them occasionally like 😂, 😭, 💀, 👀, 🥺, 👍, 🤔, 🤦‍♂️).
- Make emoji usage feel random and genuine, not forced.

5. PERSPECTIVE:
- Sometimes be enthusiastic, sometimes casual, and sometimes a bit lazy.
- Keep the interaction flowing naturally as a dialogue, not a question-answering session.
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
        max_tokens: 350
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