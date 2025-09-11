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

        return ctx.reply(`Welcome back ${first_name}!`);
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
      ctx.reply(
        `👋 Hello ${first_name}!\n\n` +
          `I am @${ctx.botInfo.username}, your exam preparation assistant.\n\n` +
          `➡️ Add me to a group for updates.\n` +
          `➡️ Use /settopic in a topic if you want updates there.\n\n` +
          `🛠️ Use /help to see all available commands.\n\n` +
          `📌 I will start sending facts once I'm added to a group!`
      );

      console.log("New User Saved:", id);
    } catch (err) {
      console.error("Bot error:", err);
      ctx.reply("Something went wrong, try again later.");
    }
  });
};
