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
  ctx.reply("✅ Facts enabled in this chat.");
});

bot.command("stopfacts", async (ctx) => {
  await Chat.updateOne(
    { chatId: ctx.chat.id },
    { $set: { factsEnabled: false } }
  );
  ctx.reply("🛑 Facts disabled in this chat.");
});

module.exports = { getFact };
