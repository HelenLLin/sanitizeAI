// Small AI helper for demo.
// Replace with a real Genkit/GenAI client in production.
export const ai = {
  async generate(_opts: any) {
  // Simple stub; not used by the simplified flow.
    return { toolCalls: _opts.tools && _opts.tools.length ? [{ name: _opts.tools[0].name, input: { text: _opts.prompt ?? '' } }] : [], };
  },

  async chooseTool({ text, intent, tools }: { text: string; intent: string; tools: Array<any> }) {
    const loweredIntent = intent.toLowerCase();
    const loweredText = text.toLowerCase();

  // If intent asks for financial redaction
    if (loweredIntent.includes('financ') || loweredIntent.includes('bank') || loweredIntent.includes('credit')) return { name: 'redact_financial' };

  // Match obvious financial patterns
    if (/\b(?:\d[ -]?){13,19}\b/.test(text) || /\b\d{9,}\b/.test(text)) return { name: 'redact_financial' };

  // Match SSN patterns
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text) || /ssn/.test(loweredText)) return { name: 'redact_financial' };

  // If text has emails or phone numbers, anonymize
    if (/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(text) || /\b(?:\+?\d{1,3}[ -]?)?(?:\(\d{3}\)|\d{3})[ -]?\d{3}[ -]?\d{4}\b/.test(text)) return { name: 'anonymize_pii' };

    if (loweredIntent.includes('anonym') || loweredIntent.includes('pii') || loweredIntent.includes('personal')) return { name: 'anonymize_pii' };

  // If GEMINI env vars are set, ask the model to pick the tool.
    const GEMINI_API_URL = process.env.GEMINI_API_URL;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (GEMINI_API_URL && GEMINI_API_KEY) {
      try {
        const prompt = `You are a tool-picker. The user request: "${intent}". The input text (first 300 chars): "${text.slice(0,300)}".\n\nAvailable tools:\n${tools.map((t:any)=>`- ${t.name}: ${t.description}`).join('\n')}\n\nPick exactly ONE tool name from the list above that best satisfies the user's request and return a JSON object with a single key \"tool\". Example response: {\"tool\":\"anonymize_pii\"}`;

        const resp = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        });

        if (resp.ok) {
          const body = await resp.json();
            // Expect { tool: 'name' } or similar
          const toolName = body?.tool ?? body?.choice ?? body?.result?.tool;
          if (toolName && typeof toolName === 'string') return { name: toolName };
        }
      } catch (e) {
        // ignore and use the fallback
        console.warn('Gemini tool selection failed, falling back to heuristic', (e as any)?.message ?? e);
      }
    }

  // Default: anonymize
    return { name: 'anonymize_pii' };
  },
};
