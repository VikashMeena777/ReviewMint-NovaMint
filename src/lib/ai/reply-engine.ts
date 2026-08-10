import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIReplyRequest, AIReplyResponse } from "@/types";

// ─── Groq Client (Primary) ─────────────────
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
}

// ─── Gemini Client (Fallback) ───────────────
function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

// ─── Build the prompt ───────────────────────
function buildReplyPrompt(request: AIReplyRequest): string {
  const isStarOnly = !request.reviewText || request.reviewText.trim() === "";
  const ratingLabel =
    request.starRating >= 4
      ? "positive"
      : request.starRating === 3
        ? "neutral"
        : "negative";

  return `You are a professional review responder for "${request.businessName}", a ${request.businessType || "business"} in ${request.businessLocation || "the area"}.

TONE: ${request.tone}
${request.businessContext ? `BUSINESS CONTEXT: ${request.businessContext}` : ""}
${request.customInstructions ? `CUSTOM INSTRUCTIONS: ${request.customInstructions}` : ""}

Generate a reply to this Google review:
- Reviewer: ${request.reviewerName}
- Rating: ${request.starRating}/5 (${ratingLabel})
${isStarOnly ? "- This is a STAR-ONLY review (no text written)" : `- Review: "${request.reviewText}"`}

RULES:
1. Address the reviewer by their first name naturally
2. ${request.starRating >= 4 ? "Keep reply to 2-3 sentences max" : "Acknowledge their concern, apologize sincerely, and offer a resolution path (3-4 sentences)"}
3. ${isStarOnly ? "Thank them warmly for their rating and mention something positive about your business" : "Reference specific details from their review to show you read it"}
4. Sound genuinely human — vary sentence structure, avoid corporate jargon
5. NEVER use these overused phrases: "We appreciate your feedback", "Thank you for taking the time", "We value your opinion", "Your satisfaction is our priority"
6. ${request.starRating <= 2 ? "Invite them to reach out directly so you can make it right" : "End with something warm but not over-the-top"}
7. Do NOT include any greeting like "Dear" — start directly with the response
8. Do NOT sign off with a name or title at the end
9. Reply in the SAME LANGUAGE as the review text (if review is in Hindi, reply in Hindi; if in Kannada, reply in Kannada, etc.)

Respond ONLY with the reply text. No quotes, no labels, no explanation.`;
}

// ─── Analyze sentiment ──────────────────────
// Derived from the star rating alone. The review body is deliberately not
// consulted: ratings are the signal the business acts on, and inferring
// sentiment from text disagreed with the star often enough to be noise.
function analyzeSentiment(
  starRating: number
): { sentiment: "positive" | "neutral" | "negative"; score: number } {
  if (starRating >= 4) return { sentiment: "positive", score: starRating / 5 };
  if (starRating === 3) return { sentiment: "neutral", score: 0.5 };
  return { sentiment: "negative", score: starRating / 5 };
}

// ─── Generate reply via Groq ────────────────
async function generateWithGroq(prompt: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) throw new Error("Groq API key not configured");

  const response = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are an expert at writing personalized, human-sounding Google review replies for businesses. You write concise, warm, and authentic responses.",
      },
      { role: "user", content: prompt },
    ],
    model: "llama-3.3-70b-versatile",
    max_tokens: 256,
    temperature: 0.7,
  });

  const reply = response.choices[0]?.message?.content;
  if (!reply) throw new Error("Empty response from Groq");
  return reply.trim();
}

// ─── Generate reply via Gemini (fallback) ───
async function generateWithGemini(prompt: string): Promise<string> {
  const genAI = getGeminiClient();
  if (!genAI) throw new Error("Gemini API key not configured");

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const reply = result.response.text();
  if (!reply) throw new Error("Empty response from Gemini");
  return reply.trim();
}

// ─── Main: Generate AI Reply ────────────────
export async function generateReply(
  request: AIReplyRequest
): Promise<AIReplyResponse> {
  const prompt = buildReplyPrompt(request);
  const { sentiment, score } = analyzeSentiment(request.starRating);

  let reply: string;

  try {
    // Try Groq first (fast + free)
    reply = await generateWithGroq(prompt);
  } catch (groqError) {
    console.error("[AI] Groq failed, trying Gemini fallback:", groqError);
    try {
      // Fallback to Gemini
      reply = await generateWithGemini(prompt);
    } catch (geminiError) {
      console.error("[AI] Gemini also failed:", geminiError);
      throw new Error("All AI providers failed to generate a reply");
    }
  }

  // Clean up: remove surrounding quotes if AI added them
  reply = reply.replace(/^["']|["']$/g, "").trim();

  return {
    reply,
    sentiment,
    sentimentScore: score,
  };
}
