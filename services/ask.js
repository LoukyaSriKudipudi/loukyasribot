const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");
const { GoogleGenAI } = require("@google/genai");
const isBotAdmin = require("../utils/isBotAdmin");

function getAPIKey() {
  const time = new Date().getHours();
  console.log("Current hour:", time);

  if (time >= 9 && time < 11) return process.env.GEMINI_API_KEY1;
  else if (time >= 11 && time < 13) return process.env.GEMINI_API_KEY2;
  else if (time >= 13 && time < 16) return process.env.GEMINI_API_KEY3;
  else if (time >= 16 && time < 19) return process.env.GEMINI_API_KEY4;
  else if (time >= 19 && time < 22) return process.env.GEMINI_API_KEY1;
  else if (time >= 22 || time < 2) return process.env.GEMINI_API_KEY2;
  else if (time >= 2 && time < 5) return process.env.GEMINI_API_KEY3;
  else if (time >= 5 && time < 9) return process.env.GEMINI_API_KEY4;
  else return process.env.GEMINI_API_KEY1;
}

const ai = new GoogleGenAI({ apiKey: getAPIKey() });
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

async function ensureAdmin(ctx) {
  if (ctx.chat.type === "private") {
    return true;
  }
  try {
    const isAdmin = await isBotAdmin(ctx.chat.id);
    if (!isAdmin) {
      await ctx.reply(
        `⚠ Hello ${ctx.chat.title || "this group"}!\n\n` +
          `To ensure all features of this bot work properly, ` +
          `please grant the bot admin rights. Some functionalities may not work without it.`
      );
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`⚠ Could not check admin in ${ctx.chat.id}: ${err.message}`);
    return false;
  }
}

bot.command("loukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;

  let query = ctx.message.text.split(" ").slice(1).join(" ");

  if (ctx.message.reply_to_message) {
    const msg = await ctx.reply(
      "❌ Please use /replyloukya when replying to a message."
    );
    setTimeout(() => {
      ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    }, 10000);
    return;
  }

  if (!query) {
    const msg = await ctx.reply("❌ Usage: /loukya <your question>");
    setTimeout(() => {
      ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
    }, 10000);
    return;
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

    const logDir = path.join(__dirname, "..", "localDB", "AI");
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

bot.command("replyloukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;
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

    const logDir = path.join(__dirname, "..", "localDB", "AI");
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

bot.command("explainloukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;
  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Please reply to a message with /explainloukya.");
  }

  let originalText = ctx.message.reply_to_message.text;
  if (!originalText) {
    return ctx.reply("❌ The replied message has no text to explain.");
  }

  let query = `Explain this text in a clear and simple way as if you are talking to a beginner. 
Use a conversational style, with step-by-step explanation, examples if needed, 
and avoid just repeating the same words. Here is the text:\n\n"${originalText}"`;

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

    const logDir = path.join(__dirname, "..", "localDB", "AI");
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

bot.command("answerloukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;
  if (!ctx.message.reply_to_message) {
    return ctx.reply("❌ Please reply to a message with /answerloukya.");
  }

  let originalText = ctx.message.reply_to_message.text;
  if (!originalText) {
    return ctx.reply("❌ The replied message has no text to answer.");
  }

  let query = `Give a direct, clear, and concise answer to the following question. \n\n"${originalText}"`;

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

    const logDir = path.join(__dirname, "..", "localDB", "AI");
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
