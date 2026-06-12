import { useState, useEffect, useCallback } from 'react';
import { getSensors } from '@/services/sensors.service';
import type { Sensor, SensorQueryParams } from '@/types/sensor';
import { useDebounce } from '@/hooks/useDebounce';
import { SensorStatus, SensorType } from '@/types/enums';

export function useSensors() {
  const [data, setData] = useState<Sensor[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<SensorStatus | undefined>(undefined);
  const [sensorType, setSensorType] = useState<SensorType | undefined>(undefined);
  const [siteId, setSiteId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSensors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: SensorQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
        sensorType: sensorType || undefined,
        siteId: siteId || undefined,
      };
      const response = await getSensors(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error('Error fetching sensors:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load sensors');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, sensorType, siteId]);

  useEffect(() => {
    fetchSensors();
  }, [fetchSensors]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sensorType, siteId]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    sensorType,
    setSensorType,
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch: fetchSensors,
  };
}
