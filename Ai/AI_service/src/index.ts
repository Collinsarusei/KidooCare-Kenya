// genkit-service/src/index.ts

import './ai/dev'; // Load environment variables first
import { onRequest } from 'firebase-functions/v2/https';
import { draftDaycareProfileFlow, generateDaycareReportFlow, parentChatFlow } from './ai/flows';

/**
 * Firebase Cloud Function: Draft Daycare Profile
 */
export const draftDaycareProfile = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }
      if (!request.body?.schoolName) {
        response.status(400).json({ error: 'schoolName is required' });
        return;
      }
      const result = await draftDaycareProfileFlow(request.body);
      response.status(200).json(result);
    } catch (error) {
      console.error('Error drafting daycare profile:', error);
      response.status(500).json({
        error: 'Failed to draft daycare profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Firebase Cloud Function: Generate Daycare Executive Report
 */
export const generateDaycareReport = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }
      if (!request.body?.schoolName) {
        response.status(400).json({ error: 'schoolName is required' });
        return;
      }
      const result = await generateDaycareReportFlow(request.body);
      response.status(200).json(result);
    } catch (error) {
      console.error('Error generating daycare report:', error);
      response.status(500).json({
        error: 'Failed to generate daycare report',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * Firebase Cloud Function: Parent Chat Assistant
 */
export const parentChat = onRequest(
  { cors: true },
  async (request, response) => {
    try {
      if (request.method !== 'POST') {
        response.status(405).json({ error: 'Method not allowed' });
        return;
      }
      if (!request.body?.message) {
        response.status(400).json({ error: 'message is required' });
        return;
      }
      const result = await parentChatFlow({
        message: request.body.message,
        history: request.body.history ?? [],
        context: request.body.context,
      });
      response.status(200).json(result);
    } catch (error) {
      console.error('Error in parent chat:', error);
      response.status(500).json({
        error: 'Failed to generate chat response',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);