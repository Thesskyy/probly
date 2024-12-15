import { useEffect, useRef } from "react";
import { HyperFormula } from 'hyperformula';
import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';
import { useSpreadsheet } from "@/context/SpreadsheetContext";

interface SpreadsheetProps {
  onDataChange?: (data: any[][]) => void;
}

function excelCellToRowCol(cellId: string): { row: number; col: number } {
    // Convert excel cell (e.g. 'A1') to row and column (e.g. {row: 0, col: 0})
    const match = cellId.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
        throw new Error("Invalid cell identifier format.");
    }
    const [, colLetters, rowNumber] = match;

    // Convert column letters to a 0-based index
    let col = 0;
    for (let i = 0; i < colLetters.length; i++) {
        col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    col -= 1; // Adjust to 0-based index

    const row = parseInt(rowNumber, 10) - 1; // Adjust to 0-based index
    return { row, col };
}

const Spreadsheet = ({ onDataChange }: SpreadsheetProps) => {
  const spreadsheetRef = useRef<HTMLDivElement>(null);
  const hotInstanceRef = useRef<Handsontable | null>(null);
  const { formulaQueue, clearFormula } = useSpreadsheet();

  useEffect(() => {
    formulaQueue.forEach((formula, target) => {
      if (hotInstanceRef.current) {
        try {
          const { row, col } = excelCellToRowCol(target);
          hotInstanceRef.current.setDataAtCell(row, col, formula);
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
        const hyperformulaInstance = HyperFormula.buildEmpty({
          licenseKey: 'gpl-v3'
        });

        hotInstanceRef.current = new Handsontable(spreadsheetRef.current, {
          data: [
            ['', ''],
            ['', '']
          ],
          rowHeaders: true,
          colHeaders: true,
          width: '100%',
          height: '70vh',
          licenseKey: 'non-commercial-and-evaluation',
          formulas: {
            engine: hyperformulaInstance
          },
          minRows: 50,
          minCols: 26,
          autoColumnSize: true,
          autoRowSize: true,
          manualColumnResize: true,
          manualRowResize: true,
          colWidths: 150,
          contextMenu: true,
          comments: true,
          fillHandle: true,
          persistentState: true,
          headerTooltips: true,
          mergeCells: true,
          selectionMode: 'multiple',
          afterChange: (changes: any) => {
            if (changes && onDataChange) {
              const data = hotInstanceRef.current?.getData() || [];
              onDataChange(data.slice(0, 5));
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
  }, [onDataChange]);

  return <div ref={spreadsheetRef} />;
};

export default Spreadsheet;
