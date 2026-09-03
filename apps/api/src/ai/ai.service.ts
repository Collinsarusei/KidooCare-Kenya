import { Injectable, Logger } from '@nestjs/common';
import { genkit, z } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: any;

  constructor() {
    // Initialize Genkit
    this.ai = genkit({
      plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
      model: gemini15Flash,
    });
  }

  async generateSchoolProfile(data: { name: string; rawDetails: string; facilities: string }): Promise<string> {
    try {
      const prompt = `You are a professional copywriter for KiddoCare, a system helping parents find daycares. 
      Write a compelling public profile for the daycare "${data.name}".
      
      Details provided by the daycare:
      ${data.rawDetails}
      
      Facilities/Features:
      ${data.facilities}
      
      Return a beautifully formatted Markdown string describing the daycare, its philosophy, and what it offers. Keep it professional and welcoming.`;

      const { text } = await this.ai.generate(prompt);
      return text;
    } catch (error) {
      this.logger.error('Error generating AI profile', error);
      throw error;
    }
  }
}
