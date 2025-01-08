import * as XLSX from "xlsx";

interface ImportResult {
  data: any[][];
  styles: {
    bold: boolean[][];
    alignment: string[][];
  };
  mergedCells?: {
    row: number;
    col: number;
    rowspan: number;
    colspan: number;
  }[];
}

export async function importSpreadsheet(file: File): Promise<ImportResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    if (!worksheet) {
      return { data: [[]], styles: { bold: [[]], alignment: [[]] } }; // return empty sheet for empty workbook
    }

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

    // Use data dimensions to initialize style matrices
    const numRows = data.length;
    const numCols = data.reduce(
      (max, row) => Math.max(max, row?.length || 0),
      0,
    );

    const bold: boolean[][] = Array.from({ length: numRows }, () =>
      Array(numCols).fill(false),
    );
    const alignment: string[][] = Array.from({ length: numRows }, () =>
      Array(numCols).fill("left"),
    );

    // Extract basic styles
    for (const cellRef in worksheet) {
      if (cellRef[0] === "!") continue;
      try {
        const cell = worksheet[cellRef];
        const { r, c } = XLSX.utils.decode_cell(cellRef);

        if (cell.s) {
          // If cell has styles
          if (cell.s.font?.bold) {
            bold[r][c] = true;
          }
          if (cell.s.alignment?.horizontal) {
            alignment[r][c] = cell.s.alignment.horizontal;
          }
        }
      } catch (error) {
        console.error(`Error processing cell ${cellRef}:`, error);
        continue; // Skip cell on error, and process the rest
      }
    }

    // Get merged cells
    const mergedCells = worksheet["!merges"]?.map((range) => ({
      row: range.s.r,
      col: range.s.c,
      rowspan: range.e.r - range.s.r + 1,
      colspan: range.e.c - range.s.c + 1,
    }));

    return { data, styles: { bold, alignment }, mergedCells };
  } catch (error) {
    console.error("Error during import:", error);
    return { data: [[]], styles: { bold: [[]], alignment: [[]] } };
    // You might want to handle this error more gracefully (e.g., show a message)
  }
}
