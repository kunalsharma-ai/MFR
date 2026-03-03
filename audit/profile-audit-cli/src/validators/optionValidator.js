function normalize(text = "") {
  return text.toLowerCase().replace(/[-_]/g, " ").replace(/\s+/g, " ").trim();
}

async function validateOptions(Question, Option) {
  const issues = [];

  const questions = await Question.find().lean();

  for (const q of questions) {
    const cursor = Option.find({ question: q.name }).cursor();

    const seen = new Map();

    for await (const opt of cursor) {
      const key = normalize(opt.label);

      if (!opt.label || !opt.value) {
        issues.push({
          type: "empty-option-field",
          question: q._id,
          option: opt._id
        });
      }

      if (seen.has(key)) {
        issues.push({
          type: "duplicate-option",
          question: q._id,
          options: [seen.get(key), opt._id]
        });
      } else {
        seen.set(key, opt._id);
      }
    }
  }

  return issues;
}

module.exports = { validateOptions };