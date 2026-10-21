import { auth } from "@clerk/nextjs/server";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { assistantModel } from "@/lib/ai/model";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { SYSTEM_PROMPT } from "@/lib/ai/system-prompt";
import { createAssistantTools } from "@/lib/ai/tools";

const MAX_BODY_BYTES = 100_000;
const MAX_MESSAGES = 20;
const MAX_USER_TEXT = 500;

function clientKey(request: Request, userId: string | null) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${forwarded || "local"}`;
}

function lastUserText(messages: UIMessage[]) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (last?.parts ?? [])
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
}

export async function POST(request: Request) {
  const { userId } = await auth();

  // The free Gemini quota is shared by every visitor, so cap how fast one visitor can use it.
  const perMinute = checkRateLimit(`${clientKey(request, userId)}:minute`, {
    limit: 8,
    windowMs: 60_000,
  });
  const perHour = checkRateLimit(`${clientKey(request, userId)}:hour`, {
    limit: 60,
    windowMs: 3_600_000,
  });
  const limited = !perMinute.ok ? perMinute : !perHour.ok ? perHour : null;
  if (limited) {
    return NextResponse.json(
      {
        error: `You are sending messages quickly. Please try again in ${limited.retryAfterSeconds} seconds.`,
      },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } },
    );
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "That request is too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "No messages were provided." }, { status: 400 });
  }

  const tools = createAssistantTools({ userId });

  // The history comes from the browser, so check its shape before it reaches the model.
  // Only user and assistant turns are accepted: a browser-supplied "system" message would
  // be treated by the model as one of our own trusted instructions.
  let messages: UIMessage[];
  try {
    messages = await validateUIMessages({
      messages: body.messages
        .filter((m: { role?: unknown }) => m?.role === "user" || m?.role === "assistant")
        .slice(-MAX_MESSAGES),
      tools,
    });
  } catch {
    return NextResponse.json({ error: "Those messages could not be read." }, { status: 400 });
  }

  if (lastUserText(messages).length > MAX_USER_TEXT) {
    return NextResponse.json(
      { error: `Please keep messages under ${MAX_USER_TEXT} characters.` },
      { status: 400 },
    );
  }

  const result = streamText({
    model: assistantModel,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: isStepCount(5),
    maxOutputTokens: 800,
    temperature: 0.4,
    onError: ({ error }) => console.error("Assistant stream error", error),
  });

  // Errors reach the browser as a generic message; details stay in the server log.
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
