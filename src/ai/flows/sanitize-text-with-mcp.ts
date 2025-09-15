import { z } from 'zod';
// using global fetch (Node 18+/Next.js runtime provides fetch)
import { ai } from '../../lib/ai';

const inputSchema = z.object({
  text: z.string(),
  sanitizationRequest: z.string(),
});
type Input = z.infer<typeof inputSchema>;

const outputSchema = z.object({
  sanitizedText: z.string(),
  toolUsed: z.string(),
});
type Output = z.infer<typeof outputSchema>;

export async function sanitizeTextWithMCP(
  raw: Input,
  onProgress?: (step: string) => void
): Promise<Output> {
  onProgress?.('mcp_connect_start');
  const base = `http://localhost:${process.env.MCP_PORT ?? 9003}`;
  onProgress?.('mcp_connect_finish');

  onProgress?.('list_tools');
  const toolListResp = await fetch(base + '/mcp/tools');
  const toolList = await toolListResp.json();

  onProgress?.('select_tool');
  const { text: userText, sanitizationRequest } = inputSchema.parse(raw);

  // Use ai.generate (stub) to pick tool name — real implementation should call Genkit
  const choice = await ai.chooseTool({ text: userText, intent: sanitizationRequest, tools: toolList.tools });
  if (!choice || !choice.name) throw new Error('Model did not choose a tool');
  onProgress?.(`tool_selected:${choice.name}`);

  onProgress?.('tool_exec_start');
  const callResp = await fetch(base + `/mcp/call/${choice.name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: userText }),
  });
  const result = await callResp.json();
  onProgress?.('tool_exec_finish');

  return {
    sanitizedText: result.sanitizedText,
    toolUsed: choice.name,
  };
}
