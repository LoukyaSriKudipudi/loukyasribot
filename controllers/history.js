const bot = require("../utils/telegramBot");
const User = require("../models/userModel");
const { decryptText } = require("../utils/crypto");
const password = process.env.CRYPTO_SECRET;
bot.command("history", async (ctx) => {
  const user = await User.findOne({ telegramId: ctx.from.id });
  if (!user || !user.messages.length) {
    return ctx.reply("No messages saved yet.");
  }

  const decryptedMessages = await Promise.all(
    user.messages.map(async (m) => {
      const text = await decryptText(password, m.text);
      return `\`${m._id}\`: \n${text}`;
    })
  );

  const list = decryptedMessages.join("\n\n");

  ctx.reply(
    `📝 Your messages:\n\n${list}\n\n📔Total Stored Messsages:\n${user.messages.length}`,
    { parse_mode: "Markdown" }
  );
});
