"use client";

// ─────────────────────────────────────────────────────────────────────────────
// MineCore — SearchBar Component (debounced)
// ─────────────────────────────────────────────────────────────────────────────

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value: externalValue = "",
  onChange,
  placeholder = "Search…",
  debounceMs = 350,
  className,
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState(externalValue);
  const debouncedValue = useDebounce(inputValue, debounceMs);

  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        id="table-search"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 text-sm"
      />
      {inputValue && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setInputValue("")}
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}
