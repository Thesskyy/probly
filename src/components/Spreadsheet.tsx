import { useEffect, useRef, useState } from "react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import * as XLSX from "xlsx";
import SpreadsheetToolbar from "./SpreadsheetToolbar";
import SearchBox from "./SearchBox";
import { getInitialConfig } from "@/lib/spreadsheet/config";
import { excelCellToRowCol, readFileData } from "@/lib/spreadsheet/utils";
import { importSpreadsheet } from "@/lib/spreadsheet/import";
import {
  textFormattingHandlers,
  editHandlers,
  tableHandlers,
  cellHandlers,
  dataHandlers,
} from "@/lib/handlers";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
  initialData?: any[][];
}

interface SearchResult {
  row: number;
  col: number;
  value: string;
}

const Spreadsheet = ({ onDataChange, initialData }: SpreadsheetProps) => {
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const hotInstanceRef = useRef<Handsontable | null>(null);
  const { formulaQueue, clearFormula } = useSpreadsheet();
  const [currentData, setCurrentData] = useState(
    initialData || [
      ["", ""],
      ["", ""],
    ],
  );
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  const handleImport = async (file: File) => {
    try {
      const { data, styles, mergedCells } = await importSpreadsheet(file);

      if (hotInstanceRef.current) {
        hotInstanceRef.current.updateSettings(
          {
            data,
            cells: function (row, col) {
              return {
                className: [
                  styles.bold[row]?.[col] ? "htBold" : "",
                  `ht${styles.alignment[row]?.[col]?.charAt(0).toUpperCase()}${styles.alignment[row]?.[col]?.slice(1)}`, // htLeft, htCenter, htRight
                ]
                  .filter(Boolean)
                  .join(" "),
              };
            },
            mergeCells: mergedCells,
          },
          false,
        );

        if (onDataChange) {
          onDataChange(data);
        }
      }
    } catch (error) {
      console.error("Error importing spreadsheet:", error);
      alert("Error importing file. Please try again.");
    }
  };
  const handleExport = () => {
    try {
      if (hotInstanceRef.current) {
        const data = hotInstanceRef.current.getData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
        XLSX.writeFile(wb, "spreadsheet_export.xlsx");
      }
    } catch (error) {
      console.error("Error exporting file:", error);
      alert("Error exporting file. Please try again.");
    }
  };

  // Search handlers
  const handleSearch = (query: string) => {
    if (hotInstanceRef.current) {
      const results = dataHandlers.handleSearch(hotInstanceRef.current, query);
      setSearchResults(results);
      setCurrentSearchIndex(0);

      if (results.length > 0) {
        dataHandlers.highlightSearchResult(hotInstanceRef.current, results[0]);
      }
    }
  };

  const handleNextSearch = () => {
    if (searchResults.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResults.length;
      setCurrentSearchIndex(nextIndex);
      dataHandlers.highlightSearchResult(
        hotInstanceRef.current,
        searchResults[nextIndex],
      );
    }
  };

  const handlePreviousSearch = () => {
    if (searchResults.length > 0) {
      const prevIndex =
        currentSearchIndex === 0
          ? searchResults.length - 1
          : currentSearchIndex - 1;
      setCurrentSearchIndex(prevIndex);
      dataHandlers.highlightSearchResult(
        hotInstanceRef.current,
        searchResults[prevIndex],
      );
    }
  };

  useEffect(() => {
    formulaQueue.forEach((formula, target) => {
      if (hotInstanceRef.current) {
        try {
          const { row, col } = excelCellToRowCol(target);
          hotInstanceRef.current.setDataAtCell(row, col, formula);
          const newData = hotInstanceRef.current.getData();
          setCurrentData(newData);
          clearFormula(target);
        } catch (error) {
          console.error("Error setting formula:", error);
        }
      }
    });
  }, [formulaQueue, clearFormula]);

  useEffect(() => {
    if (spreadsheetRef.current && !hotInstanceRef.current) {
      try {
        const config = getInitialConfig(currentData);
        config.afterChange = (changes: any) => {
          if (changes) {
            const currentData = hotInstanceRef.current?.getData();
            if (currentData && onDataChange) {
              onDataChange(currentData);
            }
          }
        };
        hotInstanceRef.current = new Handsontable(
          spreadsheetRef.current,
          getInitialConfig(currentData),
        );
      } catch (error) {
        console.error("Error initializing spreadsheet:", error);
      }
    }

    return () => {
      if (hotInstanceRef.current) {
        hotInstanceRef.current.destroy();
        hotInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (hotInstanceRef.current && currentData) {
      hotInstanceRef.current.updateSettings({ data: currentData }, false);
    }
  }, [currentData]);

  return (
    <div className="h-full flex flex-col">
      <SpreadsheetToolbar
        onImport={handleImport}
        onExport={handleExport}
        onUndo={() => editHandlers.handleUndo(hotInstanceRef.current)}
        onRedo={() => editHandlers.handleRedo(hotInstanceRef.current)}
        onCut={editHandlers.handleCut}
        onCopy={editHandlers.handleCopy}
        onPaste={editHandlers.handlePaste}
        onBold={() => textFormattingHandlers.handleBold(hotInstanceRef.current)}
        onItalic={() =>
          textFormattingHandlers.handleItalic(hotInstanceRef.current)
        }
        onUnderline={() =>
          textFormattingHandlers.handleUnderline(hotInstanceRef.current)
        }
        onAlignLeft={() =>
          textFormattingHandlers.handleAlignment(
            hotInstanceRef.current,
            "htLeft",
          )
        }
        onAlignCenter={() =>
          textFormattingHandlers.handleAlignment(
            hotInstanceRef.current,
            "htCenter",
          )
        }
        onAlignRight={() =>
          textFormattingHandlers.handleAlignment(
            hotInstanceRef.current,
            "htRight",
          )
        }
        onAddRow={() => tableHandlers.handleAddRow(hotInstanceRef.current)}
        onAddColumn={() =>
          tableHandlers.handleAddColumn(hotInstanceRef.current)
        }
        onDeleteRow={() =>
          tableHandlers.handleDeleteRow(hotInstanceRef.current)
        }
        onDeleteColumn={() =>
          tableHandlers.handleDeleteColumn(hotInstanceRef.current)
        }
        onMergeCells={() =>
          cellHandlers.handleMergeCells(hotInstanceRef.current)
        }
        onUnmergeCells={() =>
          cellHandlers.handleUnmergeCells(hotInstanceRef.current)
        }
        onSearch={() => setShowSearch(true)}
        onSort={() => dataHandlers.handleSort(hotInstanceRef.current)}
      />
      <div className="relative flex-1">
        {showSearch && (
          <SearchBox
            onSearch={handleSearch}
            onNext={handleNextSearch}
            onPrevious={handlePreviousSearch}
            onClose={() => setShowSearch(false)}
            resultsCount={searchResults.length}
            currentResult={currentSearchIndex}
          />
        )}
        <div ref={spreadsheetRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default Spreadsheet;
