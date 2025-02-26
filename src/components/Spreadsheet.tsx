import "handsontable/dist/handsontable.full.min.css";

import * as XLSX from "xlsx";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import Handsontable from "handsontable";
import SpreadsheetEChart from "./SpreadsheetEChart";
import SpreadsheetToolbar from "./SpreadsheetToolbar";
import { excelCellToRowCol } from "@/lib/file/spreadsheet/utils";
import { fileExport } from "@/lib/file/export";
import { fileImport } from "@/lib/file/import";
import { getInitialConfig } from "@/lib/file/spreadsheet/config";
import { useSpreadsheet } from "@/context/SpreadsheetContext";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
  initialData?: any[][];
}

export interface SpreadsheetRef {
  handleImport: (file: File) => Promise<void>;
  handleExport: () => void;
}

interface ChartInfo {
  data: any[][];
  title?: string;
  type?: string;
  position: { top: number; left: number; width: number; height: number };
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
    const [charts, setCharts] = useState<ChartInfo[]>([]);
    const [hiddenCharts, setHiddenCharts] = useState<number[]>([]);
    const [showChartPanel, setShowChartPanel] = useState(false);

    const handleImport = async (file: File) => {
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        if (hotInstanceRef.current && worksheet) {
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as any[][];
          hotInstanceRef.current.updateSettings(
            {
              data,
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

    const handleExport = async () => {
      try {
        if (hotInstanceRef.current) {
          const data = hotInstanceRef.current.getData();
          await fileExport(data);
        }
      } catch (error) {
        console.error("Error exporting spreadsheet:", error);
        alert("Error exporting file. Please try again.");
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
          // Create a new instance with the config
          hotInstanceRef.current = new Handsontable(
            spreadsheetRef.current,
            config
          );
          
          // Add the afterChange hook after instance creation
          hotInstanceRef.current.addHook('afterChange', (changes: any) => {
            if (changes) {
              const currentData = hotInstanceRef.current?.getData();
              if (currentData && onDataChange) {
                onDataChange(currentData);
              }
            }
          });
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
      formulaQueue.forEach((data, target) => {
        if (target === "chart") {
          try {
            const parsedData = JSON.parse(data);
            console.log("Parsed chart data:", parsedData);
            
            // Calculate a better position for the chart
            const chartWidth = 550;
            const chartHeight = 400;
            
            // Default position if we can't determine a better one
            let chartPosition = {
              top: 100,
              left: 100,
              width: chartWidth,
              height: chartHeight
            };
            
            // If we have a hot instance, try to position the chart better
            if (hotInstanceRef.current && spreadsheetRef.current) {
              // Get the current viewport dimensions
              const viewportWidth = spreadsheetRef.current.clientWidth || 800;
              const viewportHeight = spreadsheetRef.current.clientHeight || 600;
              
              // Position the chart in the center of the visible area
              chartPosition = {
                top: Math.max(50, (viewportHeight - chartHeight) / 3),
                left: Math.max(50, (viewportWidth - chartWidth) / 2),
                width: chartWidth,
                height: chartHeight
              };
            }
            
            // Ensure we have valid chart data
            let chartData = parsedData.options.data;
            
            // Validate chart data format
            if (chartData && Array.isArray(chartData) && chartData.length > 0) {
              // Create a new chart with calculated position
              const newChart: ChartInfo = {
                data: chartData,
                title: parsedData.options.title || "Chart",
                type: parsedData.type || "bar",
                position: chartPosition
              };
              
              setCharts(prevCharts => [...prevCharts, newChart]);
            } else {
              console.error("Invalid chart data format:", chartData);
            }
            
            clearFormula(target);
          } catch (error) {
            console.error("Error setting chart data:", error);
          }
        }
      });
    }, [formulaQueue, clearFormula]);

    const toggleChartVisibility = (index: number) => {
      console.log(`Toggling visibility for chart ${index}`);
      console.log(`Current hidden charts: ${hiddenCharts}`);
      
      setHiddenCharts(prev => {
        const newHiddenCharts = prev.includes(index)
          ? prev.filter(i => i !== index) // Remove from hidden (show it)
          : [...prev, index];             // Add to hidden (hide it)
        
        console.log(`New hidden charts: ${newHiddenCharts}`);
        return newHiddenCharts;
      });
    };

    const deleteChart = (index: number) => {
      setCharts(prevCharts => prevCharts.filter((_, i) => i !== index));
      setHiddenCharts(prev => prev.filter(i => i !== index));
    };

    return (
      <div className="h-full flex flex-col">
        <SpreadsheetToolbar
          onImport={async () => {
            fileImport().then((file: any) => {
              if (file) {
                handleImport(file);
              }
            });
          }}
          onExport={handleExport}
          onChart={() => setShowChartPanel(prev => !prev)}
        />
        <div className="relative flex-1">
          <div ref={spreadsheetRef} className="w-full h-full" />
          
          {/* Render visible charts as overlays */}
          {charts.map((chart, index) => (
            !hiddenCharts.includes(index) && (
              <SpreadsheetEChart
                key={index}
                data={chart.data}
                title={chart.title}
                type={chart.type}
                position={chart.position}
                onClose={() => toggleChartVisibility(index)}
              />
            )
          ))}
          
          {/* Chart management panel */}
          {showChartPanel && (
            <div className="absolute top-2 left-2 bg-white p-3 rounded-lg shadow-md border border-gray-200 z-50 w-64">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-sm">Chart Manager</h3>
                <button 
                  onClick={() => setShowChartPanel(false)}
                  className="text-xs p-1 hover:bg-gray-100 rounded"
                >
                  ✕
                </button>
              </div>
              {charts.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {charts.map((chart, index) => (
                    <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!hiddenCharts.includes(index)}
                          onChange={() => toggleChartVisibility(index)}
                          className="mr-2"
                        />
                        <span className="text-xs truncate max-w-[150px]">
                          {chart.title || `Chart ${index + 1}`}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteChart(index)}
                        className="text-xs text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                        title="Delete chart"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-500 py-2">
                  No charts available, ask Probly to create one.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

Spreadsheet.displayName = "Spreadsheet";

export default Spreadsheet;
