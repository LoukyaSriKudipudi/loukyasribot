const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");

module.exports = () => {
  bot.command("settopic", async (ctx) => {
    try {
      // Check for private chats
      if (ctx.chat.type === "private" || ctx.chat.id > 0) {
        try {
          const message = await ctx.reply(
            "❌ Facts and quizzes are not available in private chats."
          );
          setTimeout(
            () =>
              ctx.telegram
                .deleteMessage(ctx.chat.id, message.message_id)
                .catch(() => {}),
            10000
          );
        } catch {
          // ignore if reply fails
        }
        return;
      }

      const chatId = ctx.chat.id;
      const chatTitle = ctx.chat.title || ctx.from.first_name || null;
      const topicId = ctx.message.message_thread_id || null;

      // Save chat safely
      await saveChat(chatId, topicId, chatTitle).catch((err) => {
        console.error("⚠ Failed to save chat:", err.message);
      });

      // Send confirmation safely
      try {
        if (topicId) {
          await ctx.reply("📝 This topic has been set for update!");
        } else {
          await ctx.reply(
            "📝 Updates will be sent to the main chat (no topic)."
          );
        }
      } catch {
        // ignore send errors (e.g., bot has no permission)
      }
    } catch (err) {
      console.error("⚠ /settopic command failed:", err.message);
    }
  });
};
