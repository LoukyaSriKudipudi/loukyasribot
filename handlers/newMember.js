const { saveChat } = require("../utils/saveChat");
const { saveQuiz } = require("../utils/saveQuiz");
const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");

module.exports = () => {
  bot.on(message("new_chat_members"), async (ctx) => {
    const newMembers = ctx.message.new_chat_members;
    const botWasAdded = newMembers.some((m) => m.id === ctx.botInfo.id);

    const chatID = ctx.chat.id;
    const chatType = ctx.chat.type;
    const chatTitle = ctx.chat.title || ctx.from.first_name || null;

    // Save chat
    try {
      await saveChat(chatID, null, chatTitle, null, chatType);
    } catch (err) {
      console.error("Error saving chat:", err.message);
    }

    if (botWasAdded) {
      try {
        await saveQuiz(chatID, null, chatTitle, null, chatType);
      } catch (err) {
        console.error("Error saving quiz:", err.message);
      }

      // Delay welcome message to avoid Telegram permission issues
      setTimeout(async () => {
        try {
          await ctx.reply(
            `👋 😍 Thank you for adding me in ${chatTitle}! 🥰\n\n` +
              `⚠️ Please grant me *admin rights* so *I can work smoothly.*\n\n` +
              `🌸 I (*${ctx.botInfo.username}*) am unlike anything else on Telegram!  \n\n` +
              `✨ *The most advanced all-in-one bot:*  \n` +
              `📚 Answer questions & explain concepts  \n` +
              `📢 Broadcast *facts and quizzes* every hour, 24/7  \n` +
              `🗂 Manage topics smartly  \n` +
              `🙈 Hide join/leave messages  \n` +
              `🚫 Remove unwanted links  \n\n` +
              `💡 Other bots do a little — 🔥 *I do it all, in one place!*\n\n` +
              `👉 *Curious?* Use */help* command and discover my features ✨`,
            { parse_mode: "Markdown" }
          );
        } catch (err) {
          console.warn(
            "Cannot send welcome message. Bot might not have permission yet."
          );
        }
      }, 1500);
    }
  });
};
