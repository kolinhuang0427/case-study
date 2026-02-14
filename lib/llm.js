import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-5-nano-2025-08-07";

let client = null;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey });
  }
  return client;
}

function buildSystemPrompt() {
  return [
    "You are PartSelect's appliance parts assistant.",
    "You must stay strictly in scope: refrigerator and dishwasher parts, compatibility, install guidance, troubleshooting, and order support.",
    "If user request is out of scope, politely refuse and redirect to in-scope workflows.",
    "Never invent compatibility facts; if uncertain, state uncertainty.",
    "Use concise, practical, customer-friendly language.",
    "Return plain text only."
  ].join(" ");
}

export async function rewriteWithLlm({ userMessage, intent, context, response, toolCalls }) {
  const openai = getClient();
  if (!openai || !response?.content) {
    return {
      usedLlm: false,
      model: null,
      content: response?.content || ""
    };
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  try {
    const completion = await openai.responses.create({
      model,
      temperature: 0.2,
      max_output_tokens: 280,
      input: [
        { role: "system", content: buildSystemPrompt() },
        {
          role: "user",
          content: [
            "Rewrite the draft assistant response using the provided context.",
            "Keep factual details from tools unchanged.",
            "",
            `User message: ${userMessage}`,
            `Intent: ${intent}`,
            `Context: ${JSON.stringify(context || {})}`,
            `Tool calls: ${JSON.stringify(toolCalls || [])}`,
            `Draft response: ${JSON.stringify(response)}`
          ].join("\n")
        }
      ]
    });

    const content = (completion.output_text || "").trim();
    if (!content) {
      return {
        usedLlm: false,
        model,
        content: response.content
      };
    }

    return {
      usedLlm: true,
      model,
      content
    };
  } catch {
    return {
      usedLlm: false,
      model,
      content: response.content
    };
  }
}
