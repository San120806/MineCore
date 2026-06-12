import { useState, useEffect, useCallback } from 'react';
import { getSites } from '@/services/sites.service';
import type { MiningSite, SiteQueryParams } from '@/types/site';
import { useDebounce } from '@/hooks/useDebounce';

export function useSites() {
  const [data, setData] = useState<MiningSite[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<any>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchSites = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: SiteQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
      };
      const response = await getSites(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error('Error fetching sites:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load sites');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites]);

  // Reset page when search or status filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    refetch: fetchSites,
  };
}
