require("dotenv").config();
const bot = require("./utils/telegramBot");
const connectDB = require("./utils/db");
const cron = require("node-cron");
// Connect to MongoDB
connectDB();

// Load handlers
const start = require("./handlers/start");
start();
const newMember = require("./handlers/newMember");
newMember();
const setTopic = require("./handlers/setTopic");
setTopic();
require("./handlers/developer");

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
require("./services/factsService");
require("./services/ask");
require("./services/translate");
// forward news from loukya sri group
require("./services/forwardService");
require("./services/chatSettings");
// Event record
const eventRecordBot = require("./utils/eventRecordBot");

// Launch bots
bot.launch();
if (bot) console.log("---bot is running---");
eventRecordBot.launch();
if (eventRecordBot) console.log("---event record bot is running---");

cron.schedule("* * * * *", broadcastQuizQuestion, {
  timezone: "Asia/Kolkata",
});

cron.schedule("45 9-21/2 * * *", broadcastFact, {
  timezone: "Asia/Kolkata",
});

// const chatId = -1002298011339;
// const messageId = 4457;
// const message = "Thank You!";

// bot.telegram.sendMessage(chatId, message, {
//   reply_to_message_id: messageId,
// });

// bot.telegram.deleteMessage(chatId, messageId);

// cron.schedule("15,45 9-21 * * *", broadcastQuiz, {
//   timezone: "Asia/Kolkata",
// });

// new broadcast
// const { broadcastNews } = require("./services/messageNewsService");
// broadcastNews();

// new with image
// const { broadcastNewsWithImage } = require("./services/imageNewsService");
// broadcastNewsWithImage();
