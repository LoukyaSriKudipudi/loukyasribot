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
    require("./handlers/shutdown");
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

    cron.schedule(
      "0 6-21 * * *",
      async () => {
        await checkAndUpdateCanSend();
      },
      { timezone: "Asia/Kolkata" }
    );
    console.log("---All cron jobs scheduled---");
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// // // send message
// const chatId = -10018806;
// const messageId = 393;
// const message = "Thank You!";
// bot.telegram.sendMessage(chatId, message, {
//   reply_to_message_id: messageId,
// });

// // // send photo with cap
// const path = require("path");
// const chatId = -100206;
// const messageId = 108;
// const imagePath = path.join(__dirname, "localDB", "images", "image.png");
// bot.telegram.sendPhoto(
//   chatId,
//   { source: imagePath },
//   {
//     reply_to_message_id: messageId,
//     caption:
//       "Trump: Nobel for peace? Maybe… but my tariffs deserve a prize too!",
//   }
// );

// // // delete a message
// const chatId = -100206;
// const messageId = 108;
// bot.telegram.deleteMessage(chatId, messageId);

// facts cron
// cron.schedule("45 9-21/2 * * *", broadcastFact, {
//   timezone: "Asia/Kolkata",
// });
