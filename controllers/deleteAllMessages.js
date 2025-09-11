const bot = require("../utils/telegramBot");
const User = require("../models/userModel");

bot.command("deleteall", async (ctx) => {
  const telegramId = ctx.from.id;

  const user = await User.findOneAndUpdate(
    { telegramId },
    { $set: { messages: [] } }, // reset array
    { new: true }
  );

  if (!user) {
    return ctx.reply("⚠️ No user found.");
  }

  ctx.reply("🗑️ All your messages have been deleted.");
});
