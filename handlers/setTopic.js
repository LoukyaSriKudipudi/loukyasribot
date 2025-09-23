const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");

module.exports = () => {
  bot.command("settopic", async (ctx) => {
    if (ctx.chat.type === "private" || ctx.chat.id > 0) {
      const message = await ctx.reply(
        "❌ Facts and quizzes are not available in private chats."
      );
      setTimeout(
        () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
        10000
      );
      return;
    }
    const chatId = ctx.chat.id;
    const chatTitle = ctx.chat.title || ctx.from.first_name || null;
    const topicId = ctx.message.message_thread_id || null;

    await saveChat(chatId, topicId, chatTitle);

    if (topicId) ctx.reply("📝 This topic has been set for update!");
    else ctx.reply("📝 Updates will be sent to the main chat (no topic).");
  });
};
