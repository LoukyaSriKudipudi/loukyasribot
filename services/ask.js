const { message } = require("telegraf/filters");
const bot = require("../utils/telegramBot");

bot.command("ask", async (ctx) => {
  const query = ctx.message.text.split(" ").slice(1).join(" ");
  if (!query) return ctx.reply("❌ Please ask something after /ask");

  try {
    const prompt = `Answer the following question in a concise 5-line summary:\n\n${query}`;

    const response = await fetch("https://apifreellm.com/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt }),
    });

    const data = await response.json();
    const answer = data.response;

    ctx.reply(answer, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Something went wrong. Try again later.");
  }
});
