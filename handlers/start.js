const { saveChat } = require("../utils/saveChat");
const bot = require("../utils/telegramBot");
const User = require("../models/userModel");
const { Markup } = require("telegraf");

module.exports = () => {
  bot.start(async (ctx) => {
    try {
      const chatType = ctx.chat.type;

      // Ignore /start in groups
      if (chatType === "group" || chatType === "supergroup") {
        return; // do nothing
      }

      // Private chat logic only
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
          `👋 Welcome back, *${first_name}!*\n\n` +
            `Glad to see you again. Use */help* anytime to check available commands.\n\n` +
            `📌 I will start sending Facts and Quizzes once you use */starquiz* in a group!\n\n` +
            `💡 Want a similar or custom bot? Contact */developer* or *@LoukyaSri*.`,
          {
            parse_mode: "Markdown",
            ...Markup.inlineKeyboard([
              [
                Markup.button.url(
                  "➕ Add me to your Group",
                  `https://t.me/${ctx.botInfo.username}?startgroup&admin=promote_members+change_info+post_messages+edit_messages+delete_messages+invite_users+restrict_members+pin_messages+manage_video_chats+manage_topics`
                ),
              ],
            ]),
          }
        );
      }

      // New User (First time start)
      await User.create({
        telegramId: id,
        username,
        firstName: first_name,
        lastName: last_name,
        messages: [],
        lastActive: new Date(),
      });

      await ctx.reply(
        `🌸 I’m *Loukya Sri* — The ultimate *Quiz Bot!*  \n\n` +
          `✅ I share *facts and quizzes* every hour, 24/7 — for APPSC, TGPSC, SSC, RRB, Police, and more  \n\n` +
          `📚 For quizzes in Telugu, use *@APPSCQuizBot* or *@TGPSCQuizBot*  \n\n` +
          `👉 Use */help* command to explore my features ✨`,
        {
          parse_mode: "Markdown",
          ...Markup.inlineKeyboard([
            [
              Markup.button.url(
                "➕ Add me to your Group",
                `https://t.me/${ctx.botInfo.username}?startgroup&admin=promote_members+change_info+post_messages+edit_messages+delete_messages+invite_users+restrict_members+pin_messages+manage_video_chats+manage_topics`
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
