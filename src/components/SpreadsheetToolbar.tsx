import { useRef } from "react";
import { Search, Undo2, Redo2, BarChart } from "lucide-react";

interface SpreadsheetToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAddRow?: () => void;
  onAddColumn?: () => void;
  onDeleteRow?: () => void;
  onDeleteColumn?: () => void;
  onMergeCells?: () => void;
  onUnmergeCells?: () => void;
  onSearch?: () => void;
  onSort?: () => void;
  onChart?: () => void;
}

const SpreadsheetToolbar = ({
  onImport,
  onExport,
  onUndo,
  onRedo,
  onSearch,
  onChart,
  // ... other props
}: SpreadsheetToolbarProps) => {
  return (
    <div className="p-4 bg-white border-b">
      <div className="flex flex-wrap gap-4">
        {/* File Operations */}
        <div className="flex items-center gap-1">
          <button
            onClick={onImport}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Import Spreadsheet (Ctrl+O)"
          >
            Import
          </button>
          <button
            onClick={onExport}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Export Spreadsheet (Ctrl+S)"
          >
            Export
          </button>
        </div>

        {/* Edit Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <button
            onClick={onUndo}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-6 h-6 opacity-75" strokeWidth={1.5} />
          </button>
          <button
            onClick={onRedo}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-6 h-6 opacity-75" strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1 border-l pl-4">
          <button
            onClick={onSearch}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Search (Ctrl+F)"
          >
            <Search className="w-6 h-6 opacity-75" strokeWidth={1.5} />
          </button>
        </div>
        {/* Chart */}
        <div className="flex items-center gap-1 border-l pl-4">
          <button
            onClick={onChart}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700"
            title="Toggle Chart"
          >
            <BarChart className="w-6 h-6 opacity-75" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetToolbar;
