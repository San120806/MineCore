import { Prisma, AlertSeverity, AlertStatus } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllAlerts = async (query: {
  page?: string;
  limit?: string;
  severity?: string;
  status?: string;
  siteId?: string;
  search?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.SafetyAlertWhereInput = {
    ...(query.siteId && { siteId: query.siteId }),
    ...(query.severity && { severity: query.severity as AlertSeverity }),
    ...(query.status && { status: query.status as AlertStatus }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [alerts, total] = await Promise.all([
    prisma.safetyAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { raisedAt: 'desc' },
      include: {
        site: { select: { id: true, name: true } },
        raisedBy: { select: { id: true, name: true, role: true } },
        resolvedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.safetyAlert.count({ where }),
  ]);

  return { alerts, meta: buildMeta(total, page, limit) };
};

export const getAlertById = async (id: string) => {
  const alert = await prisma.safetyAlert.findUnique({
    where: { id },
    include: {
      site: { select: { id: true, name: true } },
      raisedBy: { select: { id: true, name: true, role: true } },
      resolvedBy: { select: { id: true, name: true } },
    },
  });
  if (!alert) throw new AppError('Safety alert not found', 404, 'NOT_FOUND');
  return alert;
};

export const createAlert = async (data: any, raisedById: string) => {
  return prisma.safetyAlert.create({
    data: { ...data, raisedById },
    include: {
      site: { select: { id: true, name: true } },
      raisedBy: { select: { id: true, name: true } },
    },
  });
};

export const acknowledgeAlert = async (id: string) => {
  const alert = await getAlertById(id);
  if (alert.status !== 'OPEN') throw new AppError('Only OPEN alerts can be acknowledged', 400, 'INVALID_STATUS');
  return prisma.safetyAlert.update({ where: { id }, data: { status: 'ACKNOWLEDGED' } });
};

export const resolveAlert = async (id: string, resolvedById: string) => {
  const alert = await getAlertById(id);
  if (alert.status === 'RESOLVED') throw new AppError('Alert is already resolved', 400, 'ALREADY_RESOLVED');

  return prisma.safetyAlert.update({
    where: { id },
    data: { status: 'RESOLVED', resolvedById, resolvedAt: new Date() },
  });
};

export const deleteAlert = async (id: string) => {
  await getAlertById(id);
  await prisma.safetyAlert.delete({ where: { id } });
};
