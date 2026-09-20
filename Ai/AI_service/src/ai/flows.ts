// genkit-service/src/ai/flows.ts
import { ai } from './genkit';
import {
  draftProfileInputSchema,
  draftProfileOutputSchema,
  DraftProfileInput,
  DraftProfileOutput,
  daycareReportInputSchema,
  daycareReportOutputSchema,
  DaycareReportInput,
  DaycareReportOutput,
  parentChatInputSchema,
  parentChatOutputSchema,
  ParentChatInput,
  ParentChatOutput,
} from './schemas';

// ═══════════════════════════════════════════════════════════════════════════
// KIDDOCARE DAYCARE MARKETPLACE — AI PROMPTS & FLOWS
// ═══════════════════════════════════════════════════════════════════════════

const DAYCARE_PROFILE_PROMPT = `You are a professional marketing copywriter specialising in early childhood education centers in Kenya.

Your task is to write compelling, warm, and professional content for a daycare center's marketplace profile on KiddoCare Kenya — Kenya's leading verified daycare marketplace.

Guidelines:
- Use warm, reassuring language that builds trust with Kenyan parents
- Highlight safety, certified caregivers, and nurturing environment
- Mention M-Pesa/Lipa Mdogo Mdogo if relevant (flexible weekly payments)
- Keep "about" to 2-3 sentences maximum — concise but powerful
- Tagline should be memorable and under 15 words
- Key features should be bullet-point style short phrases (5-8 words each)
- Use Kenyan context (county licensing, CBC curriculum awareness, etc.)

Return ONLY the JSON output matching the output schema.`;

const DAYCARE_REPORT_PROMPT = `You are an experienced early childhood business analyst for KiddoCare Kenya, a daycare marketplace platform.

Your task is to generate an executive financial and operational health report for a daycare manager.

Guidelines:
- Provide honest, constructive analysis based purely on the numbers provided
- Financial health: EXCELLENT if arrearsCount < 20% of total; GOOD if 20-40%; ATTENTION_REQUIRED if >40%
- Revenue analysis should reference KES figures specifically
- Recommendations must be concrete, specific, and actionable for a Kenyan daycare context
- Mention Lipa Mdogo Mdogo M-Pesa payment reminders where relevant
- Keep executive summary to 2 concise paragraphs

Return ONLY the JSON output matching the output schema.`;

const PARENT_CHAT_PROMPT = `You are KiddoCare AI — a friendly, knowledgeable childcare assistant for parents in Kenya using the KiddoCare daycare marketplace.

Your role is to:
- Help parents with questions about daycare enrollment, fees, and schedules
- Provide general child development tips appropriate for daycare age (6 months to 6 years)
- Help parents understand the Lipa Mdogo Mdogo (weekly M-Pesa payment) system
- Explain how county-verified daycares work in Kenya
- Advise on what to look for in a quality daycare center
- Answer questions about KiddoCare platform features (enrollment, reviews, payments, disputes)

If parents ask about medical issues, direct them to their healthcare provider.
Be warm, concise, and use simple language. Personalize responses if child/school context is provided.`;

// ── Flow 1: Draft Daycare Profile ─────────────────────────────────────────────
export const draftDaycareProfileFlow = ai.defineFlow(
  {
    name: 'draftDaycareProfile',
    inputSchema: draftProfileInputSchema,
    outputSchema: draftProfileOutputSchema,
  },
  async (input: DraftProfileInput): Promise<DraftProfileOutput> => {
    const result = await ai.generate({
      prompt: `${DAYCARE_PROFILE_PROMPT}

INPUT DATA:
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

Generate the daycare profile content.`,
      output: {
        schema: draftProfileOutputSchema,
      },
      config: {
        temperature: 0.7, // Creative but professional
      },
    });

    if (!result.output) {
      throw new Error('AI failed to generate daycare profile. Please try again.');
    }
    return result.output;
  },
);

// ── Flow 2: Daycare Executive Financial Report ────────────────────────────────
export const generateDaycareReportFlow = ai.defineFlow(
  {
    name: 'generateDaycareReport',
    inputSchema: daycareReportInputSchema,
    outputSchema: daycareReportOutputSchema,
  },
  async (input: DaycareReportInput): Promise<DaycareReportOutput> => {
    const result = await ai.generate({
      prompt: `${DAYCARE_REPORT_PROMPT}

INPUT DATA:
\`\`\`json
${JSON.stringify(input, null, 2)}
\`\`\`

Generate the executive report.`,
      output: {
        schema: daycareReportOutputSchema,
      },
      config: {
        temperature: 0.3, // Factual and consistent
      },
    });

    if (!result.output) {
      throw new Error('AI failed to generate executive report. Please try again.');
    }
    return result.output;
  },
);

// ── Flow 3: Parent KiddoCare Chat Assistant ──────────────────────────────────
export const parentChatFlow = ai.defineFlow(
  {
    name: 'parentChat',
    inputSchema: parentChatInputSchema,
    outputSchema: parentChatOutputSchema,
  },
  async (input: ParentChatInput): Promise<ParentChatOutput> => {
    let context = '';
    if (input.context?.childrenNames?.length) {
      context += `\nParent's children: ${input.context.childrenNames.join(', ')}`;
    }
    if (input.context?.enrolledSchool) {
      context += `\nEnrolled at: ${input.context.enrolledSchool}`;
    }

    let history = '';
    if (input.history?.length) {
      history = '\nConversation history:\n' + input.history.map(
        (m: { role: string; content: string }) => `${m.role === 'user' ? 'Parent' : 'KiddoCare AI'}: ${m.content}`
      ).join('\n');
    }

    const result = await ai.generate({
      prompt: `${PARENT_CHAT_PROMPT}${context}

${history}

Parent's question: ${input.message}

Provide a helpful, friendly response.`,
      output: {
        schema: parentChatOutputSchema,
      },
      config: {
        temperature: 0.75,
      },
    });

    if (!result.output?.reply) {
      throw new Error('AI failed to generate a response. Please try again.');
    }
    return result.output;
  },
);