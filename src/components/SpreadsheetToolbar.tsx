import { Import, File, BarChart3 } from "lucide-react";

interface SpreadsheetToolbarProps {
  onImport: () => void;
  onExport: () => void;
  onChart: () => void;
}

const SpreadsheetToolbar: React.FC<SpreadsheetToolbarProps> = ({
  onImport,
  onExport,
  onChart,
}) => {
  return (
    <div className="flex items-center bg-gray-100 border-b border-gray-200 p-2">
      <div className="flex items-center space-x-2">
        <button
          onClick={onImport}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Import"
        >
          <Import size={18} />
        </button>
        <button
          onClick={onExport}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Export"
        >
          <File size={18} />
        </button>
        <button
          onClick={onChart}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Chart"
        >
          <BarChart3 size={18} />
        </button>
      </div>
    </div>
  );
};

export default SpreadsheetToolbar;
