const fs = require("fs");
const path = require("path");

const factsFile = fs.readFileSync(
  path.join(__dirname, "..", "localDB", "facts.json")
);

const facts = JSON.parse(factsFile);
let index = 0;

function getFact() {
  const fact = facts[index];
  index = (index + 1) % facts.length;
  return fact;
}

const Chat = require("../models/chats");
const bot = require("../utils/telegramBot");

bot.command("startfacts", async (ctx) => {
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    const message = await ctx.reply(
      "❌ Facts and quizzes are not available in private chats."
    );
    setTimeout(
      () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
      10000
    );
    return;
  }
  const nextTime = new Date(Date.now() + 60 * 60 * 1000); // first quiz 30 mins later

  await Chat.updateOne(
    { chatId: ctx.chat.id },
    {
      $set: {
        factsEnabled: true,
        quizEnabled: true,
        chatTitle: ctx.chat.title,
        nextQuizTime: nextTime,
        quizFrequencyMinutes: 60, // optional, store frequency
      },
    },
    { upsert: true }
  );

  setTimeout(() => ctx.deleteMessage(ctx.message.message_id), 3000);

  const message = await ctx.reply("✅ Facts and quizzes enabled in this chat.");

  setTimeout(
    () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
    30000
  );
});

bot.command("stopfacts", async (ctx) => {
  if (ctx.chat.type === "private" || ctx.chat.id > 0) {
    const message = await ctx.reply(
      "❌ No facts/quizzes are running in private chats."
    );
    setTimeout(
      () => ctx.telegram.deleteMessage(ctx.chat.id, message.message_id),
      10000
    );
    return;
  }
  await Chat.updateOne(
    { chatId: ctx.chat.id },
    { $set: { factsEnabled: false, quizEnabled: false, nextQuizTime: null } }
  );

  setTimeout(() => {
    ctx.deleteMessage(ctx.message.message_id);
  }, 3000);

  const message = await ctx.reply(
    "🛑 Facts and quizzes disabled in this chat."
  );
  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
  }, 30000);
});

module.exports = { getFact };
