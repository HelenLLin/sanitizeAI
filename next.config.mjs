/** Next.js configuration for App Router and TypeScript */
import { join } from 'path';

const __dirname = new URL('.', import.meta.url).pathname;

export default {
  experimental: { appDir: true },
};
