"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { getInterventionSuggestionsAction } from "@/lib/actions/get-intervention-suggestions";
import type { InterventionSuggestion } from "@/lib/schemas/clinical-trial-suggestion.schema";

interface InterventionSuggestInputProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
}

export function InterventionSuggestInput({
  value,
  onChange,
  onSelect,
  placeholder = "Enter intervention name...",
  ...props
}: InterventionSuggestInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<InterventionSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value); // Sync with external value changes
  }, [value]);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setIsLoading(true);
    setError(null);

    debounceTimeoutRef.current = setTimeout(async () => {
      const result = await getInterventionSuggestionsAction(text);
      if ("error" in result) {
        setError(result.error);
        setSuggestions(null);
      } else {
        setSuggestions(result);
        setError(null);
      }
      setIsLoading(false);
      setShowSuggestions(true);
    }, 300); // 300ms debounce
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Notify parent of every change for form state
    if (newValue.length > 0) {
      fetchSuggestions(newValue);
    } else {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      setSuggestions(null);
      setShowSuggestions(false);
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setSuggestions(null);
    setShowSuggestions(false);
    if (onSelect) {
      onSelect(suggestion); // Notify parent of selection
    } else {
      onChange(suggestion); // If no onSelect, update via onChange
    }
  };

  const handleFocus = () => {
    // Fetch suggestions even on empty input when focused
    fetchSuggestions(inputValue);
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow click on suggestion list
    setTimeout(() => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(document.activeElement)) {
        setShowSuggestions(false);
      }
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <Input
        {...props}
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />
      {isLoading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {showSuggestions && !isLoading && (suggestions?.length || error) && (
        <ul
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {error && (
            <li className="px-3 py-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="mr-2 h-4 w-4" /> {error}
            </li>
          )}
          {!error && suggestions?.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No suggestions found.</li>
          )}
          {!error &&
            suggestions?.map((suggestion, index) => (
              <li
                key={index}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click registers
                role="option"
                aria-selected={false}
              >
                {suggestion}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
} 