import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { z } from 'zod';

const PORT = Number(process.env.MCP_PORT ?? 9003);

// Simple in-memory tools registry for demo purposes.
type Tool = {
  name: string;
  description: string;
  systemPrompt: string;
};

const tools: Tool[] = [
  {
    name: 'anonymize_pii',
    description:
      'Anonymises names, emails, phone numbers, addresses, dates of birth, etc.',
    systemPrompt: 'You are a PII anonymiser. Return only the anonymised text.',
  },
  {
    name: 'redact_financial',
    description:
      'Redacts IBAN, credit-card numbers, crypto wallets, sort codes, etc.',
    systemPrompt:
      'You are a financial-data redactor. Return only the redacted text.',
  },
];

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/mcp/tools', (_req, res) => {
  res.json({ tools: tools.map((t) => ({ name: t.name, description: t.description })) });
});

const inputSchema = z.object({ text: z.string() });

// Execute a tool by name; for the demo we'll do simple regex-based redaction/anonymization
app.post('/mcp/call/:tool', (req, res) => {
  const { tool } = req.params;
  const body = req.body;
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid input' });

  const text: string = parsed.data.text;
  if (tool === 'anonymize_pii') {
    let out = text;

    // emails
    out = out.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[REDACTED_EMAIL]');

    // phone numbers (various formats)
    out = out.replace(/\b(?:\+?\d{1,3}[ -]?)?(?:\(\d{3}\)|\d{3})[ -]?\d{3}[ -]?\d{4}\b/g, '[REDACTED_PHONE]');

    // dates (DOB) common formats: MM/DD/YYYY, YYYY-MM-DD, Month DD, YYYY
    out = out.replace(/\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, '[REDACTED_DATE]');
    out = out.replace(/\b\d{4}-\d{1,2}-\d{1,2}\b/g, '[REDACTED_DATE]');
    out = out.replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi, '[REDACTED_DATE]');

    // addresses: simple heuristic for street addresses
    out = out.replace(/\b\d{1,5}\s+[A-Z][a-z0-9\.\-\s]{2,60}\b(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Ln|Lane|Dr|Drive)\b/gi, '[REDACTED_ADDRESS]');

    // passports/drivers/license-ish (very heuristic)
    out = out.replace(/\b[A-Z0-9]{5,20}\b/g, (m) => (/^[A-Z]{1,2}\d{6,}$/.test(m) ? '[REDACTED_ID]' : m));

    // names: capitalized words heuristics (avoid replacing at sentence starts like "The")
    out = out.replace(/\b([A-Z][a-z]{1,20})(?:\s+[A-Z][a-z]{1,20})*\b/g, '[REDACTED_NAME]');

    return res.json({ sanitizedText: out });
  }

  if (tool === 'redact_financial') {
    let out = text;
    // redact SSN-like patterns first (e.g. 123-45-6789)
    out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED_SSN]');

    // redact credit-card / long account numbers that may include spaces or dashes
    // matches sequences like "4111 1111 1111 1111" or "4111111111111111"
    out = out.replace(/(?:\d[ -]?){13,19}/g, '[REDACTED_FINANCIAL]');

    // redact contiguous long digit sequences (9+ digits)
    out = out.replace(/\b\d{9,}\b/g, '[REDACTED_FINANCIAL]');

    // redact common crypto wallet hex
    out = out.replace(/0x[a-fA-F0-9]{20,64}/g, '[REDACTED_WALLET]');

    return res.json({ sanitizedText: out });
  }

  return res.status(404).json({ error: 'tool not found' });
});

createServer(app).listen(PORT, () => console.log(`[MCP] SanitizeAIServer listening on :${PORT}`));
