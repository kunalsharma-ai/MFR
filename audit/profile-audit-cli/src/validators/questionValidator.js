function normalize(text = "") {
  return text.toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function validateQuestions(questions) {
  const seen = new Map();
  const issues = [];

  for (const q of questions) {
    const key = normalize(q.label);

    if (seen.has(key)) {
      issues.push({
        type: "exact-duplicate-question",
        questions: [seen.get(key), q._id]
      });
    } else {
      seen.set(key, q._id);
    }

    if (q.isMoney && q.type !== "open end single line") {
      issues.push({
        type: "money-type-mismatch",
        question: q._id
      });
    }
  }

  return issues;
}

module.exports = { validateQuestions };