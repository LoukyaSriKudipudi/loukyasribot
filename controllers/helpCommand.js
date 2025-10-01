const bot = require("../../loukyasribot/utils/telegramBot");
const Chat = require("../../loukyasribot/models/chats");

bot.command("help", async (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message.message_thread_id;

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

/joinhider  
_Toggle hiding of join/leave messages in this group_

/urlremover  
_Toggle automatic removal of links from non-admin users_

/developer  
_Show developer information_

/help  
_Show this help message._
`;

  await bot.telegram.sendMessage(chatId, helpMessage, {
    ...(topicId ? { message_thread_id: topicId } : {}),
    parse_mode: "Markdown",
  });
});
