import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useState,
} from "react";
import Handsontable from "handsontable";
import "handsontable/dist/handsontable.full.min.css";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import * as XLSX from "xlsx";
import SpreadsheetToolbar from "./SpreadsheetToolbar";
import SearchBox from "./SearchBox";
import { getInitialConfig } from "@/lib/spreadsheet/config";
import { excelCellToRowCol } from "@/lib/spreadsheet/utils";
import { importSpreadsheet } from "@/lib/spreadsheet/import";
import {
  textFormattingHandlers,
  editHandlers,
  tableHandlers,
  cellHandlers,
  dataHandlers,
} from "@/lib/handlers";
import SpreadsheetEChart from "./SpreadsheetEChart";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
  initialData?: any[][];
}

export interface SpreadsheetRef {
  handleImport: (file: File) => Promise<void>;
  handleExport: () => void;
}

interface SearchResult {
  row: number;
  col: number;
  value: string;
}

const Spreadsheet = forwardRef<SpreadsheetRef, SpreadsheetProps>(
  ({ onDataChange, initialData }, ref) => {
    const spreadsheetRef = useRef<HTMLDivElement>(null);
    const hotInstanceRef = useRef<Handsontable | null>(null);
    const { formulaQueue, clearFormula, setFormulas } = useSpreadsheet();
    const [currentData, setCurrentData] = useState(
      initialData || [
        ["", ""],
        ["", ""],
      ],
    );
    const [showChart, setShowChart] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const [chartData, setChartData] = useState<any | null>(null);

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
                    `ht${styles.alignment[row]?.[col]?.charAt(0).toUpperCase()}${styles.alignment[row]?.[col]?.slice(1)}`,
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

    const handleSearch = (query: string) => {
      if (hotInstanceRef.current) {
        const results = dataHandlers.handleSearch(
          hotInstanceRef.current,
          query,
        );
        setSearchResults(results);
        setCurrentSearchIndex(0);

        if (results.length > 0) {
          dataHandlers.highlightSearchResult(
            hotInstanceRef.current,
            results[0],
          );
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

    useImperativeHandle(
      ref,
      () => ({
        handleImport,
        handleExport,
      }),
      [],
    );

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
            config,
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

    useEffect(() => {
      if (chartData) {
        setShowChart(true);
      }
    }, [chartData]);

    useEffect(() => {
      if (formulaQueue.size > 0) {
        console.log("formulaQueue:", formulaQueue);
      }
      formulaQueue.forEach((data, target) => {
        if (target === "chart") {
          try {
            setChartData(JSON.parse(data));
          } catch (error) {
            console.error("Error setting chart data:", error);
          }
        }
      });
    }, [formulaQueue]);

    return (
      <div className="h-full flex flex-col">
        <SpreadsheetToolbar
          onImport={async () => {
            if (window.electron) {
              try {
                const result = await window.electron.invoke("show-open-dialog");

                if (!result.canceled && result.filePaths.length > 0) {
                  const filePath = result.filePaths[0];
                  const buffer = await window.electron.invoke(
                    "read-file",
                    filePath,
                  );

                  // Create a more detailed file object
                  const fileName = filePath.split("/").pop() || "spreadsheet";
                  const fileType =
                    fileName.split(".").pop()?.toLowerCase() || "";
                  let mimeType = "application/octet-stream";

                  if (fileType === "xlsx" || fileType === "xls") {
                    mimeType =
                      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                  } else if (fileType === "csv") {
                    mimeType = "text/csv";
                  }

                  const file = new File([new Uint8Array(buffer)], fileName, {
                    type: mimeType,
                  });
                  await handleImport(file);
                }
              } catch (error) {
                console.error("Error opening file dialog:", error);
                alert("Error importing file. Please try again.");
              }
            }
          }}
          onExport={() => {
            if (window.electron) {
              window.electron
                .invoke("show-save-dialog")
                .then((result) => {
                  if (!result.canceled && result.filePath) {
                    handleExport();
                  }
                })
                .catch((error) => {
                  console.error("Error saving file:", error);
                  alert("Error exporting file. Please try again.");
                });
            }
          }}
          onUndo={() => editHandlers.handleUndo(hotInstanceRef.current)}
          onRedo={() => editHandlers.handleRedo(hotInstanceRef.current)}
          onCut={editHandlers.handleCut}
          onCopy={editHandlers.handleCopy}
          onPaste={editHandlers.handlePaste}
          onBold={() =>
            textFormattingHandlers.handleBold(hotInstanceRef.current)
          }
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
          onChart={() => setShowChart((prev) => !prev)}
        />
        <div className="relative flex-1">
          {showChart && chartData && (
            <div className="absolute inset-0 bg-white p-4 z-10">
              <SpreadsheetEChart
                data={chartData.options.data}
                title={chartData.options.title}
                type={chartData.type}
              />
              <button
                onClick={() => setShowChart(false)}
                className="absolute top-2 right-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close Chart
              </button>
            </div>
          )}
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
  },
);

Spreadsheet.displayName = "Spreadsheet";

export default Spreadsheet;
