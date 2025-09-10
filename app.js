require("dotenv").config();
const bot = require("./utils/telegramBot");
const connectDB = require("./utils/db");
const cron = require("node-cron");

// Connect to MongoDB
connectDB();

// Load handlers
const start = require("./handlers/start");
const newMember = require("./handlers/newMember");
const setTopic = require("./handlers/setTopic");

// services
const { broadcastFact } = require("./services/updateService");

start();
newMember();
setTopic();
bot.launch();
if (bot) console.log("---bot is running---");

cron.schedule("*/30 9-21 * * *", broadcastFact, {
  timezone: "Asia/Kolkata",
});
