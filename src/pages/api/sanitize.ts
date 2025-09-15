import type { NextApiRequest, NextApiResponse } from 'next';
import { getSanitizedTextStreamAction } from '../../app/actions';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, sanitizationRequest } = req.body;

  const stream = await getSanitizedTextStreamAction({ text, sanitizationRequest });

  // For simplicity, stream JSON chunks as newline-delimited JSON
  res.setHeader('Content-Type', 'application/octet-stream');

  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(JSON.stringify(value) + '\n');
      await new Promise((r) => setTimeout(r, 10));
    }
  } catch (e: any) {
    res.write(JSON.stringify({ error: e.message }));
  } finally {
    res.end();
  }
}
