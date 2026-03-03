const { connectDB } = require("./db");
const Question = require("./models/Question");
const Option = require("./models/Option");
const { validateQuestions } = require("./validators/questionValidator");
const { validateOptions } = require("./validators/optionValidator");
const { detectNearDuplicates } = require("./validators/fuzzyDetector");
const { analyzeWithGemma } = require("./ai/gemmaClient");
const { buildReport } = require("./report/reportBuilder");

async function run() {
  await connectDB();

  const questions = await Question.find().lean();

  console.log("Validating questions...");
  const qIssues = validateQuestions(questions);

  console.log("Detecting near duplicates...");
  const fuzzyIssues = detectNearDuplicates(questions);

  console.log("Validating options...");
  const optionIssues = await validateOptions(Question, Option);

  console.log("Running semantic clustering...");
  const semantic = await analyzeWithGemma(
    questions.map(q => ({ id: q._id, label: q.label }))
  );

  buildReport({
    summary: {
      totalQuestions: questions.length
    },
    qIssues,
    fuzzyIssues,
    optionIssues,
    semantic
  });

  process.exit();
}

run();