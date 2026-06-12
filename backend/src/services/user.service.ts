import { Prisma, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import prisma from '@config/database';
import { AppError } from '@middleware/errorHandler';
import { getPagination, buildMeta } from '@utils/pagination';

const USER_SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export const getAllUsers = async (query: {
  page?: string;
  limit?: string;
  search?: string;
  role?: string;
}) => {
  const { page, limit, skip } = getPagination(query.page, query.limit);

  const where: Prisma.UserWhereInput = {
    ...(query.role && { role: query.role as UserRole }),
    ...(query.search && {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: USER_SAFE_SELECT }),
    prisma.user.count({ where }),
  ]);

  return { users, meta: buildMeta(total, page, limit) };
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id }, select: USER_SAFE_SELECT });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};

export const updateUser = async (id: string, data: { name?: string; email?: string; role?: string }) => {
  await getUserById(id);
  return prisma.user.update({ where: { id }, data: { name: data.name, email: data.email, role: data.role as UserRole | undefined }, select: USER_SAFE_SELECT });
};

export const updateUserStatus = async (id: string, isActive: boolean) => {
  await getUserById(id);
  return prisma.user.update({ where: { id }, data: { isActive }, select: USER_SAFE_SELECT });
};

export const deleteUser = async (id: string) => {
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
};

export const changePassword = async (
  id: string,
  currentPassword: string,
  newPassword: string,
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
};
