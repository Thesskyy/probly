import React, { createContext, useContext, useState } from "react";
import { CellUpdate } from "@/types/api";

interface SpreadsheetContextType {
  setFormula: (target: string, formula: string) => void;
  setFormulas: (updates: CellUpdate[]) => void;
  formulaQueue: Map<string, string>;
  clearFormula: (target: string) => void;
  setChartData: (chartData: any) => void;
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

  return (
    <SpreadsheetContext.Provider
      value={{
        setFormula,
        setFormulas,
        formulaQueue,
        clearFormula,
        setChartData,
      }}
    >
      {children}
    </SpreadsheetContext.Provider>
  );
};

export default SpreadsheetContext;
