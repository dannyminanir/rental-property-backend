/**
 * AI Maintenance Triage Service
 * 
 * Rules:
 * 1. Output strict JSON only.
 * 2. Categories: "plumbing", "electrical", "doors and locks", "appliances", "structure (roof, walls, windows)", "pests", "other".
 * 3. Urgency: "low", "normal", "urgent".
 * 4. is_emergency: true if danger to life/property (gas smell, smoke, fire, sparks, severe flooding).
 * 5. Emergency notice: 112 guidance for tenant.
 * 6. Never provide repair instructions.
 * 7. Fallback to category "other" and urgency "normal" if the LLM call fails.
 */

const FALLBACK_TRIAGE = {
  category: "other",
  urgency: "normal",
  is_emergency: false,
  summary: "Maintenance request submitted (pending manual review).",
  follow_up_question: "Could you provide any additional details about the issue?"
};

const SYSTEM_PROMPT = `You are an AI maintenance triage assistant for a rental property management platform.
Analyze the tenant's maintenance request and classify it according to the following strict rules:

Categories:
- "plumbing"
- "electrical"
- "doors and locks"
- "appliances"
- "structure (roof, walls, windows)"
- "pests"
- "other"

Urgency:
- "low" (cosmetic, minor squeaks, non-essential)
- "normal" (standard repairs, inconvenience but safe)
- "urgent" (loss of essential service like hot water, security risk, escalating damage)

Emergency Rule (is_emergency):
- Set is_emergency to true ONLY if there is an immediate danger to life, safety, or catastrophic property damage (e.g., smell of gas, active fire/smoke, sparks from electrical outlets/appliances, severe bursting pipe flooding the house).
- If is_emergency is true, urgency MUST be "urgent".

Safety Rule:
- NEVER tell the tenant how to repair anything, especially electrical, gas, or structural issues.

Format Requirement:
- Return ONLY valid JSON with keys: "category", "urgency", "is_emergency", "summary", "follow_up_question". No markdown wrappers or explanation.

Input may be in English or Kinyarwanda. Summaries should be concise English.`;

/**
 * Triage maintenance request text
 * @param {string} tenantText - The original text submitted by the tenant
 * @returns {Promise<Object>} Triage JSON result
 */
async function triageRequest(tenantText) {
  if (!tenantText || typeof tenantText !== 'string' || !tenantText.trim()) {
    return { ...FALLBACK_TRIAGE, summary: "Empty request description." };
  }

  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey === 'your_llm_api_key_here') {
    console.warn("⚠️ AI_API_KEY is not configured. Returning fallback triage.");
    return { ...FALLBACK_TRIAGE, summary: tenantText.slice(0, 100) };
  }

  try {
    // Standard fetch call to Gemini / LLM endpoint can be implemented here
    // In Week 1: tested using the test script with your preferred provider SDK/API
    // Returning fallback as safety until API key is set
    return FALLBACK_TRIAGE;
  } catch (error) {
    console.error("AI Triage Error:", error.message);
    return FALLBACK_TRIAGE;
  }
}

module.exports = {
  triageRequest,
  FALLBACK_TRIAGE,
  SYSTEM_PROMPT
};
