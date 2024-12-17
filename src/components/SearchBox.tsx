import { useState, useEffect, useRef } from "react";
import { Search, ArrowUp, ArrowDown, X } from "lucide-react";

interface SearchBoxProps {
  onSearch: (query: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  resultsCount: number;
  currentResult: number;
}

const SearchBox = ({
  onSearch,
  onNext,
  onPrevious,
  onClose,
  resultsCount,
  currentResult,
}: SearchBoxProps) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    onSearch(newQuery);
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white p-2 rounded-lg shadow-lg border z-50">
      <div className="flex items-center gap-2 border rounded px-2 py-1">
        <Search className="w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          className="outline-none w-40"
          placeholder="Search..."
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrevious}
          className={`p-1 rounded transition-colors ${
            resultsCount === 0
              ? "text-gray-300 cursor-not-allowed"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          disabled={resultsCount === 0}
          title="Previous"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          onClick={onNext}
          className={`p-1 rounded transition-colors ${
            resultsCount === 0
              ? "text-gray-300 cursor-not-allowed"
              : "hover:bg-gray-100 text-gray-700"
          }`}
          disabled={resultsCount === 0}
          title="Next"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        <span className="text-sm text-gray-500 min-w-[3rem] text-center">
          {resultsCount > 0
            ? `${currentResult + 1}/${resultsCount}`
            : "No results"}
        </span>
      </div>

      <button
        onClick={onClose}
        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-700"
        title="Close"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SearchBox;
