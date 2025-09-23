const bot = require("../utils/telegramBot");
const Chat = require("../models/chats");
const User = require("../models/userModel");
const { message } = require("telegraf/filters");
const getChatsCount = async () => {
  try {
    return await Chat.countDocuments({ quizEnabled: true });
  } catch (err) {
    console.error("Error fetching group count:", err);
    return 0;
  }
};

bot.command("developer", async (ctx) => {
  if (ctx.chat.type === "private") {
    const activeGroups = await getChatsCount();

    await ctx.replyWithHTML(
      `👩‍💻 <b>Developer Info</b>\n\n` +
        `Name: <b>Loukya Sri Kudipudi</b>\n` +
        `Telegram: @LoukyaSri\n` +
        ` \n` +
        `📊 Currently Bot is Active in <b>${activeGroups}</b> Groups\n` +
        ` \n` +
        `🌐 Visit website: https://bot.loukyasri.pro/`
    );
  }
});

bot.command("deletemydata", async (ctx) => {
  try {
    const telegramId = ctx.from.id;

    await User.findOneAndDelete({ telegramId });
    await Chat.findOneAndDelete({ chatId: telegramId });

    await ctx.reply("✅ Your data has been deleted successfully.");
  } catch (error) {
    console.error("Error deleting data:", error);
    await ctx.reply("⚠️ Something went wrong while deleting your data.");
  }
});
