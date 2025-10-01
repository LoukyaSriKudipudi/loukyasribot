require("dotenv").config();
const bot = require("./utils/telegramBot");
const connectDB = require("./utils/db");
const cron = require("node-cron");

// 1️⃣ Connect to MongoDB
connectDB()
  .then(() => {
    // 2️⃣ Load essential services first (dependencies)
    const newMember = require("./handlers/newMember");
    newMember();
    require("./services/factsService");
    require("./services/ask");
    require("./services/translate");
    require("./services/forwardService");
    require("./services/pvtFwdService");
    require("./services/chatSettings");

    // 3️⃣ Load update/broadcast services AFTER dependencies
    const { broadcastFact } = require("./services/updateService");
    const { broadcastQuiz } = require("./services/broadcastQuiz");
    const {
      broadcastQuizQuestion,
    } = require("./services/quizQuestionsService");

    // 4️⃣ Load handlers after DB and essential services are ready
    const start = require("./handlers/start");
    start();

    const setTopic = require("./handlers/setTopic");
    setTopic();
    require("./handlers/developer");

    // // 5️⃣ Load controllers
    // require("./controllers/history");
    // require("./controllers/deleteAllMessages");
    // require("./controllers/deleteMessage");
    // require("./controllers/stats");
    // require("./controllers/searchMessages");
    // require("./controllers/saveMessage");
    require("./controllers/helpCommand");

    // 6️⃣ Event record bot
    const eventRecordBot = require("./utils/eventRecordBot");

    // 7️⃣ Launch bots
    bot.launch();
    console.log("---bot is running---");

    eventRecordBot.launch();
    console.log("---event record bot is running---");

    // 8️⃣ Start cron jobs AFTER DB, services, and bots are ready
    cron.schedule("* * * * *", broadcastQuizQuestion, {
      timezone: "Asia/Kolkata",
    });
    cron.schedule("45 9-21/2 * * *", broadcastFact, {
      timezone: "Asia/Kolkata",
    });
    console.log("---All cron jobs scheduled---");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// const chatId = -1001880696019;
// const messageId = 392198;
// const message = "Thank You!";

// bot.telegram.sendMessage(chatId, message, {
//   reply_to_message_id: messageId,
// });

// bot.telegram.deleteMessage(chatId, messageId);
// https://t.me/venky123studyhub/392198
