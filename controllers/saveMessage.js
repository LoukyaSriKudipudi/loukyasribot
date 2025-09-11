const bot = require("../utils/telegramBot");
const User = require("../models/userModel");
const { encryptText } = require("../utils/crypto");
const password = process.env.CRYPTO_SECRET;

bot.command("save", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" "); // join back into string

  if (!text) {
    return ctx.reply(
      "❌ Please provide text to save. Example:\n/save Remember this"
    );
  }

  if (text.startsWith("/")) return;

  const telegramId = ctx.from.id;
  const encrypted = await encryptText(password, text.slice(0, 250));

  const user = await User.findOneAndUpdate(
    { telegramId },
    {
      $push: {
        messages: {
          $each: [{ text: encrypted }],
          $slice: -50,
        },
      },
    },
    { upsert: true, new: true }
  );

  const lastMessage = user.messages[user.messages.length - 1];
  ctx.reply(`✅ Saved message with ID: \`${lastMessage._id}\``, {
    parse_mode: "Markdown",
  });
});
