import { createContext, useContext, useState, ReactNode } from 'react';

interface SpreadsheetContextType {
  setFormulas: (updates: Array<{ cell: string; formula: string }>) => void;
  setFormula: (cell: string, formula: string) => void;
  formulaQueue: Array<{ cell: string; formula: string }>;
  clearFormula: (index: number) => void;
}

const SpreadsheetContext = createContext<SpreadsheetContextType | null>(null);

export const SpreadsheetProvider = ({ children }: { children: ReactNode }) => {
  const [formulaQueue, setFormulaQueue] = useState<Array<{ cell: string; formula: string }>>([]);

  const setFormulas = (updates: Array<{ target: string; formula: string }>) => {
    setFormulaQueue(prev => [
      ...prev,
      ...updates.map(u => ({ cell: u.target, formula: u.formula }))
    ]);
  };

  const setFormula = (cell: string, formula: string) => {
    setFormulaQueue(prev => [...prev, { cell, formula }]);
  };

  const clearFormula = (index: number) => {
    setFormulaQueue(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SpreadsheetContext.Provider value={{
      setFormula,
      setFormulas,
      formulaQueue,
      clearFormula
    }}>
      {children}
    </SpreadsheetContext.Provider>
  );
};

export const useSpreadsheet = () => {
  const context = useContext(SpreadsheetContext);
  if (!context) {
    throw new Error('useSpreadsheet must be used within SpreadsheetProvider');
  }
  return context;
};