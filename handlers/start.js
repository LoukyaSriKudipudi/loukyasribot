const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");
const User = require("../models/userModel");

module.exports = () => {
  bot.start(async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const chatTitle = ctx.chat.username || ctx.from.first_name;

      await saveChat(chatId, null, chatTitle);

      const { id, username, first_name, last_name } = ctx.from;
      const oldUser = await User.findOne({ telegramId: id });

      if (oldUser) {
        await User.updateOne(
          { telegramId: id },
          {
            $set: {
              username,
              firstName: first_name,
              lastName: last_name,
              lastActive: new Date(),
            },
          }
        );

        return ctx.reply(
          `👋 Welcome back, ${first_name}!\n\n` +
            `Glad to see you again. Use /help anytime to check available commands.`
        );
      }

      await User.create({
        telegramId: id,
        username,
        firstName: first_name,
        lastName: last_name,
        messages: [],
        lastActive: new Date(),
      });

      // Greeting (from old handler)
      await ctx.reply(
        `👋 Hello ${first_name}!\n\n` +
          `I am @${ctx.botInfo.username}, your exam preparation assistant.\n\n` +
          `➡️ Add me to a group for daily updates.\n` +
          `➡️ Use /settopic in a topic if you want updates there.\n\n` +
          `🤖 AI Commands you can use:\n` +
          `   • /loukya <question> → Quick answer\n` +
          `   • /replyloukya <text> → Get a reply\n` +
          `   • /answerloukya <question> → Detailed answer\n` +
          `   • /explainloukya <text> → Clear explanation with context\n\n` +
          `🛠️ Use /help to see all available commands.\n\n` +
          `📌 I will start sending facts once you use /startfacts in a group or here!`
      );

      console.log("New User Saved:", id);
    } catch (err) {
      console.error("Bot error:", err);
      ctx.reply("Something went wrong, try again later.");
    }
  });
};
