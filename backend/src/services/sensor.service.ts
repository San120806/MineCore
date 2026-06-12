import { Prisma, SensorType, SensorStatus } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllSensors = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  sensorType?: string;
  status?: string;
  siteId?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.SensorWhereInput = {
    ...(query.siteId && { siteId: query.siteId }),
    ...(query.sensorType && { sensorType: query.sensorType as SensorType }),
    ...(query.status && { status: query.status as SensorStatus }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sensorCode: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [sensors, total] = await Promise.all([
    prisma.sensor.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: { site: { select: { id: true, name: true } } },
    }),
    prisma.sensor.count({ where }),
  ]);

  return { sensors, meta: buildMeta(total, page, limit) };
};

export const getSensorById = async (id: string) => {
  const sensor = await prisma.sensor.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      readings: { orderBy: { recordedAt: 'desc' }, take: 10 },
    },
  });
  if (!sensor) throw new AppError('Sensor not found', 404, 'NOT_FOUND');
  return sensor;
};

export const createSensor = async (data: any) => {
  return prisma.sensor.create({
    data,
    include: { site: { select: { id: true, name: true } } },
  });
};

export const updateSensor = async (id: string, data: Prisma.SensorUpdateInput) => {
  await getSensorById(id);
  return prisma.sensor.update({ where: { id }, data });
};

export const deleteSensor = async (id: string) => {
  await getSensorById(id);
  await prisma.sensor.delete({ where: { id } });
};

export const getSensorReadings = async (
  sensorId: string,
  query: { page?: string; limit?: string },
) => {
  await getSensorById(sensorId);
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const [readings, total] = await Promise.all([
    prisma.sensorReading.findMany({
      where: { sensorId },
      skip,
      take: limit,
      orderBy: { recordedAt: 'desc' },
    }),
    prisma.sensorReading.count({ where: { sensorId } }),
  ]);

  return { readings, meta: buildMeta(total, page, limit) };
};

export const ingestReading = async (sensorId: string, value: number, unit: string) => {
  await getSensorById(sensorId);

  const [reading] = await Promise.all([
    prisma.sensorReading.create({ data: { sensorId, value, unit } }),
    prisma.sensor.update({
      where: { id: sensorId },
      data: { value, lastReading: new Date() },
    }),
  ]);

  return reading;
};
