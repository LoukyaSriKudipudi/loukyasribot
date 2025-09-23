require("dotenv").config();
const mongoose = require("mongoose");
const Chat = require("./models/chats"); // Your chat model

const mongoUri = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

async function resetLastQuizMessageId() {
  try {
    const result = await Chat.updateMany(
      {}, // All documents
      { $set: { lastQuizMessageId: null } }
    );

    console.log(
      `🎯 lastQuizMessageId set to null for ${result.modifiedCount} chats.`
    );
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Error updating lastQuizMessageId:", error);
    mongoose.connection.close();
  }
}

resetLastQuizMessageId();
