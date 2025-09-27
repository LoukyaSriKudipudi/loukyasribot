const isBotAdmin = require("../utils/isBotAdmin");
const ChatSettings = require("../models/chatSettingsModel");
const bot = require("../utils/telegramBot");

// const urlRegex = /(https?:\/\/[^\s]+|t\.me\/[^\s]+)/gi;

async function canBotDeleteMessages(chatId) {
  const member = await bot.telegram.getChatMember(chatId, bot.botInfo.id);
  return member.can_delete_messages === true;
}

// helper to toggle any setting
async function toggleSetting(ctx, field) {
  const chatId = String(ctx.chat.id);
  const chatTitle = ctx.chat.title || "Private Chat";

  let settings = await ChatSettings.findOne({ chatId });
  if (!settings) {
    settings = new ChatSettings({ chatId, chatTitle, [field]: true });
  } else {
    settings[field] = !settings[field];
    settings.chatTitle = chatTitle;
  }

  await settings.save();
  return settings[field];
}

// Join hider command
bot.command("joinhider", async (ctx) => {
  const chatId = String(ctx.chat.id);

  if (ctx.chat.type === "private") {
    return ctx.reply("⚠️ This command works in groups only.");
  }

  if (!(await isBotAdmin(chatId))) {
    return ctx.reply(
      "⚠️ I need admin rights with *Delete Messages* permission to hide join/leave messages.",
      { parse_mode: "Markdown" }
    );
  }

  // Check if bot can delete messages
  if (!(await canBotDeleteMessages(chatId))) {
    return ctx.reply(
      "⚠️ I am admin but don't have *Delete Messages* permission. Please enable it to hide join/leave messages.",
      { parse_mode: "Markdown" }
    );
  }

  const isEnabled = await toggleSetting(ctx, "joinHider");
  ctx.reply(
    isEnabled
      ? "✅ Join/Leave messages will now be hidden."
      : "❌ Join/Leave messages will no longer be hidden."
  );
});

// Auto-delete join/leave messages
bot.on(["new_chat_members", "left_chat_member"], async (ctx) => {
  const chatId = String(ctx.chat.id);
  const settings = await ChatSettings.findOne({ chatId });

  if (settings?.joinHider) {
    try {
      await ctx.deleteMessage();
    } catch (err) {
      console.error("Join hider error:", err.message);
    }
  }
});

// URL remover command
bot.command("urlremover", async (ctx) => {
  const chatId = String(ctx.chat.id);

  if (ctx.chat.type === "private") {
    return ctx.reply("⚠️ This command works in groups only.");
  }

  if (!(await isBotAdmin(chatId))) {
    return ctx.reply(
      "⚠️ I need admin rights with *Delete Messages* permission to remove links.",
      { parse_mode: "Markdown" }
    );
  }

  // Check if bot actually has delete permission
  if (!(await canBotDeleteMessages(chatId))) {
    return ctx.reply(
      "⚠️ I am admin but don't have *Delete Messages* permission. Please enable it to remove links.",
      { parse_mode: "Markdown" }
    );
  }

  const isEnabled = await toggleSetting(ctx, "urlRemover");
  ctx.reply(
    isEnabled
      ? "✅ All messages with links will be removed."
      : "❌ Messages with links will no longer be removed."
  );
});

// Auto-delete links
bot.on("message", async (ctx) => {
  if (!ctx.message.text) return;

  try {
    const chatId = String(ctx.chat.id);
    const settings = await ChatSettings.findOne({ chatId });

    if (!settings?.urlRemover) return;

    let isAdmin = false;

    if (ctx.senderChat) {
      isAdmin = true;
    } else if (ctx.from) {
      const member = await ctx.getChatMember(ctx.from.id);
      if (["administrator", "creator"].includes(member.status)) {
        isAdmin = true;
      }
    }

    if (isAdmin) return;

    // Regex to match most links
    const urlRegex = /\b((https?:\/\/|www\.|t\.me\/)\S+)\b/i;

    if (urlRegex.test(ctx.message.text)) {
      await ctx.deleteMessage(); // delete the message

      // send a warning reply
      await ctx.reply(
        `⚠️ @${
          ctx.from?.username || ctx.from?.first_name || "User"
        }, your message was deleted because it contained a link.`
      );
    }
  } catch (err) {
    console.error("URL remover error:", err.message);
  }
});
