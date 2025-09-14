const fs = require("fs");
const path = require("path");

const quizFile = fs.readFileSync(
  path.join(__dirname, "..", "localDB", "quiz.json")
);
const questions = JSON.parse(quizFile);
let index = 0;

function getQuestion() {
  const question = questions[index];
  index = (index + 1) % questions.length;
  return question;
}

module.exports = { getQuestion };
