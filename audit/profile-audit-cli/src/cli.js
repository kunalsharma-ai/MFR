import { connectDB } from "./db.js";
import Question from "./models/Question.js";
import Option from "./models/Option.js";
import { validateQuestions } from "./validators/questionValidator.js";
import { validateOptions } from "./validators/optionValidator.js";
import { detectNearDuplicates } from "./validators/fuzzyDetector.js";
import { analyzeWithGemma } from "./ai/gemmaClient.js";
import { buildReport } from "./report/reportBuilder.js";

async function run() {
  console.log("Lets start...")
  await connectDB();

  const questions = await Question.find({});
  console.log(`Total Questions found: ${questions.length}`)
  console.log("Validating questions...");
  const qIssues = validateQuestions(questions);
  console.log("Detecting near duplicates...");

  const fuzzyIssues = detectNearDuplicates(questions);

  console.log("Validating options...");
  const optionIssues = await validateOptions(Question, Option);

  console.log("Running semantic clustering...");
  for (let index = 0; index < questions.length; index++) {
    const question = questions[index];
    const semantic = await analyzeWithGemma(
      {
        label: question.label,
        type: question.type,
        isMoney: question.isMoney ?? false
      }
    );
    console.log(semantic)

  }
  buildReport({
    summary: {
      totalQuestions: questions.length
    },
    qIssues,
    fuzzyIssues,
    optionIssues
  });

  //  process.exit();
  //   */
}

run();
