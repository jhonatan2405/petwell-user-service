import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import client from 'prom-client';

// ── Prometheus: recolección de métricas por defecto (CPU, RAM, etc.) ─────────
client.collectDefaultMetrics({ prefix: 'user_service_' });

import { env } from './config/env';
import router from './routes/index';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// ── Security & Utility Middlewares ───────────────────────────────────────────
app.use(helmet());                    // Set secure HTTP headers
app.use(
    cors({
        origin: env.allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    }),
);
app.use(express.json({ limit: '10kb' }));   // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDevelopment ? 'dev' : 'combined'));  // HTTP request logging

// ── Prometheus: contador de peticiones HTTP por ruta ────────────────────────
const httpRequestCounter = new client.Counter({
    name: 'user_service_http_requests_total',
    help: 'Total de peticiones HTTP al User Service',
    labelNames: ['method', 'route', 'status_code'],
});

app.use((req, _res, next) => {
    _res.on('finish', () => {
        httpRequestCounter.inc({
            method: req.method,
            route: req.path,
            status_code: _res.statusCode,
        });
    });
    next();
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.status(200).send('User Service OK');
});

// ── Metrics endpoint (Prometheus scrape) ─────────────────────────────────────
app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
app.listen(env.port, '0.0.0.0', () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🐾 PetWell — User Service               ║
  ║  Mode  : ${env.nodeEnv.padEnd(32)}║
  ║  Port  : ${String(env.port).padEnd(32)}║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
