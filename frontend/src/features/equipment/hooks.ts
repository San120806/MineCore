import { useState, useEffect, useCallback } from "react";
import { getEquipmentList } from "@/services/equipment.service";
import type { Equipment, EquipmentQueryParams } from "@/types/equipment";
import { useDebounce } from "@/hooks/useDebounce";
import { EquipmentStatus, EquipmentType } from "@/types/enums";

export function useEquipment() {
  const [data, setData] = useState<Equipment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and pagination state
  const [search, setSearch] = useState<string>("");
  const [status, setStatus] = useState<EquipmentStatus | undefined>(undefined);
  const [type, setType] = useState<EquipmentType | undefined>(undefined);
  const [siteId, setSiteId] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);

  const debouncedSearch = useDebounce(search, 400);

  const fetchEquipment = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: EquipmentQueryParams = {
        page,
        limit: pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
        type: type || undefined,
        siteId: siteId || undefined,
      };
      const response = await getEquipmentList(params);
      setData(response.data);
      setTotalCount(response.meta.total);
    } catch (err: any) {
      console.error("Error fetching equipment:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load equipment",
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, status, type, siteId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

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
    refetch: fetchEquipment,
  };
}
