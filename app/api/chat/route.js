import { NextResponse } from "next/server";
import { handleChatTurn } from "../../../lib/agent";
import { rewriteWithLlm } from "../../../lib/llm";
import { trackEvent } from "../../../lib/telemetry";
import { listToolContracts } from "../../../lib/toolContracts";

export async function GET() {
  return NextResponse.json({
    tools: listToolContracts()
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const message = body?.message || "";
    const context = body?.context || {};

    const result = await handleChatTurn({ message, context });
    const llmResult = await rewriteWithLlm({
      userMessage: message,
      intent: result.intent,
      context: result.context,
      response: result.response,
      toolCalls: result.toolCalls
    });

    if (llmResult.content) {
      result.response = {
        ...result.response,
        content: llmResult.content
      };
    }

    trackEvent("chat_turn", {
      intent: result.intent,
      applianceType: result.context?.applianceType || null,
      hasModelNumber: Boolean(result.context?.modelNumber),
      toolCalls: result.toolCalls || [],
      llmUsed: llmResult.usedLlm,
      llmModel: llmResult.model || null
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        intent: "ERROR",
        context: {},
        response: {
          role: "assistant",
          content:
            "Something went wrong while processing this request. Please try again with your appliance type and model number."
        },
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
