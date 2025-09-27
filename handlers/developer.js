const bot = require("../utils/telegramBot");
const Chat = require("../models/chats");
const ChatSettings = require("../models/chatSettingsModel");
const User = require("../models/userModel");
const { Markup } = require("telegraf");

// Developer info
bot.command("developer", async (ctx) => {
  await ctx.replyWithHTML(
    `👩‍💻 <b>Developer Info</b>\n\n` +
      `Name: <b>Loukya Sri Kudipudi</b>\n` +
      `Telegram: @LoukyaSri\n` +
      `🌐 Bot Website: <a href="https://bot.loukyasri.pro/">bot.loukyasri.pro</a>\n` +
      `📂 Portfolio: <a href="https://loukyasri.pro/">loukyasri.pro</a>\n\n` +
      `💡 Want a similar or custom bot? Contact @LoukyaSri.`
  );
});

// Delete user and chat data, including chat settings
bot.command("deletemydata", async (ctx) => {
  try {
    const telegramId = ctx.from.id;

    // Delete user data
    const deletedUser = await User.findOneAndDelete({ telegramId });

    // Delete chat data
    const deletedChat = await Chat.findOneAndDelete({ chatId: telegramId });

    // Delete chat settings
    const deletedSettings = await ChatSettings.findOneAndDelete({
      chatId: telegramId,
    });

    if (deletedUser || deletedChat || deletedSettings) {
      await ctx.reply(
        "✅ Your user data, chat data, and chat settings have been deleted successfully."
      );
    } else {
      await ctx.reply("⚠️ No data found for your account.");
    }
  } catch (error) {
    console.error("Error deleting data:", error);
    await ctx.reply("⚠️ Something went wrong while deleting your data.");
  }
});

// Fetch stats
const getStats = async () => {
  try {
    const groupsCount = await Chat.countDocuments();
    const usersCount = await User.countDocuments();
    const quizEnabledCount = await Chat.countDocuments({ quizEnabled: true });

    return { groupsCount, usersCount, quizEnabledCount };
  } catch (err) {
    console.error("Error fetching stats:", err);
    return { groupsCount: 0, usersCount: 0, quizEnabledCount: 0 };
  }
};

// Stats command
bot.command("stats", async (ctx) => {
  const { groupsCount, usersCount, quizEnabledCount } = await getStats();

  await ctx.replyWithHTML(
    `👥 Total Users: <b>${groupsCount}</b>\n` +
      `📝 Facts and Quizzes Enabled in <b>${quizEnabledCount}</b> Groups\n` +
      `🌐 Visit website: https://bot.loukyasri.pro/`
  );
});
