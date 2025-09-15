"use client";

import React, { useState } from 'react';

export default function Page() {
  const [text, setText] = useState('Alice sent $100 to 4111 1111 1111 1111');
  const [intent, setIntent] = useState('Anonymize PII');
  const [logs, setLogs] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLogs((l) => [...l, 'Submitting...']);

  // Call API to start sanitization
    const res = await fetch('/api/sanitize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sanitizationRequest: intent }),
    });

    if (!res.ok) {
      setLogs((l) => [...l, `Error: ${res.statusText}`]);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      setLogs((l) => [...l, chunk]);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">SanitizeAI (demo)</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Text</label>
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full border p-2" rows={4} />
        </div>

        <div>
          <label className="block font-semibold">Intent</label>
          <input value={intent} onChange={(e) => setIntent(e.target.value)} className="w-full border p-2" />
        </div>

        <button className="px-4 py-2 bg-blue-600 text-white rounded">Sanitize</button>
      </form>

      <div className="mt-6">
        <h2 className="font-semibold">Logs</h2>
        <pre className="bg-gray-100 p-2 mt-2">{logs.join('\n')}</pre>
      </div>
    </div>
  );
}
