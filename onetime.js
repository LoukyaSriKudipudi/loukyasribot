require("dotenv").config();
const mongoose = require("mongoose");
const Chat = require("./models/chats");

const mongoUri = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function updateFactFrequency() {
  try {
    const chats = await Chat.find({ factsEnabled: true });

    for (const chat of chats) {
      chat.factFrequencyMinutes = 60;
      await chat.save();
      console.log(`🔹 ${chat.chatTitle} → factFrequencyMinutes set to 60`);
    }

    console.log("✅ All existing fact-enabled chats updated successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error updating factFrequencyMinutes:", err);
    process.exit(1);
  }
}

updateFactFrequency();
