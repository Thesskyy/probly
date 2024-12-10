import { useEffect, useRef } from "react";
import jspreadsheet from "jspreadsheet-ce";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import { useSpreadsheet } from "@/context/SpreadsheetContext";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
}

const Spreadsheet = ({ onDataChange }: SpreadsheetProps) => {
  const spreadsheetRef = useRef<any>(null);
  const jssInstanceRef = useRef<any>(null);
  const { formulaQueue, clearFormula } = useSpreadsheet();

  useEffect(() => {
    formulaQueue.forEach((formula, target) => {
      if (jssInstanceRef.current) {
        const colStr = target.match(/[A-Z]+/)?.[0] || "A";
        const rowNum = parseInt(target.match(/\d+/)?.[0] || "1") - 1;

        const colNum =
          colStr
            .split("")
            .reduce((acc, char) => acc * 26 + (char.charCodeAt(0) - 64), 0) - 1;

        try {
          jssInstanceRef.current.setValue(colNum, rowNum, formula);
          jssInstanceRef.current.updateCell(colNum, rowNum, formula);
          clearFormula(target);
        } catch (error) {
          console.error("Error setting formula:", error);
        }
      }
    });
  }, [formulaQueue, clearFormula]);

  useEffect(() => {
    if (spreadsheetRef.current && !jssInstanceRef.current) {
      try {
        jssInstanceRef.current = jspreadsheet(spreadsheetRef.current, {
          data: [
            ["", ""],
            ["", ""],
          ],
          columns: [
            { type: "text", width: 120 },
            { type: "text", width: 120 },
          ],
          minDimensions: [10, 10],
          onchange: () => {
            const data = jssInstanceRef.current.getData();
            onDataChange?.(data.slice(0, 5));
          },
        });
        console.log("Spreadsheet initialized");
      } catch (error) {
        console.error("Error initializing spreadsheet:", error);
      }
    }
  }, [onDataChange]);

  return (
    <div>
      <div ref={spreadsheetRef} />
    </div>
  );
};

export default Spreadsheet;
