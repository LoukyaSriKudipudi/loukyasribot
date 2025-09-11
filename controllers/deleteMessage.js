const bot = require("../utils/telegramBot");
const User = require("../models/userModel");

bot.command("delete", async (ctx) => {
  const args = ctx.message.text.split(" ");
  const messageId = args[1]; // /delete <id>

  if (!messageId) {
    return ctx.reply(
      "❌ Please provide a message ID. Example:\n/delete 64fa123abc..."
    );
  }

  const result = await User.findOneAndUpdate(
    { telegramId: ctx.from.id },
    { $pull: { messages: { _id: messageId } } },
    { new: true }
  );

  if (!result) return ctx.reply("⚠️ Could not find your user record.");

  const stillExists = result.messages.some(
    (m) => m._id.toString() === messageId
  );
  if (stillExists) {
    return ctx.reply("❌ Message not found or already deleted.");
  }

  ctx.reply(`✅ Message with ID \`${messageId}\` deleted.`, {
    parse_mode: "Markdown",
  });
});
