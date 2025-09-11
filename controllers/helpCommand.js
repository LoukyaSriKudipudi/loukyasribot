const bot = require("../utils/telegramBot");
const Chat = require("../models/chats");

bot.command("help", async (ctx) => {
  const chatId = ctx.chat.id;
  const topicId = ctx.message.message_thread_id; // works if in a forum topic

  const helpMessage = `
🤖 *Available Commands*:

/save <text>  
_Save a new message (max 250 chars). Stored securely with encryption._

/history  
_View all your saved messages (auto-decrypted). Shows message IDs._

/delete <id>  
_Delete a specific message by its ID._

/deleteAll  
_Delete all your saved messages._

/search <keyword>  
_Search saved messages by keyword._

/stats  
_View statistics about your saved messages._

/ask <question> 🤖  
_Ask the AI a question and get a concise 5-line summary answer_

/translate <language> <text> 🌐  
_Translate text to a specified language using AI_

/help  
_Show this help message._

🔒 *Note:* All messages are stored in encrypted form for your privacy.
  `;

  await bot.telegram.sendMessage(chatId, helpMessage, {
    ...(topicId ? { message_thread_id: topicId } : {}),
    parse_mode: "Markdown",
  });
});
