require("dotenv").config();
const bot = require("./utils/telegramBot");
const connectDB = require("./utils/db");
const cron = require("node-cron");

// DB connect
connectDB()
  .then(() => {
    // Essential services
    const newMember = require("./handlers/newMember");
    newMember();
    require("./services/factsService");
    require("./services/ask");
    require("./services/translate");
    require("./services/forwardService");
    require("./services/pvtFwdService");
    require("./services/chatSettings");

    // Broadcast services
    const { broadcastFact } = require("./services/updateService");
    const { broadcastQuiz } = require("./services/broadcastQuiz");
    const {
      broadcastQuizQuestion,
    } = require("./services/quizQuestionsService");

    // Handlers load
    const start = require("./handlers/start");
    start();

    const setTopic = require("./handlers/setTopic");
    setTopic();
    require("./handlers/developer");
    require("./controllers/helpCommand");

    // Event bot
    const eventRecordBot = require("./utils/eventRecordBot");

    // Launch bots
    bot.launch();
    console.log("---bot is running---");

    eventRecordBot.launch();
    console.log("---event record bot is running---");

    // Cron jobs
    cron.schedule("* * * * *", broadcastQuizQuestion, {
      timezone: "Asia/Kolkata",
    });

    const checkAndUpdateCanSend = require("./utils/canSend");

    cron.schedule("0 6-21 * * *", async () => {
      await checkAndUpdateCanSend();
    });
    console.log("---All cron jobs scheduled---");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// const chatId = -1001880696019;
// const messageId = 393141;
// const message = "Thank You!";
// bot.telegram.sendMessage(chatId, message, {
//   reply_to_message_id: messageId,
// });

// bot.telegram.deleteMessage(chatId, messageId);
// facts cron
// cron.schedule("45 9-21/2 * * *", broadcastFact, {
//   timezone: "Asia/Kolkata",
// });
