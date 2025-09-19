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
  await Chat.updateOne(
    { chatId: ctx.chat.id },
    {
      $set: {
        factsEnabled: true,
        quizEnabled: true,
        chatTitle: ctx.chat.title,
      },
    },
    { upsert: true }
  );

  // Delete the command message after 3s
  setTimeout(() => {
    ctx.deleteMessage(ctx.message.message_id);
  }, 3000);

  const message = await ctx.reply("✅ Facts and quizzes enabled in this chat.");

  // Delete bot reply after 30s
  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
  }, 30000);
});

bot.command("stopfacts", async (ctx) => {
  await Chat.updateOne(
    { chatId: ctx.chat.id },
    { $set: { factsEnabled: false, quizEnabled: false } }
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
