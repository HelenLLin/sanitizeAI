# SanitizeAI (demo)

SanitizeAI demonstrates a Model Context Protocol (MCP) example where a Next.js app (Genkit client) selects and calls tools hosted on a standalone MCP server.

Quick start

1. Install deps

   npm install

2. Copy env example

   cp .env.example .env

3. Start MCP server (dev)

   npm run dev:mcp

4. Start Next.js

   npm run dev

Notes

- This repo contains minimal stubs for the Genkit/AI integration; replace the stubbed `src/lib/ai.ts` with a configured Genkit instance and set `GEMINI_API_KEY`.
- The MCP server listens on port set in `MCP_PORT` (default 9003).

Optional: Gemini-powered tool selection

You can delegate tool selection to Google Gemini (or any model endpoint) by setting the following env vars in `.env`:

- GEMINI_API_URL — full URL for your model inference endpoint that accepts POST JSON { prompt }
- GEMINI_API_KEY — bearer token for the endpoint

If both are set, the demo will call the endpoint with a short prompt asking the model to return a JSON object of the form { "tool": "<tool_name>" }. If the model call fails, the demo falls back to a built-in heuristic.

Example `.env`:

GEMINI_API_KEY=your_key_here
GEMINI_API_URL=https://api.example.com/v1/generate

