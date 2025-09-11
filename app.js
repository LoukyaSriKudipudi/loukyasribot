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

// load controllers
require("./controllers/history");
require("./controllers/deleteAllMessages");
require("./controllers/deleteMessage");
require("./controllers/stats");
require("./controllers/searchMessages");
require("./controllers/saveMessage");
require("./controllers/helpCommand");

// services
const { broadcastFact } = require("./services/updateService");
require("./services/ask");
require("./services/translate");

start();
newMember();
setTopic();
bot.launch();
if (bot) console.log("---bot is running---");

cron.schedule("*/30 9-21 * * *", broadcastFact, {
  timezone: "Asia/Kolkata",
});
