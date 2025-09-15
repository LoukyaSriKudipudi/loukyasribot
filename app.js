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

// Load controllers
require("./controllers/history");
require("./controllers/deleteAllMessages");
require("./controllers/deleteMessage");
require("./controllers/stats");
require("./controllers/searchMessages");
require("./controllers/saveMessage");
require("./controllers/helpCommand");

// Services
const { broadcastFact } = require("./services/updateService");
const { broadcastQuiz } = require("./services/broadcastQuiz"); // <-- import quiz
require("./services/ask");
require("./services/translate");

// Event record
const eventRecordBot = require("./utils/eventRecordBot");

// Start handlers
start();
newMember();
setTopic();

// Launch bots
bot.launch();
if (bot) console.log("---bot is running---");
eventRecordBot.launch();
if (eventRecordBot) console.log("---event record bot is running---");

// Cron jobs
cron.schedule("0 9-21 * * *", broadcastFact, {
  timezone: "Asia/Kolkata",
});

// cron.schedule("15,45 9-21 * * *", broadcastQuiz, {
//   timezone: "Asia/Kolkata",
// });
