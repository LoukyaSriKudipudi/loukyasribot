require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(async (ctx, next) => {
  const msg = ctx.message;
  if (!msg || !msg.text || msg.text.trim() === "") return next();

  const text = msg.text.trim();

  const repliedMsg = msg.reply_to_message;
  if (!repliedMsg || repliedMsg.from.id !== ctx.botInfo.id) return next();
  if (!repliedMsg.text) return next();
  if (repliedMsg.poll) return next();

  if (text.length > 150) {
    await ctx.reply(
      "❌ Your message is too long. Please keep it under 150 characters.",
      {
        reply_to_message_id: msg.message_id,
      }
    );
    return;
  }

  await next();
});

module.exports = bot;
