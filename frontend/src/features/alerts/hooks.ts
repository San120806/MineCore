import { useState, useEffect, useCallback } from "react";
import { getAlerts } from "@/services/alerts.service";
import type { SafetyAlert, AlertQueryParams } from "@/types/alert";
import { useDebounce } from "@/hooks/useDebounce";
import { AlertSeverity, AlertStatus } from "@/types/enums";

export function useAlerts() {
  const [data, setData] = useState<SafetyAlert[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>("");
  const [severity, setSeverity] = useState<AlertSeverity | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<AlertStatus | undefined>(undefined);
  const [siteId, setSiteId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AlertQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        severity: severity || undefined,
        status: status || undefined,
        siteId: siteId || undefined,
      };
      const response = await getAlerts(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error("Error fetching alerts:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load alerts",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, severity, status, siteId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, severity, status, siteId]);

  return {
    data,
    totalCount,
    isLoading,
    error,
    search,
    setSearch,
    severity,
    setSeverity,
    status,
    setStatus,
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch: fetchAlerts,
  };
}
