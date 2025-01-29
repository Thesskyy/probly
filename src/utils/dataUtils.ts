export function convertToCSV(data: any[][]): string {
  if (!Array.isArray(data) || !data.length) {
    return "";
  }

  try {
    // Clean and validate data
    const cleanData = data.map((row) =>
      row.map((cell) => {
        // Handle null, undefined, and special characters
        if (cell == null) return "";
        // Escape commas and quotes in cell values
        const cellStr = String(cell).replace(/"/g, '""');
        return cellStr.includes(",") ? `"${cellStr}"` : cellStr;
      }),
    );

    const headers = cleanData[0];
    const rows = cleanData.slice(1);

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  } catch (error) {
    console.error("Error converting data to CSV:", error);
    throw new Error("Failed to convert spreadsheet data to CSV format");
  }
}
