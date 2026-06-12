import { Prisma, VehicleStatus, VehicleType } from '@prisma/client';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

export const getAllVehicles = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  type?: string;
  siteId?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.VehicleWhereInput = {
    ...(query.siteId && { siteId: query.siteId }),
    ...(query.status && { status: query.status as VehicleStatus }),
    ...(query.type && { type: query.type as VehicleType }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { vehicleCode: { contains: query.search, mode: 'insensitive' } },
        { model: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { site: { select: { id: true, name: true } } },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { vehicles, meta: buildMeta(total, page, limit) };
};

export const getVehicleById = async (id: string) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { site: { select: { id: true, name: true, location: true } } },
  });
  if (!vehicle) throw new AppError('Vehicle not found', 404, 'NOT_FOUND');
  return vehicle;
};

export const createVehicle = async (data: any) => {
  return prisma.vehicle.create({
    data,
    include: { site: { select: { id: true, name: true } } },
  });
};

export const updateVehicle = async (id: string, data: Prisma.VehicleUpdateInput) => {
  await getVehicleById(id);
  return prisma.vehicle.update({
    where: { id },
    data,
    include: { site: { select: { id: true, name: true } } },
  });
};

export const updateVehicleStatus = async (id: string, status: VehicleStatus) => {
  await getVehicleById(id);
  return prisma.vehicle.update({ where: { id }, data: { status, lastSeen: new Date() } });
};

export const deleteVehicle = async (id: string) => {
  await getVehicleById(id);
  await prisma.vehicle.delete({ where: { id } });
};
