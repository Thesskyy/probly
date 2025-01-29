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
import { getInitialConfig } from "@/lib/file/spreadsheet/config";
import { excelCellToRowCol } from "@/lib/file/spreadsheet/utils";
import SpreadsheetToolbar from "./SpreadsheetToolbar";
import SpreadsheetEChart from "./SpreadsheetEChart";
import { fileImport } from "@/lib/file/import";
import { fileExport } from "@/lib/file/export";
import * as XLSX from "xlsx";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
  initialData?: any[][];
}

export interface SpreadsheetRef {
  handleImport: (file: File) => Promise<void>;
  handleExport: () => void;
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
    const [chartData, setChartData] = useState<any | null>(null);

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
      formulaQueue.forEach((data, target) => {
        if (target === "chart") {
          try {
            const parsedData = JSON.parse(data);
            console.log("Parsed chart data:", parsedData);
            setChartData(parsedData);
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
            fileImport().then((file: any) => {
              if (file) {
                handleImport(file);
              }
            });
          }}
          onExport={handleExport}
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
          <div ref={spreadsheetRef} className="w-full h-full" />
        </div>
      </div>
    );
  },
);

Spreadsheet.displayName = "Spreadsheet";

export default Spreadsheet;
