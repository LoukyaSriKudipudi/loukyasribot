const bot = require("../utils/telegramBot");
const Chat = require("../models/chats");

bot.command("help", async (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message.message_thread_id; // works if in a forum topic

  const helpMessage = `
🤖 *Available Commands*:

/loukya <question>   
_Get a quick answer directly (can be used in direct messages)_

/replyloukya <text>  
_Use as a reply to another message to get a reply from me_

/answerloukya <question>  
_Use as a reply to another message to get a detailed answer from me_

/explainloukya <text>   
_Use as a reply to another message to get a clear, concise explanation from me_

/startfacts  
_Enable fact broadcasts in this chat_

/stopfacts  
_Disable fact broadcasts in this chat_

/help  
_Show this help message._

🔒 *Note:* All messages are stored in encrypted form for your privacy.
`;

  await bot.telegram.sendMessage(chatId, helpMessage, {
    ...(topicId ? { message_thread_id: topicId } : {}),
    parse_mode: "Markdown",
  });
});
