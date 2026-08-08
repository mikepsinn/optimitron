'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { getConditionSuggestionsAction } from '@/lib/actions/get-condition-suggestions';
import { logger } from '@/lib/logger';
import { Loader2, AlertCircle } from 'lucide-react';

const LOG_PREFIX = '[ConditionSuggestInput]';
const DEBOUNCE_DELAY = 300; // milliseconds

interface ConditionSuggestInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function ConditionSuggestInput({
  id,
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  required,
}: ConditionSuggestInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const fetchSuggestions = useCallback(async (inputValue: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // logger.debug(`${LOG_PREFIX} Fetching for: '${inputValue}'`);
      const result = await getConditionSuggestionsAction(inputValue);
      if (result.success && result.data) {
        setSuggestions(result.data);
        if (result.data.length > 0) {
          setShowSuggestions(true);
        }
      } else {
        setError(result.error || 'Failed to fetch suggestions.');
        setSuggestions([]);
        logger.warn(`${LOG_PREFIX} Error fetching suggestions:`, { error: result.error });
      }
    } catch (e: any) {
      setError('An unexpected error occurred.');
      setSuggestions([]);
      logger.error(`${LOG_PREFIX} Exception fetching suggestions:`, { message: e.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedFetchSuggestions = useCallback((inputValue: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, DEBOUNCE_DELAY);
  }, [fetchSuggestions]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    onChange(newValue); // Update parent state immediately
    if (newValue.trim() === '') {
      setSuggestions([]); // Clear suggestions if input is empty
      setShowSuggestions(false);
    } else {
      debouncedFetchSuggestions(newValue);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSelect(suggestion); // Use onSelect for chosen suggestion
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleFocus = () => {
    // Fetch suggestions if input is empty or to refresh current suggestions
    // if (value.trim() === '' || suggestions.length === 0) {
       fetchSuggestions(value); // Fetch suggestions based on current input value (can be empty)
    // }
    // setShowSuggestions(true); // Decide whether to show immediately or wait for fetch
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    // Delay hiding suggestions to allow click event on suggestion item
    // Check if the relatedTarget (where focus is going) is part of the suggestions list
    if (suggestionsRef.current && !suggestionsRef.current.contains(event.relatedTarget as Node)) {
        setTimeout(() => {
            setShowSuggestions(false);
        }, 150);
    }
  };
  
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className || ''}`} onBlur={handleBlur}>
      <Input
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        ref={inputRef}
        autoComplete="off" // Important for custom suggestion lists
        required={required}
        className="w-full"
      />
      {isLoading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <ul 
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseDown={(e) => e.preventDefault()} // Prevents input blur before click registers
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <div className="absolute z-10 w-full mt-1 bg-destructive border border-destructive-foreground/20 rounded-md shadow-lg p-2 text-destructive-foreground text-xs flex items-center">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {error}
        </div>
      )}
    </div>
  );
} 