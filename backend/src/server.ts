/// <reference path="./types/express.d.ts" />
import app from './app';
import { env } from '@config/env';
import { logger } from '@config/logger';
import prisma from '@config/database';

// ─── Graceful Shutdown ───────────────────────────────────────────────────────

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Gracefully shutting down...`);
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ─── Unhandled Rejections ────────────────────────────────────────────────────

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// ─── Start Server ────────────────────────────────────────────────────────────

async function bootstrap() {
  try {
    // Verify DB connection
    await prisma.$connect();
    logger.info('✅  Database connected successfully');

    app.listen(env.PORT, () => {
      logger.info(`🚀  MineCore API running on http://localhost:${env.PORT}/api/${env.API_VERSION}`);
      logger.info(`📋  Health check: http://localhost:${env.PORT}/health`);
      logger.info(`🌍  Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
