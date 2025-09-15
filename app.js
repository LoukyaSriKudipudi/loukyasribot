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
const { broadcastQuiz } = require("./services/broadcastQuiz");
const { broadcastQuizQuestion } = require("./services/quizQuestionsService");

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

// Facts
cron.schedule("45 8-20 * * *", broadcastFact, {
  timezone: "Asia/Kolkata",
});

// Quizzes;
cron.schedule("15 9-21 * * *", broadcastQuizQuestion, {
  timezone: "Asia/Kolkata",
});

// cron.schedule("15,45 9-21 * * *", broadcastQuiz, {
//   timezone: "Asia/Kolkata",
// });

// new broadcast
// const { broadcastNews } = require("./services/messageNewsService");
// broadcastNews();

// new with image
// const { broadcastNewsWithImage } = require("./services/imageNewsService");
// broadcastNewsWithImage();

// forward news from loukya sri group
require("./services/forwardService");
