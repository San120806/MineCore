import { useState, useEffect, useCallback } from 'react';
import { getMaintenanceList } from '@/services/maintenance.service';
import type { MaintenanceRecord, MaintenanceQueryParams } from '@/types/maintenance';
import { useDebounce } from '@/hooks/useDebounce';
import { MaintenanceStatus, MaintenanceType } from '@/types/enums';

export function useMaintenance() {
  const [data, setData] = useState<MaintenanceRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<MaintenanceStatus | undefined>(undefined);
  const [type, setType] = useState<MaintenanceType | undefined>(undefined);
  const [equipmentId, setEquipmentId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchMaintenance = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: MaintenanceQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
        type: type || undefined,
        equipmentId: equipmentId || undefined,
      };
      const response = await getMaintenanceList(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error('Error fetching maintenance:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load maintenance records');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, type, equipmentId]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type, equipmentId]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    type,
    setType,
    equipmentId,
    setEquipmentId,
    page,
    setPage,
    pageSize,
    refetch: fetchMaintenance,
  };
}
