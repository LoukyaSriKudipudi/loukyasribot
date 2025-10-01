const bot = require("../utils/telegramBot");
const User = require("../models/userModel");

bot.command("search", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) {
    return ctx.reply(
      "❌ Please provide a search term. Example:\n/search hello"
    );
  }

  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user) return ctx.reply("⚠️ No user found.");

  const results = user.messages.filter((msg) =>
    msg.text.toLowerCase().includes(query.toLowerCase())
  );

  if (!results.length) {
    return ctx.reply("No matches found.");
  }

  const reply =
    `🔎 Found ${results.length} saved message(s):\n\n` +
    results.map((m) => `\`${m._id}\`: ${m.text}`).join("\n\n");

  ctx.reply(reply, { parse_mode: "Markdown" });
});
