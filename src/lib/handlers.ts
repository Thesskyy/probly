import Handsontable from "handsontable";

interface SearchResult {
  row: number;
  col: number;
  value: string;
}

export const textFormattingHandlers = {
  handleBold: (hot: Handsontable | null) => {
    if (hot) {
      const selected = hot.getSelectedRange();
      if (selected) {
        selected.forEach((range: any) => {
          const startRow = range.from.row;
          const startCol = range.from.col;
          const endRow = range.to.row;
          const endCol = range.to.col;

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const currentCell = hot.getCellMeta(row, col);
              const currentClassName = currentCell.className || "";
              if (currentClassName.includes("bold")) {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  currentClassName.replace("bold", ""),
                );
              } else {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  `${currentClassName} bold`,
                );
              }
            }
          }
        });
        hot.render();
      }
    }
  },

  handleItalic: (hot: Handsontable | null) => {
    if (hot) {
      const selected = hot.getSelectedRange();
      if (selected) {
        selected.forEach((range: any) => {
          const startRow = range.from.row;
          const startCol = range.from.col;
          const endRow = range.to.row;
          const endCol = range.to.col;

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const currentCell = hot.getCellMeta(row, col);
              const currentClassName = currentCell.className || "";
              if (currentClassName.includes("italic")) {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  currentClassName.replace("italic", ""),
                );
              } else {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  `${currentClassName} italic`,
                );
              }
            }
          }
        });
        hot.render();
      }
    }
  },

  handleUnderline: (hot: Handsontable | null) => {
    if (hot) {
      const selected = hot.getSelectedRange();
      if (selected) {
        selected.forEach((range: any) => {
          const startRow = range.from.row;
          const startCol = range.from.col;
          const endRow = range.to.row;
          const endCol = range.to.col;

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              const currentCell = hot.getCellMeta(row, col);
              const currentClassName = currentCell.className || "";
              if (currentClassName.includes("underline")) {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  currentClassName.replace("underline", ""),
                );
              } else {
                hot.setCellMeta(
                  row,
                  col,
                  "className",
                  `${currentClassName} underline`,
                );
              }
            }
          }
        });
        hot.render();
      }
    }
  },

  handleAlignment: (
    hot: Handsontable | null,
    alignment: "htLeft" | "htCenter" | "htRight",
  ) => {
    if (hot) {
      const selected = hot.getSelectedRange();
      if (selected) {
        selected.forEach((range: any) => {
          const startRow = range.from.row;
          const startCol = range.from.col;
          const endRow = range.to.row;
          const endCol = range.to.col;

          for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
              hot.setCellMeta(row, col, "className", alignment);
            }
          }
        });
        hot.render();
      }
    }
  },
};

export const editHandlers = {
  handleUndo: (hot: Handsontable | null) => {
    hot?.undo();
  },

  handleRedo: (hot: Handsontable | null) => {
    hot?.redo();
  },

  handleCut: () => {
    document.execCommand("cut");
  },

  handleCopy: () => {
    document.execCommand("copy");
  },

  handlePaste: () => {
    document.execCommand("paste");
  },
};

export const tableHandlers = {
  handleAddRow: (hot: Handsontable | null) => {
    hot?.alter("insert_row");
  },

  handleAddColumn: (hot: Handsontable | null) => {
    hot?.alter("insert_col");
  },

  handleDeleteRow: (hot: Handsontable | null) => {
    hot?.alter("remove_row");
  },

  handleDeleteColumn: (hot: Handsontable | null) => {
    hot?.alter("remove_col");
  },
};

export const cellHandlers = {
  handleMergeCells: (hot: Handsontable | null) => {
    hot?.getPlugin("mergeCells").mergeCellsAtSelection();
    hot?.render();
  },

  handleUnmergeCells: (hot: Handsontable | null) => {
    hot?.getPlugin("mergeCells").unmergeAtSelection();
    hot?.render();
  },
};

export const dataHandlers = {
  handleSort: (hot: Handsontable | null) => {
    const selected = hot?.getSelectedRange();
    if (selected) {
      const column = selected[0].from.col;
      hot?.getPlugin("columnSorting").sort({ column, sortOrder: "asc" });
    }
  },

  handleSearch: (hot: Handsontable | null, query: string): SearchResult[] => {
    if (!hot || !query) return [];

    const results: SearchResult[] = [];
    const data = hot.getData();

    // Search through all cells
    data.forEach((row: any, rowIndex: any) => {
      row.forEach((cellValue: any, colIndex: any) => {
        if (
          cellValue &&
          cellValue.toString().toLowerCase().includes(query.toLowerCase())
        ) {
          results.push({
            row: rowIndex,
            col: colIndex,
            value: cellValue.toString(),
          });
        }
      });
    });

    return results;
  },

  highlightSearchResult: (hot: Handsontable | null, result: SearchResult) => {
    if (!hot) return;

    // Clear previous search highlighting
    hot.getSelectedRange()?.forEach((range: any) => {
      const startRow = range.from.row;
      const startCol = range.from.col;
      const endRow = range.to.row;
      const endCol = range.to.col;

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const meta = hot.getCellMeta(row, col);
          if (meta.className?.includes("search-highlight")) {
            hot.setCellMeta(
              row,
              col,
              "className",
              meta.className.replace("search-highlight", "").trim(),
            );
          }
        }
      }
    });

    // Highlight new result
    hot.selectCell(result.row, result.col);
    const meta = hot.getCellMeta(result.row, result.col);
    hot.setCellMeta(
      result.row,
      result.col,
      "className",
      `${meta.className || ""} search-highlight`.trim(),
    );

    // Scroll to the cell
    hot.scrollViewportTo(result.row, result.col);
    hot.render();
  },
};
