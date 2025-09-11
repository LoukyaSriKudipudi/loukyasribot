const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");

bot.command("translate", async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1);
  if (args.length < 2) {
    return ctx.reply("Usage: /translate <language> <text>");
  }

  const targetLang = args[0];
  const text = args.slice(1).join(" ");

  const query = `Translate the following text to ${targetLang} in a concise way:\n"${text}"`;

  try {
    const response = await fetch("https://apifreellm.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query }),
    });

    const data = await response.json();
    if (!data.response) return ctx.reply("❌ AI did not return a response.");

    ctx.reply(`🌐 Translation (${targetLang}):\n${data.response}`, {
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Translation failed. Try again later.");
  }
});
