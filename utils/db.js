const mongoose = require("mongoose");

const DB = process.env.DATABASE.replace(
  "<db_password>",
  process.env.DATABASE_PASSWORD
);

function connectDB() {
  mongoose.connect(DB).then(() => {
    console.log(`---DB Connection Sucessfull---`);
  });
}
module.exports = connectDB;
