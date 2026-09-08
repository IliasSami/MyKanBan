import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  Info,
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
- [ ] User story: Team member permission roles #medium ~3

## Sprint To-Do
- [ ] Set up Cloudflare D1 local database migrations @David #high ~5
- [ ] Build drag-and-drop card preview @Sarah #urgent ~3
  - Include ghost placeholder
  - Test on mobile touch devices
- [ ] Create Collab Code join dialog @Alex #high ~3

## In Progress
- [ ] Ingest structured Markdown files with tag extraction @Alex #urgent ~5
  > Parser supports @assignee, #priority, and ~storypoints.
  - [x] Header parsing logic
  - [x] Checkbox bullet parsing
  - [ ] Live visual preview modal

## Code Review
- [ ] Review PR #42: Realtime WebSocket synchronization @Sarah #urgent ~3

## Done
- [x] Initial React SPA Vite setup @Alex #medium ~2
- [x] Tailwind CSS v4 styling configuration #medium ~1
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
        setActiveTab('paste'); // switch to preview
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Convert Data to Kanban Board
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Scrum Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transform raw Markdown or CSV data into an interactive, organized task board.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Tab Navigation & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Paste Code / Text
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                Upload File (.md, .csv)
              </button>
            </div>

            {/* Quick Sample Fillers */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium text-[11px]">Load Sample:</span>
              <button
                type="button"
                onClick={() => {
                  setFormat('markdown');
                  setTextContent(SAMPLE_MARKDOWN);
                  setActiveTab('paste');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                Scrum Markdown
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setTextContent(SAMPLE_CSV);
                  setActiveTab('paste');
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                CSV Table
              </button>
            </div>
          </div>

          {activeTab === 'upload' ? (
            /* File Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/60'
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
              <div className="p-4 rounded-full bg-slate-800 text-indigo-400 border border-slate-700">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Click to select or drag and drop your file here
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Markdown (.md) or CSV (.csv) files
                </p>
              </div>
              {fileName && (
                <div className="text-xs text-indigo-400 font-mono bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800">
                  Loaded: {fileName}
                </div>
              )}
            </div>
          ) : (
            /* Direct Text Area */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Format:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'markdown'}
                      onChange={() => setFormat('markdown')}
                      className="accent-indigo-500"
                    />
                    <span className="text-slate-300">Markdown (.md)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')}
                      className="accent-indigo-500"
                    />
                    <span className="text-slate-300">CSV Table</span>
                  </label>
                </div>

                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Supports @assignee, #priority, ~points in markdown</span>
                </div>
              </div>

              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={
                  format === 'markdown'
                    ? '## Column Name\n- [ ] Task Title @assignee #urgent ~5'
                    : 'Title,Column,Assignee,Priority,Points'
                }
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Live Ingestion Preview Section */}
          {parseResult && (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Board Preview
                  </span>
                  <span className="text-xs text-indigo-400 font-semibold font-mono">
                    "{parseResult.title}"
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="text-slate-400">
                    Columns: <strong className="text-white">{parseResult.columns.length}</strong>
                  </span>
                  <span className="text-slate-400">
                    Tasks: <strong className="text-white">{totalTasks}</strong>
                  </span>
                  <span className="text-slate-400">
                    Story Points: <strong className="text-cyan-300 font-mono">{totalPoints}</strong>
                  </span>
                </div>
              </div>

              {/* Column Lanes Pill Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
                {parseResult.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 text-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                      <span className="truncate">{col.title}</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-400">
                        {col.tasks.length}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {col.tasks.length > 0
                        ? `${col.tasks[0].title}`
                        : '(Empty column)'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import Mode Options */}
          <div className="flex items-center gap-6 pt-2 text-xs">
            <span className="text-slate-400 font-medium">Import Mode:</span>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="replaceMode"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="accent-indigo-500"
              />
              <span>Replace current board completely</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="radio"
                name="replaceMode"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="accent-indigo-500"
              />
              <span>Append to current board</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || totalTasks === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Generate Kanban Board ({totalTasks} Tasks)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
