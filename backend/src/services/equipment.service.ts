import { Prisma, EquipmentStatus, EquipmentType } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllEquipment = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
  siteId?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.EquipmentWhereInput = {
    ...(query.siteId && { siteId: query.siteId }),
    ...(query.status && { status: query.status as EquipmentStatus }),
    ...(query.type && { type: query.type as EquipmentType }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [equipment, total] = await Promise.all([
    prisma.equipment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { healthScore: 'asc' }, // show low health first
      include: {
        site: { select: { id: true, name: true } },
        _count: { select: { maintenanceRecords: true } },
      },
    }),
    prisma.equipment.count({ where }),
  ]);

  return { equipment, meta: buildMeta(total, page, limit) };
};

export const getEquipmentById = async (id: string) => {
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      maintenanceRecords: {
        orderBy: { maintenanceDate: 'desc' },
        take: 5,
        include: { performedBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!equipment) throw new AppError('Equipment not found', 404, 'NOT_FOUND');
  return equipment;
};

export const createEquipment = async (data: any) => {
  return prisma.equipment.create({
    data: {
      ...data,
      nextMaintenanceDate: data.nextMaintenanceDate
        ? new Date(data.nextMaintenanceDate)
        : undefined,
      installedAt: data.installedAt ? new Date(data.installedAt) : undefined,
    },
    include: { site: { select: { id: true, name: true } } },
  });
};

export const updateEquipment = async (id: string, data: any) => {
  await getEquipmentById(id);
  return prisma.equipment.update({
    where: { id },
    data: {
      ...data,
      nextMaintenanceDate: data.nextMaintenanceDate
        ? new Date(data.nextMaintenanceDate)
        : undefined,
    },
  });
};

export const updateHealthScore = async (
  id: string,
  healthScore: number,
  status?: EquipmentStatus,
) => {
  await getEquipmentById(id);

  // Auto-derive status from health score if not provided
  let derivedStatus = status;
  if (!derivedStatus) {
    if (healthScore >= 70) derivedStatus = 'OPERATIONAL';
    else if (healthScore >= 40) derivedStatus = 'DEGRADED';
    else derivedStatus = 'OFFLINE';
  }

  return prisma.equipment.update({
    where: { id },
    data: { healthScore, status: derivedStatus, lastInspected: new Date() },
  });
};

export const deleteEquipment = async (id: string) => {
  await getEquipmentById(id);
  await prisma.equipment.delete({ where: { id } });
};
