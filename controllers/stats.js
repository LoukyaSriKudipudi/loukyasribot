const bot = require("../../loukyasribot/utils/telegramBot");
const User = require("../../loukyasribot/models/userModel");

bot.command("stats", async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user) return ctx.reply("No stats found.");

  const joinedAt = user.createdAt.toDateString();

  ctx.reply(
    `📊 Stats for ${ctx.from.first_name}\n\n` +
      `Total Saved Messages: ${user.messages.length}\n` +
      `Joined: ${joinedAt}\n`
  );
});
