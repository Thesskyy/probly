import { HyperFormula } from "hyperformula";
import { GridSettings } from "handsontable/settings";

export const getInitialConfig = (data: any[][]): GridSettings => {
  const hyperformulaInstance = HyperFormula.buildEmpty({
    licenseKey: "gpl-v3",
  });

  return {
    data,
    rowHeaders: true,
    colHeaders: true,
    width: "100%",
    height: "70vh",
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
  };
};
