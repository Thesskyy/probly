import * as XLSX from "xlsx";

export const excelCellToRowCol = (
  cellId: string,
): { row: number; col: number } => {
  const match = cellId.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    throw new Error("Invalid cell identifier format.");
  }
  const [, colLetters, rowNumber] = match;

  let col = 0;
  for (let i = 0; i < colLetters.length; i++) {
    col = col * 26 + (colLetters.charCodeAt(i) - "A".charCodeAt(0) + 1);
  }
  col -= 1;

  const row = parseInt(rowNumber, 10) - 1;
  return { row, col };
};

export const readFileData = (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
