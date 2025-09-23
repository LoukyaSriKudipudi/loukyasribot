const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");
const User = require("../models/userModel");
const { Markup } = require("telegraf");

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
            `Glad to see you again. Use /help anytime to check available commands.\n\n` +
            `📌 I will start sending Facts and Quizzes once you use /startfacts in a group!\n\n` +
            `🌐 Visit website: https://bot.loukyasri.pro/`,
          Markup.inlineKeyboard([
            [
              Markup.button.url(
                "➕ Add me to your Group",
                `https://t.me/${ctx.botInfo.username}?startgroup=true`
              ),
            ],
          ])
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

      await ctx.reply(
        `👋 Hello *${first_name}*!\n\n` +
          `I am *@${ctx.botInfo.username}*, your exam preparation assistant.\n\n` +
          `📢 *What I Do:* 📝 Facts | ❓ Quizzes | 🔔 Updates — *9 AM to 10 PM*\n\n` +
          `➡️ Use */settopic* in a topic if you want updates there.\n\n` +
          `🛠️ Use */help* to see all available commands.\n\n` +
          `📌 I will start sending *Facts* and *Quizzes* once you use */startfacts* in a group!\n\n` +
          `🌐 Visit website: https://bot.loukyasri.pro/`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.url(
                "➕ Add me to your Group",
                `https://t.me/${ctx.botInfo.username}?startgroup=true`
              ),
            ],
          ]),
        }
      );
    } catch (err) {
      console.error("Bot error:", err);
      ctx.reply("Something went wrong, try again later.");
    }
  });
};
