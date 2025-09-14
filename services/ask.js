const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");
const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const fs = require("fs");
const path = require("path");
function splitMessage(text, limit = 3000) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + limit));
    start += limit;
  }
  return chunks;
}

function cleanText(text) {
  return text
    .replace(/^\s*\*\s+/gm, "• ") // lists
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*/g, "") // stray stars
    .trim();
}

// ✅ /loukya - only for direct queries
bot.command("loukya", async (ctx) => {
  let query = ctx.message.text.split(" ").slice(1).join(" ");

  if (ctx.message.reply_to_message) {
    return ctx.reply("❌ Please use /replyloukya when replying to a message.");
  }

  if (!query) {
    return ctx.reply("❌ Usage: /loukya <your question>");
  }

  try {
    const loadingMsg = await ctx.reply("⏳ Processing...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: query,
    });

    let data = response.text;
    if (data) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loadingMsg.message_id)
        .catch(() => {});
    }

    data = cleanText(data);
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || "unknown";
    const fileName = `user_${userId}.txt`;

    // Save query and response together
    const logDir = path.join(__dirname, "..", "localDB");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true }); // ensure folder exists
    }

    const filePath = path.join(logDir, fileName);

    fs.appendFileSync(
      filePath,
      `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
    );

    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        reply_to_message_id: ctx.message.message_id,
        protect_content: true,
      });
    }
  } catch (err) {
    console.error("❌ Error:", err);
    ctx.reply("❌ Something went wrong. Try again later.");
  }
});

// ✅ /explainloukya - only for replies
bot.command("replyloukya", async (ctx) => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Please reply to a message with /explainloukya.");
  }

  let query = ctx.message.reply_to_message.text;
  if (!query) {
    return ctx.reply("❌ The replied message has no text to explain.");
  }

  try {
    const loadingMsg = await ctx.reply("⏳ Processing...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: query,
    });

    let data = response.text;
    if (data) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loadingMsg.message_id)
        .catch(() => {});
    }

    data = cleanText(data);
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || "unknown";
    const fileName = `user_${userId}.txt`;

    // Save query and response together
    const logDir = path.join(__dirname, "..", "localDB");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true }); // ensure folder exists
    }

    const filePath = path.join(logDir, fileName);

    fs.appendFileSync(
      filePath,
      `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
    );

    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        reply_to_message_id: ctx.message.message_id,
        protect_content: true,
      });
    }
  } catch (err) {
    console.error("❌ Error:", err);
    ctx.reply("❌ Something went wrong. Try again later.");
  }
});

bot.command("explainloukya", async (ctx) => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Please reply to a message with /explainloukya.");
  }

  let originalText = ctx.message.reply_to_message.text;
  if (!originalText) {
    return ctx.reply("❌ The replied message has no text to explain.");
  }

  // 🟢 Add custom instruction
  let query = `Explain the following text in detail and give useful context:\n\n"${originalText}"`;

  try {
    const loadingMsg = await ctx.reply("⏳ Processing...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: query,
    });

    let data = response.text;
    if (data) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loadingMsg.message_id)
        .catch(() => {});
    }

    data = cleanText(data);
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || "unknown";
    const fileName = `user_${userId}.txt`;

    // Save query and response together
    const logDir = path.join(__dirname, "..", "localDB");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true }); // ensure folder exists
    }

    const filePath = path.join(logDir, fileName);

    fs.appendFileSync(
      filePath,
      `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
    );

    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        reply_to_message_id: ctx.message.message_id,
        protect_content: true,
      });
    }
  } catch (err) {
    console.error("❌ Error:", err);
    ctx.reply("❌ Something went wrong. Try again later.");
  }
});

bot.command("answerloukya", async (ctx) => {
  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Please reply to a message with /answerloukya.");
  }

  let originalText = ctx.message.reply_to_message.text;
  if (!originalText) {
    return ctx.reply("❌ The replied message has no text to answer.");
  }

  // 🟢 Add custom instruction for answering
  let query = `Answer the following question clearly and concisely:\n\n"${originalText}"`;

  try {
    const loadingMsg = await ctx.reply("⏳ Processing...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: query,
    });

    let data = response.text;
    if (data) {
      await ctx.telegram
        .deleteMessage(ctx.chat.id, loadingMsg.message_id)
        .catch(() => {});
    }

    data = cleanText(data);
    const userId = ctx.from.id;
    const userName = ctx.from.first_name || "unknown";
    const fileName = `user_${userId}.txt`;

    // Save query and response together
    const logDir = path.join(__dirname, "..", "localDB");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const filePath = path.join(logDir, fileName);

    fs.appendFileSync(
      filePath,
      `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
    );

    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      await ctx.reply(chunk, {
        reply_to_message_id: ctx.message.message_id,
        protect_content: true,
      });
    }
  } catch (err) {
    console.error("❌ Error:", err);
    ctx.reply("❌ Something went wrong. Try again later.");
  }
});
