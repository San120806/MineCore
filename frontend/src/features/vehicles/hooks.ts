import { useState, useEffect, useCallback } from "react";
import { getVehicles } from "@/services/vehicles.service";
import type { Vehicle, VehicleQueryParams } from "@/types/vehicle";
import { useDebounce } from "@/hooks/useDebounce";
import { VehicleStatus, VehicleType } from "@/types/enums";

export function useVehicles() {
  const [data, setData] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<VehicleStatus | undefined>(undefined);
  const [type, setType] = useState<VehicleType | undefined>(undefined);
  const [siteId, setSiteId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchVehicles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: VehicleQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
        type: type || undefined,
        siteId: siteId || undefined,
      };
      const response = await getVehicles(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error("Error fetching vehicles:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load vehicles",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, type, siteId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, type, siteId]);

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
    siteId,
    setSiteId,
    page,
    setPage,
    pageSize,
    refetch: fetchVehicles,
  };
}
