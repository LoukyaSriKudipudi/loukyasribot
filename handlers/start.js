const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");

module.exports = () => {
  bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const chatTitle = ctx.chat.username || ctx.from.first_name;

    await saveChat(chatId, null, chatTitle);

    ctx.reply(
      `👋 Hello ${ctx.from.first_name}!\n\n` +
        `I am @${ctx.botInfo.username}, your exam preparation assistant.\n\n` +
        `➡️ Add me to a group for updates.\n` +
        `➡️ Use /settopic in a topic if you want updates there.` +
        `📌 I will start sending facts once I'm added to a group!`
    );
  });
};
