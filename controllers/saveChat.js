const bot = require("../../loukyasribot/utils/telegramBot");
const User = require("../../loukyasribot/models/userModel");

bot.start(async (ctx) => {
  try {
    const { id, username, first_name, last_name } = ctx.from;

    const oldUser = await User.findOne({ telegramId: id });

    if (oldUser) {
      await User.updateOne(
        { telegramId: id },
        { $set: { username, firstName: first_name, lastName: last_name } }
      );
      return ctx.reply(`Welcome back ${first_name}!`);
    }

    await User.create({
      telegramId: id,
      username,
      firstName: first_name,
      lastName: last_name,
      messages: [],
    });
  } catch (err) {
    console.error("Bot error:", err);
    ctx.reply("Something went wrong, try again later.");
  }
});
