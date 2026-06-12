import { Prisma, MaintenanceStatus, MaintenanceType } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllMaintenance = async (query: {
  page?: string;
  limit?: string;
  status?: string;
  type?: string;
  equipmentId?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.MaintenanceRecordWhereInput = {
    ...(query.equipmentId && { equipmentId: query.equipmentId }),
    ...(query.status && { status: query.status as MaintenanceStatus }),
    ...(query.type && { type: query.type as MaintenanceType }),
  };

  const [records, total] = await Promise.all([
    prisma.maintenanceRecord.findMany({
      where,
      skip,
      take: limit,
      orderBy: { maintenanceDate: 'desc' },
      include: {
        equipment: { select: { id: true, name: true, model: true } },
        performedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.maintenanceRecord.count({ where }),
  ]);

  return { records, meta: buildMeta(total, page, limit) };
};

export const getMaintenanceById = async (id: string) => {
  const record = await prisma.maintenanceRecord.findUnique({
    where: { id },
    include: {
      equipment: { select: { id: true, name: true, model: true, siteId: true } },
      performedBy: { select: { id: true, name: true, role: true } },
    },
  });
  if (!record) throw new AppError('Maintenance record not found', 404, 'NOT_FOUND');
  return record;
};

export const createMaintenance = async (data: any, performedById?: string) => {
  return prisma.maintenanceRecord.create({
    data: {
      equipmentId: data.equipmentId,
      issue: data.issue,
      actionTaken: data.actionTaken,
      maintenanceDate: new Date(data.maintenanceDate),
      type: data.type,
      status: data.status ?? 'SCHEDULED',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      notes: data.notes,
      cost: data.cost,
      performedById,
    },
    include: {
      equipment: { select: { id: true, name: true } },
      performedBy: { select: { id: true, name: true } },
    },
  });
};

export const updateMaintenance = async (id: string, data: any) => {
  await getMaintenanceById(id);
  return prisma.maintenanceRecord.update({
    where: { id },
    data: {
      ...data,
      maintenanceDate: data.maintenanceDate ? new Date(data.maintenanceDate) : undefined,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
    },
  });
};

export const completeMaintenance = async (
  id: string,
  data: { actionTaken: string; notes?: string; cost?: number },
) => {
  const record = await getMaintenanceById(id);
  if (record.status === 'COMPLETED')
    throw new AppError('Maintenance record is already completed', 400, 'ALREADY_COMPLETED');

  return prisma.maintenanceRecord.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      actionTaken: data.actionTaken,
      notes: data.notes,
      cost: data.cost,
      completedAt: new Date(),
    },
  });
};

export const deleteMaintenance = async (id: string) => {
  await getMaintenanceById(id);
  await prisma.maintenanceRecord.delete({ where: { id } });
};
