import { Prisma, SiteStatus } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllSites = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.MiningSiteWhereInput = {
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
    ...(query.status && { status: query.status as SiteStatus }),
  };

  const [sites, total] = await Promise.all([
    prisma.miningSite.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { vehicles: true, sensors: true, equipment: true, safetyAlerts: true } },
      },
    }),
    prisma.miningSite.count({ where }),
  ]);

  return { sites, meta: buildMeta(total, page, limit) };
};

export const getSiteById = async (id: string) => {
  const site = await prisma.miningSite.findUnique({
    where: { id },
    include: {
      _count: { select: { vehicles: true, sensors: true, equipment: true, safetyAlerts: true } },
    },
  });
  if (!site) throw new AppError('Mining site not found', 404, 'NOT_FOUND');
  return site;
};

export const createSite = async (data: Prisma.MiningSiteCreateInput) => {
  return prisma.miningSite.create({ data });
};

export const updateSite = async (id: string, data: Prisma.MiningSiteUpdateInput) => {
  await getSiteById(id); // throws if not found
  return prisma.miningSite.update({ where: { id }, data });
};

export const deleteSite = async (id: string) => {
  await getSiteById(id);
  await prisma.miningSite.delete({ where: { id } });
};
