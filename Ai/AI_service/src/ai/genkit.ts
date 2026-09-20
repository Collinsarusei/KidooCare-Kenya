// genkit-service/src/ai/genkit.ts
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

/**
 * Initialize Genkit with Google AI plugin
 * Uses GOOGLE_API_KEY from environment variables
 */
export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash', // Default model for all operations
});
