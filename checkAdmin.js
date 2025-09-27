// const fs = require("fs");
// const bot = require("./telegramBot");
// const Chat = require("../models/chats");

// const BOT_ID = 8459119310;

// async function saveAdminGroups() {
//   try {
//     const allChats = await Chat.find({});
//     const adminGroups = [];

//     for (const chat of allChats) {
//       if (!chat.chatId) continue;
//       let isAdmin = false;

//       try {
//         const admins = await bot.telegram.getChatAdministrators(chat.chatId);
//         const botAdmin = admins.find((a) => a.user.id === BOT_ID);
//         if (botAdmin) {
//           isAdmin = true;
//         }
//       } catch (err) {
//         console.log(`Cannot access group ${chat.chatId}: ${err.message}`);
//         // Keep isAdmin false
//       }

//       adminGroups.push({
//         chatId: chat.chatId,
//         chatTitle: chat.chatTitle || "",
//         admin: isAdmin,
//       });
//     }

//     fs.writeFileSync("adminGroups.json", JSON.stringify(adminGroups, null, 2));
//     console.log("Admin groups saved to adminGroups.json");
//   } catch (err) {
//     console.error("Error fetching chats from DB:", err);
//   }
// }

// // Export the function
// // module.exports = saveAdminGroups;
