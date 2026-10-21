import "server-only";
import { google } from "@ai-sdk/google";
import type { LanguageModelV4, LanguageModelV4Middleware } from "@ai-sdk/provider";
import { APICallError, wrapLanguageModel } from "ai";

// Gemini 2.5 models are closed to new users, and the newest 3.7/3.8 models were overloaded when
// this was written. 3.5 Flash is stable and supports tool calls; Flash-Lite is the lighter backup.
const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

/** Rate limited (free-tier quota) or the provider is overloaded/down. */
function isCapacityError(error: unknown) {
  return (
    APICallError.isInstance(error) &&
    (error.statusCode === 429 || (error.statusCode ?? 0) >= 500)
  );
}

/**
 * If the main model refuses a request for capacity reasons, send the same request to the
 * fallback model. Only covers failures before the response starts streaming.
 */
function fallbackTo(fallback: LanguageModelV4): LanguageModelV4Middleware {
  return {
    specificationVersion: "v4",
    wrapGenerate: async ({ doGenerate, params }) => {
      try {
        return await doGenerate();
      } catch (error) {
        if (!isCapacityError(error)) throw error;
        console.warn(`Assistant: ${PRIMARY_MODEL} unavailable, using ${FALLBACK_MODEL}`);
        return fallback.doGenerate(params);
      }
    },
    wrapStream: async ({ doStream, params }) => {
      try {
        return await doStream();
      } catch (error) {
        if (!isCapacityError(error)) throw error;
        console.warn(`Assistant: ${PRIMARY_MODEL} unavailable, using ${FALLBACK_MODEL}`);
        return fallback.doStream(params);
      }
    },
  };
}

export const assistantModel = wrapLanguageModel({
  model: google(PRIMARY_MODEL),
  middleware: fallbackTo(google(FALLBACK_MODEL)),
});
