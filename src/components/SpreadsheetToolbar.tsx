import { useRef } from "react";
import {
  Upload,
  Download,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  Merge,
  Split,
  ZoomIn,
  ZoomOut,
  Search,
  Filter,
  ArrowUpDown,
} from "lucide-react";

interface SpreadsheetToolbarProps {
  onImport: (file: File) => void;
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
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onSearch?: () => void;
  onFilter?: () => void;
  onSort?: () => void;
}

const SpreadsheetToolbar = ({
  onImport,
  onExport,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onBold,
  onItalic,
  onUnderline,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAddRow,
  onAddColumn,
  onDeleteRow,
  onDeleteColumn,
  onMergeCells,
  onUnmergeCells,
  onZoomIn,
  onZoomOut,
  onSearch,
  onFilter,
  onSort,
}: SpreadsheetToolbarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const ToolbarButton = ({ icon: Icon, onClick, title, className = "" }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-700 ${className}`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  const IconButton = ({
    onClick,
    icon: Icon,
    title,
    disabled = false,
  }: {
    onClick?: () => void;
    icon: React.ElementType;
    title: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      title={title}
      disabled={disabled}
    >
      <Icon className="w-5 h-5 text-gray-700" />
    </button>
  );

  return (
    <div className="p-4 bg-white border-b">
      <div className="flex flex-wrap gap-4">
        {/* File Operations */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={onExport}
            className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Edit Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton icon={Undo2} onClick={onUndo} title="Undo" />
          <ToolbarButton icon={Redo2} onClick={onRedo} title="Redo" />
        </div>

        {/* Clipboard Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton icon={Scissors} onClick={onCut} title="Cut" />
          <ToolbarButton icon={Copy} onClick={onCopy} title="Copy" />
          <ToolbarButton icon={Clipboard} onClick={onPaste} title="Paste" />
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton icon={Bold} onClick={onBold} title="Bold" />
          <ToolbarButton icon={Italic} onClick={onItalic} title="Italic" />
          <ToolbarButton
            icon={Underline}
            onClick={onUnderline}
            title="Underline"
          />
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton
            icon={AlignLeft}
            onClick={onAlignLeft}
            title="Align Left"
          />
          <ToolbarButton
            icon={AlignCenter}
            onClick={onAlignCenter}
            title="Center"
          />
          <ToolbarButton
            icon={AlignRight}
            onClick={onAlignRight}
            title="Align Right"
          />
        </div>

        {/* Table Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton icon={Plus} onClick={onAddRow} title="Add Row" />
          <ToolbarButton
            icon={Plus}
            onClick={onAddColumn}
            title="Add Column"
            className="rotate-90"
          />
          <ToolbarButton
            icon={Trash2}
            onClick={onDeleteRow}
            title="Delete Row"
          />
          <ToolbarButton
            icon={Trash2}
            onClick={onDeleteColumn}
            title="Delete Column"
            className="rotate-90"
          />
        </div>

        {/* Cell Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton
            icon={Merge}
            onClick={onMergeCells}
            title="Merge Cells"
          />
          <ToolbarButton
            icon={Split}
            onClick={onUnmergeCells}
            title="Unmerge Cells"
          />
        </div>

        {/* Data Operations */}
        <div className="flex items-center gap-1 border-l pl-4">
          <ToolbarButton icon={Search} onClick={onSearch} title="Search" />
          <ToolbarButton icon={ArrowUpDown} onClick={onSort} title="Sort" />
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetToolbar;
