import React, { createContext, useContext, useState, useEffect } from "react";
import { CellUpdate } from "@/types/api";
import { calculateCellValue } from "@/lib/file/spreadsheet/config";

interface SpreadsheetContextType {
  setFormula: (target: string, formula: string) => void;
  setFormulas: (updates: CellUpdate[]) => void;
  formulaQueue: Map<string, string>;
  clearFormula: (target: string) => void;
  setChartData: (chartData: any) => void;
  cellValues: Map<string, any>;
  setCellValues: (updates: Map<string, any>) => void;
  clearCellValues: (target: string) => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextType | undefined>(
  undefined,
);

export const useSpreadsheet = () => {
  const context = useContext(SpreadsheetContext);
  if (!context) {
    throw new Error("useSpreadsheet must be used within a SpreadsheetProvider");
  }
  return context;
};

export const SpreadsheetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [formulaQueue, setFormulaQueue] = useState<Map<string, string>>(
    new Map(),
  );
  const [cellValues, setCellValuesState] = useState<Map<string, any>>(
    new Map(),
  );
  const [evaluatedValues, setEvaluatedValues] = useState<Map<string, any>>(
    new Map(),
  );

  useEffect(() => {
    const nextEvaluatedValues = new Map(evaluatedValues);
    formulaQueue.forEach((formula, target) => {
      const calculatedValue = calculateCellValue(formula, target, cellValues);
      nextEvaluatedValues.set(target, calculatedValue);
    });
    setEvaluatedValues(nextEvaluatedValues);
  }, [formulaQueue, cellValues]);

  const setFormula = (target: string, formula: string) => {
    setFormulaQueue((prev) => {
      const next = new Map(prev);
      next.set(target, formula);
      return next;
    });
  };

  const setFormulas = (updates: CellUpdate[]) => {
    setFormulaQueue((prev) => {
      const next = new Map(prev);
      updates.forEach(({ target, formula }) => {
        next.set(target, formula);
      });
      return next;
    });
  };

  const clearFormula = (target: string) => {
    setFormulaQueue((prev) => {
      const next = new Map(prev);
      next.delete(target);
      return next;
    });
  };

  const setChartData = (chartData: any) => {
    setFormulaQueue((prev) => {
      const next = new Map(prev);
      next.set("chart", JSON.stringify(chartData));
      return next;
    });
  };

  const setCellValues = (updates: Map<string, any>) => {
    setCellValuesState((prev) => {
      const next = new Map(prev);
      updates.forEach((value, key) => {
        next.set(key, value);
      });
      return next;
    });
  };

  const clearCellValues = (target: string) => {
    setCellValuesState((prev) => {
      const next = new Map(prev);
      next.delete(target);
      return next;
    });
  };

  return (
    <SpreadsheetContext.Provider
      value={{
        setFormula,
        setFormulas,
        formulaQueue,
        clearFormula,
        setChartData,
        cellValues: evaluatedValues,
        setCellValues,
        clearCellValues,
      }}
    >
      {children}
    </SpreadsheetContext.Provider>
  );
};

export default SpreadsheetContext;
