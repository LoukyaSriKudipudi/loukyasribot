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

    await saveChat(chatID, null, chatTitle, null, chatType);

    if (botWasAdded) {
      await saveQuiz(chatID, null, chatTitle, null, chatType);

      ctx.reply(
        `👋 Thank you for adding me in ${chatTitle}! Quiz is now enabled.`
      );
    }
  });
};
