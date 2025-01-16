import * as XLSX from "xlsx";

export const fileExport = async (data: any[][]) => {
  try {
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "spreadsheet_export.xlsx");
  } catch (error) {
    console.error("Error exporting file:", error);
    alert("Error exporting file. Please try again.");
  }
};
