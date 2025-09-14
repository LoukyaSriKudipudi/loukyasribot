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
    { $set: { factsEnabled: true, chatTitle: ctx.chat.title } },
    { upsert: true }
  );

  setTimeout(() => {
    ctx.deleteMessage(ctx.message.message_id);
  }, 3000);

  const message = await ctx.reply("✅ Facts enabled in this chat.");

  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
  }, 30000);
});

bot.command("stopfacts", async (ctx) => {
  await Chat.updateOne(
    { chatId: ctx.chat.id },
    { $set: { factsEnabled: false } }
  );
  setTimeout(() => {
    ctx.deleteMessage(ctx.message.message_id);
  }, 3000);

  const message = await ctx.reply("🛑 Facts disabled in this chat.");
  setTimeout(() => {
    ctx.telegram.deleteMessage(ctx.chat.id, message.message_id);
  }, 30000);
});

module.exports = { getFact };
