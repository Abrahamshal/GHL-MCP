import React, { useState, useEffect, useCallback } from "react";
import type { SearchBarProps } from "../../types.js";
import { useMCPApp } from "../../context/MCPAppContext.js";

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Search...",
  searchTool,
}) => {
  const { callTool } = useMCPApp();
  const [value, setValue] = useState("");

  // Debounced search — fires 300ms after last keystroke
  useEffect(() => {
    if (!value.trim() || !searchTool) return;

    const timer = setTimeout(() => {
      callTool(searchTool, { query: value.trim() }).catch(() => {
        // silently handle search errors
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [value, searchTool, callTool]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
    },
    [],
  );

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};
