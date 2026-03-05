import fetch from "node-fetch";
import { ollamaUrl, model } from "../config.js";

export async function analyzeWithGemma(payload) {
  console.log(payload)
  const prompt = `
You are a survey architect.
find typoes and return corrections as well.
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
