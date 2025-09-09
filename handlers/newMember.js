const { saveChat } = require("../utils/saveChat");
const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");

module.exports = () => {
  bot.on(message("new_chat_members"), async (ctx) => {
    const newMembers = ctx.message.new_chat_members;
    const botWasAdded = newMembers.some((m) => m.id === ctx.botInfo.id);
    const chatID = ctx.chat.id;
    const chatTitle = ctx.chat.title || ctx.from.first_name || null;

    await saveChat(chatID, null, chatTitle);

    if (botWasAdded) {
      ctx.reply(`👋 Thank you for adding me in ${chatTitle}!`);
    }
  });
};
