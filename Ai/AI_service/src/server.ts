// genkit-service/src/server.ts
// KiddoCare Kenya AI Service — local development server

import './ai/dev'; // Load environment variables first
import express from 'express';
import cors from 'cors';
import { 
  draftDaycareProfileFlow,
  generateDaycareReportFlow,
  parentChatFlow,
} from './ai/flows';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'kiddocare-ai-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'KiddoCare Kenya AI Service',
    version: '2.0.0',
    endpoints: {
      health: 'GET /health',
      draftDaycareProfile: 'POST /draftDaycareProfile',
      generateDaycareReport: 'POST /generateDaycareReport',
      parentChat: 'POST /parentChat',
    }
  });
});

// ── KiddoCare: Draft Daycare Profile ─────────────────────────────────────────
app.post('/draftDaycareProfile', async (req, res) => {
  try {
    if (!req.body?.schoolName) {
      return res.status(400).json({ error: 'Bad Request', message: 'schoolName is required' });
    }
    console.log('🏫 Drafting daycare profile for:', req.body.schoolName);
    const result = await draftDaycareProfileFlow(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error drafting profile:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// ── KiddoCare: Generate Daycare Executive Report ──────────────────────────────
app.post('/generateDaycareReport', async (req, res) => {
  try {
    if (!req.body?.schoolName) {
      return res.status(400).json({ error: 'Bad Request', message: 'schoolName is required' });
    }
    console.log('📊 Generating executive report for:', req.body.schoolName);
    const result = await generateDaycareReportFlow(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// ── KiddoCare: Parent Chat Assistant ─────────────────────────────────────────
app.post('/parentChat', async (req, res) => {
  try {
    if (!req.body?.message) {
      return res.status(400).json({ error: 'Bad Request', message: 'message is required' });
    }
    console.log('💬 Parent chat message received');
    const result = await parentChatFlow({
      message: req.body.message,
      history: req.body.history ?? [],
      context: req.body.context,
    });
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in parent chat:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: ['GET /', 'GET /health', 'POST /draftDaycareProfile', 'POST /generateDaycareReport', 'POST /parentChat']
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 KiddoCare AI Service');
  console.log('================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🏫 Draft profile: POST http://localhost:${PORT}/draftDaycareProfile`);
  console.log(`📊 Generate report: POST http://localhost:${PORT}/generateDaycareReport`);
  console.log(`💬 Parent chat: POST http://localhost:${PORT}/parentChat`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('================================\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  process.exit(0);
});