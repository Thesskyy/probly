import * as XLSX from "xlsx";

import { HyperFormula } from "hyperformula";

// Helper function to convert HyperFormula cell address to string format
const cellAddressToString = (address: any) => {
  if (typeof address !== "object" || address === null) {
    return null;
  }

  return XLSX.utils.encode_cell({
    r: address.row,
    c: address.col,
  });
};

// Create a persistent HyperFormula instance outside of the function scope
const hyperformulaInstance = HyperFormula.buildEmpty({
  licenseKey: "gpl-v3",
});

const getInitialConfig = (data: any[][]) => {
  return {
    data,
    rowHeaders: true,
    colHeaders: true,
    width: "100%",
    height: "100%",
    licenseKey: "non-commercial-and-evaluation",
    formulas: {
      engine: hyperformulaInstance,
    },
    minRows: 50,
    minCols: 26,
    autoColumnSize: true,
    autoRowSize: true,
    manualColumnResize: true,
    manualRowResize: true,
    manualRowMove: true,
    colWidths: 150,
    contextMenu: true,
    comments: true,
    fillHandle: true,
    persistentState: true,
    headerTooltips: true,
    mergeCells: true,
    columnSorting: true,
    search: true,
    selectionMode: "multiple",
    cells(row: number, col: number) {
      const cellProperties: any = {};
      return cellProperties;
    },
    observeDomVisibility: true,
    observeChanges: true,
  };
};

const calculateCellValue = (
  formula: string,
  cellRef: string,
  cellValues: Map<string, any>,
) => {
  try {
    if (formula.startsWith("=")) {
      const cellAddress = XLSX.utils.decode_cell(cellRef);

      // Retrieve the cell value from the map if exists
      const existingValue = cellValues.get(cellRef);
      if (existingValue) {
        // set up data in hyperformula if the value is already provided, rather than attempting to perform an evaluation
        hyperformulaInstance.setCellContents({
          col: cellAddress.c,
          row: cellAddress.r,
          sheet: 0
        }, existingValue);
      }

      // // Parse hyperformula formula
      // const ast = hyperformulaInstance.parseFormula(formula, {
      //   col: cellAddress.c,
      //   row: cellAddress.r,
      //   sheet: 0
      // });

      // if (ast.error) {
      //   console.error("HyperFormula parse error:", ast.error);
      //   return "#ERROR";
      // }

      // Calculate using HyperFormula
      const calculatedValue = hyperformulaInstance.getCellValue({
        col: cellAddress.c,
        row: cellAddress.r,
        sheet: 0
      });
      return calculatedValue;
      // return hyperformulaInstance.getCellValue(cellAddress);
    }
    return formula; // If it's not a formula, just return the string
  } catch (e) {
    console.error("Error calculating value:", e);
    return "#ERROR";
  }
};

export {
  calculateCellValue,
  hyperformulaInstance,
  getInitialConfig,
  cellAddressToString,
};
