const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");
const { GoogleGenAI } = require("@google/genai");
const isBotAdmin = require("../utils/isBotAdmin");

function getAPIKey() {
  const time = new Date().getHours();

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

function getAI() {
  const { GoogleGenAI } = require("@google/genai");
  return new GoogleGenAI({ apiKey: getAPIKey() });
}

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
    try {
      await ctx.reply(
        "⚠ AI features work only in groups. Add me to a group to use my AI powers!"
      );
      return false;
    } catch (err) {}
  }

  try {
    const isAdmin = await isBotAdmin(ctx.chat.id);
    if (!isAdmin) {
      try {
        await ctx.reply(
          `I’m not an admin yet, so I don’t have permission to send generated messages. My AI features won’t work in this chat.`
        );
        return false;
      } catch (err) {}
    }
    return true;
  } catch (err) {
    console.log(`⚠ Could not check admin in ${ctx.chat.id}: ${err.message}`);
    return false;
  }
}

const groupSessions = {};
const botMessageSessions = {};

bot.command("loukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;

  const query = ctx.message.text.split(" ").slice(1).join(" ");

  if (query.length > 150) {
    const warnMsg = await ctx.reply(
      "❌ Your message is too long. Please keep it under 150 characters.",
      { reply_to_message_id: ctx.message.message_id }
    );
    setTimeout(() => {
      ctx.telegram
        .deleteMessage(ctx.chat.id, warnMsg.message_id)
        .catch(() => {});
    }, 10000);
    return;
  }

  if (ctx.message.reply_to_message) {
    try {
      const msg = await ctx.reply(
        "❌ Please use /replyloukya when replying to a message."
      );
      setTimeout(() => {
        ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
      }, 10000);
      return;
    } catch (err) {}
  }

  if (!query) {
    try {
      const msg = await ctx.reply("❌ Usage: /loukya <your question>");
      setTimeout(() => {
        ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
      }, 10000);
      return;
    } catch (err) {}
  }

  try {
    const loadingMsg = await ctx.reply("⏳ Thinking...");

    const userId = ctx.from.id;

    // 🔹 Clear previous session completely
    groupSessions[userId] = [];

    // Initialize new session with this query
    groupSessions[userId].push({ role: "user", text: query });

    const conversation = groupSessions[userId].map((m) => m.text);
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: conversation,
    });

    const data = cleanText(response.text);
    groupSessions[userId].push({ role: "model", text: data });

    await ctx.telegram
      .deleteMessage(ctx.chat.id, loadingMsg.message_id)
      .catch(() => {});

    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      const sentMsg = await ctx.reply(chunk, {
        reply_to_message_id: ctx.message.message_id,
        protect_content: true,
      });
      botMessageSessions[sentMsg.message_id] = userId;
    }

    // Logging
    const userName = ctx.from.first_name || "unknown";
    const fileName = `user_${userId}.txt`;
    const logDir = path.join(__dirname, "..", "localDB", "AI");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const filePath = path.join(logDir, fileName);
    fs.appendFileSync(
      filePath,
      `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
    );
  } catch (err) {
    console.error("❌ Error:", err);
    try {
      ctx.reply("❌ Something went wrong. Try again later.");
    } catch (err) {}
  }
});

bot.use(async (ctx, next) => {
  const msg = ctx.message;

  if (!msg || msg.chat.type === "private") return next();
  if (msg.poll || msg.poll_answer) return next();
  if (msg.text?.startsWith("/")) return next();
  if (!msg.text || msg.text.trim() === "") return next();

  if (
    !msg.reply_to_message ||
    msg.reply_to_message.from.id !== ctx.botInfo.id
  ) {
    return next();
  }
  if (!msg.reply_to_message.text) return next();
  if (msg.reply_to_message.poll) return next();

  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;

  const query = msg.text?.trim();
  if (!query) return next();

  try {
    const repliedMsgId = msg.reply_to_message.message_id;
    const originalUserId = botMessageSessions[repliedMsgId] || ctx.from.id;

    // Initialize session if needed
    if (!groupSessions[originalUserId]) groupSessions[originalUserId] = [];
    groupSessions[originalUserId].push({ role: "user", text: query });

    // Keep last 6 messages only
    if (groupSessions[originalUserId].length > 6) {
      groupSessions[originalUserId] = groupSessions[originalUserId].slice(-6);
    }

    const conversation = groupSessions[originalUserId].map((m) => m.text);

    // Send temporary "thinking" message
    const loadingMsg = await ctx.reply("⏳ Thinking...");

    // Generate AI response
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: conversation,
    });

    const data = cleanText(response.text || "❌ No response.");
    groupSessions[originalUserId].push({ role: "model", text: data });

    // Delete loading message
    await ctx.telegram
      .deleteMessage(ctx.chat.id, loadingMsg.message_id)
      .catch(() => {});

    // Split and send response
    const chunks = splitMessage(data);
    for (const chunk of chunks) {
      const sentMsg = await ctx.reply(chunk, {
        reply_to_message_id: msg.message_id,
        protect_content: true,
      });

      // Save mapping for future replies
      botMessageSessions[sentMsg.message_id] = originalUserId;
    }
  } catch (err) {
    console.error("❌ Reply handler error:", err);
    try {
      await ctx.reply("❌ Something went wrong. Try again later.");
    } catch (err) {}
  }

  // Call next middleware/handler
  await next();
});

bot.command("replyloukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;
  if (!ctx.message.reply_to_message) {
    try {
      return ctx.reply("❌ Please reply to a message with /replyloukya.");
    } catch (err) {}
  }

  let query = ctx.message.reply_to_message.text;

  if (query.length > 150) {
    try {
      const warnMsg = await ctx.reply(
        "❌ Your message is too long. Please keep it under 150 characters.",
        { reply_to_message_id: ctx.message.message_id }
      );
      setTimeout(() => {
        ctx.telegram
          .deleteMessage(ctx.chat.id, warnMsg.message_id)
          .catch(() => {});
      }, 10000);
      return;
    } catch (err) {}
  }

  if (!query) {
    try {
      return ctx.reply("❌ The replied message has no text to explain.");
    } catch (err) {}
  }

  try {
    const loadingMsg = await ctx.reply("⏳ Thinking...");
    const ai = getAI();
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
    try {
      ctx.reply("❌ Something went wrong. Try again later.");
    } catch (err) {}
  }
});

bot.command("explainloukya", async (ctx) => {
  const canRun = await ensureAdmin(ctx);
  if (!canRun) return;
  if (!ctx.message.reply_to_message) {
    try {
      return ctx.reply("❌ Please reply to a message with /explainloukya.");
    } catch (err) {}
  }

  let originalText = ctx.message.reply_to_message.text;

  if (originalText.length > 150) {
    try {
      const warnMsg = await ctx.reply(
        "❌ Your message is too long. Please keep it under 150 characters.",
        { reply_to_message_id: ctx.message.message_id }
      );
      setTimeout(() => {
        ctx.telegram
          .deleteMessage(ctx.chat.id, warnMsg.message_id)
          .catch(() => {});
      }, 10000);
      return;
    } catch (err) {}
  }

  if (!originalText) {
    try {
      return ctx.reply("❌ The replied message has no text to explain.");
    } catch (err) {}
  }

  let query = `Explain briefly:\n\n"${originalText}"`;

  try {
    const loadingMsg = await ctx.reply("⏳ Thinking...");
    const ai = getAI();
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
    try {
      return ctx.reply("❌ Please reply to a message with /answerloukya.");
    } catch (err) {}
  }

  let originalText = ctx.message.reply_to_message.text;
  if (originalText.length > 150) {
    try {
      const warnMsg = await ctx.reply(
        "❌ Your message is too long. Please keep it under 150 characters.",
        { reply_to_message_id: ctx.message.message_id }
      );
      setTimeout(() => {
        ctx.telegram
          .deleteMessage(ctx.chat.id, warnMsg.message_id)
          .catch(() => {});
      }, 10000);
      return;
    } catch (err) {}
  }
  if (!originalText) {
    try {
      return ctx.reply("❌ The replied message has no text to answer.");
    } catch (err) {}
  }

  let query = `Give a direct, clear, and concise answer to the following question. \n\n"${originalText}"`;

  try {
    const loadingMsg = await ctx.reply("⏳ Thinking...");
    const ai = getAI();
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
    try {
      ctx.reply("❌ Something went wrong. Try again later.");
    } catch (err) {}
  }
});

// const sessions = {};

// function splitMessage(text, limit = 3000) {
//   const chunks = [];
//   let start = 0;
//   while (start < text.length) {
//     chunks.push(text.slice(start, start + limit));
//     start += limit;
//   }
//   return chunks;
// }

// function cleanText(text) {
//   return text
//     .replace(/^\s*\*\s+/gm, "• ")
//     .replace(/\*\*(.*?)\*\*/g, "$1")
//     .replace(/\*/g, "")
//     .trim();
// }

// bot.on(message("text"), async (ctx) => {
//   if (ctx.chat.type !== "private") return;

//   const userId = ctx.from.id;
//   const userName = ctx.from.first_name || "unknown";
//   const query = ctx.message.text?.trim();
//   if (!query || query.startsWith("/")) return;

//   if (!sessions[userId]) sessions[userId] = [];

//   sessions[userId].push({ role: "user", text: query });

//   if (sessions[userId].length > 6) {
//     sessions[userId] = sessions[userId].slice(-6);
//   }

//   try {
//     const loadingMsg = await ctx.reply("⏳ Thinking...");

//     const conversation = sessions[userId].map((m) => m.text);

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash-lite",
//       contents: conversation,
//     });

//     let data = response.text || "❌ No response.";
//     data = cleanText(data);

//     await ctx.telegram
//       .deleteMessage(ctx.chat.id, loadingMsg.message_id)
//       .catch(() => {});

//     const chunks = splitMessage(data);
//     for (const chunk of chunks) {
//       await ctx.reply(chunk, {
//         reply_to_message_id: ctx.message.message_id,
//         protect_content: true,
//       });
//     }

//     sessions[userId].push({ role: "model", text: data });

//     const logDir = path.join(__dirname, "..", "localDB", "AI");
//     if (!fs.existsSync(logDir)) {
//       fs.mkdirSync(logDir, { recursive: true });
//     }
//     const filePath = path.join(logDir, `user_${userId}.txt`);
//     fs.appendFileSync(
//       filePath,
//       `\n=== ${new Date().toISOString()} ===\nUser: ${userName} (${userId})\nQuery: ${query}\nResponse: ${data}\n`
//     );
//   } catch (err) {
//     console.error("❌ Error:", err);
//     ctx.reply("❌ Something went wrong. Try again later.");
//   }
// });
