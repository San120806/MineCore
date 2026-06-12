import { z } from 'zod';

export const createSensorSchema = z.object({
  siteId: z.string().uuid('siteId must be a valid UUID'),
  sensorCode: z.string().min(1).max(50),
  name: z.string().min(1).max(255),
  sensorType: z.enum(['TEMPERATURE', 'PRESSURE', 'VIBRATION', 'AIR_QUALITY', 'HUMIDITY']),
  status: z.enum(['ONLINE', 'OFFLINE', 'DEGRADED', 'CALIBRATING']).optional(),
  value: z.number().nullable().optional(),
  unit: z.string().min(1).max(50),
  thresholdMin: z.number().nullable().optional(),
  thresholdMax: z.number().nullable().optional(),
});

export const updateSensorSchema = createSensorSchema.partial();

export const ingestReadingSchema = z.object({
  value: z.number(),
  unit: z.string().min(1).max(50),
});
