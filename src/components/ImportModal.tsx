import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  FileUp,
} from 'lucide-react';
import { parseMarkdown, parseCSV } from '../utils/parser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    data: { title?: string; columns: { title: string; tasks: any[] }[] },
    replace: boolean
  ) => void;
}

const SAMPLE_MARKDOWN = `# Sprint 25: AI Workflow Engine

## Backlog
- [ ] Research WebAssembly parsing pipelines @Alex #high ~5
- [ ] Investigate Redis cache for Edge Workers #low ~2
- [ ] Team member permission roles architecture #medium ~3

## Sprint To-Do
- [ ] Configure Cloudflare D1 local database migrations @David #high ~5
- [ ] Build drag-and-drop card preview @Sarah #urgent ~3
  - Include ghost placeholder
  - Test on mobile touch devices
- [ ] Implement Collab Code join dialog @Alex #high ~3

## In Progress
- [ ] Ingest structured Markdown files with tag extraction @Alex #urgent ~5
  > Parser automatically strips markdown special characters and extracts metadata.
  - [x] Header parsing logic
  - [x] Checkbox bullet parsing
  - [ ] Live visual preview modal

## Code Review
- [ ] Review PR #42: Realtime WebSocket synchronization @Sarah #urgent ~3

## Done
- [x] React SPA Vite setup @Alex #medium ~2
- [x] Minimal two-color design system configuration #medium ~1
`;

const SAMPLE_CSV = `Title,Column,Assignee,Priority,Story Points,Tags,Description
"Setup Cloudflare Pages CI/CD",Done,Alex,medium,2,"devops,cloudflare","Automate preview deployments on Git push"
"Build Markdown Parser Engine",In Progress,Alex,urgent,5,"feature,parser","Extract headers, checkboxes, and metadata tags"
"Design Collab Code Sharing Modal",Sprint To-Do,Sarah,high,3,"collab,ui","Provide 1-click room code copying"
"Add CSV support via PapaParse",Sprint To-Do,David,high,3,"import,csv","Parse multi-column CSV files into kanban lanes"
"Refine Scrum Velocity Metrics Bar",Backlog,Sarah,medium,3,"scrum,analytics","Track completed story points vs total estimate"
`;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [format, setFormat] = useState<'markdown' | 'csv'>('markdown');
  const [textContent, setTextContent] = useState(SAMPLE_MARKDOWN);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // Live Parsing preview
  const parseResult = useMemo(() => {
    if (!textContent.trim()) return null;
    try {
      if (format === 'markdown') {
        return parseMarkdown(textContent);
      } else {
        return parseCSV(textContent);
      }
    } catch {
      return null;
    }
  }, [textContent, format]);

  const totalTasks = useMemo(() => {
    if (!parseResult) return 0;
    return parseResult.columns.reduce((sum, col) => sum + col.tasks.length, 0);
  }, [parseResult]);

  const totalPoints = useMemo(() => {
    if (!parseResult) return 0;
    return parseResult.columns.reduce(
      (sum, col) => sum + col.tasks.reduce((pSum, t) => pSum + (t.storyPoints || 0), 0),
      0
    );
  }, [parseResult]);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setFileName(file.name);
    const isCsv = file.name.endsWith('.csv');
    setFormat(isCsv ? 'csv' : 'markdown');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setTextContent(content);
        setActiveTab('paste');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult || parseResult.columns.length === 0) return;
    onImport(parseResult, replaceExisting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              Import Board Data
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                MD / CSV
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Transform Markdown or CSV into a visual Scrum Kanban board.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-900 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Text Editor
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 text-[11px]">Sample:</span>
              <button
                type="button"
                onClick={() => {
                  setFormat('markdown');
                  setTextContent(SAMPLE_MARKDOWN);
                  setActiveTab('paste');
                }}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition"
              >
                Scrum.md
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setTextContent(SAMPLE_CSV);
                  setActiveTab('paste');
                }}
                className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition"
              >
                Tasks.csv
              </button>
            </div>
          </div>

          {activeTab === 'upload' ? (
            /* Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border border-dashed rounded-xl p-10 text-center transition flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                dragOver
                  ? 'border-blue-500 bg-blue-500/5'
                  : 'border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/60'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".md,.markdown,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
              <div className="p-3 rounded-lg bg-zinc-900 text-zinc-400 border border-zinc-800">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-200">
                  Select or drag a file here
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Markdown (.md) or CSV (.csv)
                </p>
              </div>
              {fileName && (
                <div className="text-xs text-zinc-300 font-mono bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-800">
                  {fileName}
                </div>
              )}
            </div>
          ) : (
            /* Text Area */
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">Format:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'markdown'}
                      onChange={() => setFormat('markdown')}
                      className="accent-blue-600"
                    />
                    <span>Markdown</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')}
                      className="accent-blue-600"
                    />
                    <span>CSV</span>
                  </label>
                </div>

                <span className="text-zinc-500 text-[11px] font-mono">
                  Supports @assignee, #priority, ~sp
                </span>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste Markdown or CSV..."
                rows={9}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Clean Ingestion Preview */}
          {parseResult && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-zinc-200">
                    {parseResult.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
                  <span>Columns: <strong className="text-zinc-200">{parseResult.columns.length}</strong></span>
                  <span>Tasks: <strong className="text-zinc-200">{totalTasks}</strong></span>
                  <span>Points: <strong className="text-zinc-200">{totalPoints} sp</strong></span>
                </div>
              </div>

              {/* Column Lanes Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {parseResult.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950 border border-zinc-800 rounded p-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium text-zinc-300">
                      <span className="truncate">{col.title}</span>
                      <span className="font-mono text-[10px] text-zinc-500">
                        {col.tasks.length}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Mode */}
          <div className="flex items-center gap-4 text-xs pt-1">
            <span className="text-zinc-500">Mode:</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="radio"
                name="replaceMode"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="accent-blue-600"
              />
              <span>Replace current board</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
              <input
                type="radio"
                name="replaceMode"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="accent-blue-600"
              />
              <span>Append tasks</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || totalTasks === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Import ({totalTasks} Tasks)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
