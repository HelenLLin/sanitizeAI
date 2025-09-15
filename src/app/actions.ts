'use server';

import { sanitizeTextWithMCP } from '../ai/flows/sanitize-text-with-mcp';

// Simple streaming helper. Returns getReader() with a read() method.
export async function getSanitizedTextStreamAction(data: { text: string; sanitizationRequest: string }) {
  const queue: Array<any> = [];
  let done = false;
  let error: string | null = null;

  const push = (item: any) => queue.push(item);

  (async () => {
    try {
      const out = await sanitizeTextWithMCP(data, (step) => push({ step }));
      push({ result: out });
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      done = true;
    }
  })();

  const asyncIterator = {
    async next() {
      if (queue.length) return { done: false, value: queue.shift() };
      if (done) return { done: true, value: undefined };
  // wait a bit for new items
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (queue.length) return { done: false, value: queue.shift() };
      if (done) return { done: true, value: undefined };
      return { done: true, value: undefined };
    },
    [Symbol.asyncIterator]() {
      return this;
    },
  } as AsyncIterableIterator<any>;

  return {
    getReader() {
      // provide a simple reader compatible with the API route above
      const it = asyncIterator;
      return {
        read: () => it.next(),
      };
    },
  };
}
