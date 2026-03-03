const levenshtein = require("fast-levenshtein");

function similarity(a, b) {
  const distance = levenshtein.get(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function detectNearDuplicates(questions) {
  const issues = [];

  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sim = similarity(
        questions[i].label.toLowerCase(),
        questions[j].label.toLowerCase()
      );

      if (sim > 0.85) {
        issues.push({
          type: "near-duplicate-question",
          questions: [questions[i]._id, questions[j]._id],
          similarity: sim
        });
      }
    }
  }

  return issues;
}

module.exports = { detectNearDuplicates };