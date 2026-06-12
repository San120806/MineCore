'use client';
// MineCore — usePagination hook
import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination({ initialPage = 1, initialPageSize = 10 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const reset = useCallback(() => {
    setPage(1);
  }, []);

  return { page, pageSize, goToPage, reset };
}
