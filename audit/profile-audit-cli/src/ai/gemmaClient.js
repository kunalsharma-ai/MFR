const fetch = require("node-fetch");
const { ollamaUrl, model } = require("../config");

async function analyzeWithGemma(payload) {
  const prompt = `
You are a survey architect.
Group similar meaning questions.
Return JSON only.

${JSON.stringify(payload)}
`;

  const res = await fetch(ollamaUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false
    })
  });

  const data = await res.json();
  return data.response;
}

module.exports = { analyzeWithGemma };