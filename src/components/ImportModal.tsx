import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  FileUp,
  Loader2,
  Settings,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { parseMarkdown, parseCSV, parseJSON } from '../utils/parser';
import {
  convertWithAI,
  convertWithLocalHeuristic,
  getStoredAISettings,
  saveAISettings,
  POPULAR_MODELS,
} from '../services/aiConverter';

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

const SAMPLE_JSON = `{
  "title": "Sprint 26: Distributed Architecture",
  "columns": [
    {
      "title": "Sprint Backlog",
      "wipLimit": 10,
      "tasks": [
        {
          "title": "Configure Edge Cache invalidation",
          "description": "Purge Cloudflare Edge cache when Convex mutations complete",
          "priority": "high",
          "storyPoints": 5,
          "assignee": "Alex",
          "tags": ["edge", "cache", "performance"],
          "subtasks": [
            { "title": "Cache tag tagging", "completed": true },
            { "title": "Instant purge webhook", "completed": false }
          ]
        },
        {
          "title": "Zero-trust session cookies audit",
          "priority": "urgent",
          "storyPoints": 3,
          "assignee": "Sarah",
          "tags": ["security", "auth"]
        }
      ]
    },
    {
      "title": "In Progress",
      "wipLimit": 4,
      "tasks": [
        {
          "title": "KBF Workflow schema validation",
          "description": "Dynamic Kanban schema supporting subtasks, WIP constraints and metadata",
          "priority": "urgent",
          "storyPoints": 5,
          "assignee": "Alex",
          "tags": ["kbf", "engine"],
          "subtasks": [
            { "title": "JSON / YAML Parser engine", "completed": true },
            { "title": "Visual preview integration", "completed": true }
          ]
        }
      ]
    },
    {
      "title": "Done",
      "tasks": [
        {
          "title": "WCAG AAA Accessibility Suite",
          "priority": "high",
          "storyPoints": 5,
          "assignee": "Alex",
          "tags": ["a11y", "ui"]
        }
      ]
    }
  ]
}`;

const SAMPLE_CSV = `Title,Column,Assignee,Priority,Story Points,Tags,Description
"Setup Cloudflare Pages CI/CD",Done,Alex,medium,2,"devops,cloudflare","Automate preview deployments on Git push"
"Build Markdown Parser Engine",In Progress,Alex,urgent,5,"feature,parser","Extract headers, checkboxes, and metadata tags"
"Design Collab Code Sharing Modal",Sprint To-Do,Sarah,high,3,"collab,ui","Provide 1-click room code copying"
"Add CSV support via PapaParse",Sprint To-Do,David,high,3,"import,csv","Parse multi-column CSV files into kanban lanes"
"Refine Scrum Velocity Metrics Bar",Backlog,Sarah,medium,3,"scrum,analytics","Track completed story points vs total estimate"
`;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'upload' | 'ai'>('ai');
  const [format, setFormat] = useState<'markdown' | 'json' | 'csv'>('markdown');
  const [textContent, setTextContent] = useState(SAMPLE_MARKDOWN);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  // AI Conversion States
  const [aiInput, setAiInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState(getStoredAISettings);
  const [showAiSettings, setShowAiSettings] = useState(false);

  const handleConvertAI = async () => {
    if (!aiInput.trim()) return;
    setIsConverting(true);
    setAiError(null);
    try {
      const converted = await convertWithAI(aiInput, {
        apiKey: aiSettings.apiKey,
        model: aiSettings.model,
        baseUrl: aiSettings.baseUrl,
      });
      setTextContent(converted);
      setFormat('markdown');
      setActiveTab('paste');
    } catch (err: any) {
      setAiError(err.message || 'AI conversion failed.');
    } finally {
      setIsConverting(false);
    }
  };

  const handleConvertLocalFallback = () => {
    if (!aiInput.trim()) return;
    const converted = convertWithLocalHeuristic(aiInput);
    setTextContent(converted);
    setFormat('markdown');
    setActiveTab('paste');
    setAiError(null);
  };

  // Live Parsing preview
  const parseResult = useMemo(() => {
    const trimmed = textContent.trim();
    if (!trimmed) return null;
    try {
      if (format === 'json' || trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return parseJSON(trimmed);
      } else if (format === 'csv') {
        return parseCSV(trimmed);
      } else {
        return parseMarkdown(trimmed);
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
    const isJson = file.name.endsWith('.json') || file.name.endsWith('.kbf');
    setFormat(isCsv ? 'csv' : isJson ? 'json' : 'markdown');

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div>
            <h2 id="import-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Import Board Data
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                MD / CSV
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Transform Markdown or CSV into a visual Scrum Kanban board.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close import modal"
            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800/80">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs">
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'ai'
                    ? 'btn-3d bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Convert</span>
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'paste'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded font-medium transition flex items-center gap-1.5 ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload</span>
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
                className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Scrum.md
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('json');
                  setTextContent(SAMPLE_JSON);
                  setActiveTab('paste');
                }}
                className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Flow.json
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('csv');
                  setTextContent(SAMPLE_CSV);
                  setActiveTab('paste');
                }}
                className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                Tasks.csv
              </button>
            </div>
          </div>

          {activeTab === 'ai' ? (
            /* AI Conversion View */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs pb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <Wand2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    AI Ingestion Engine (Nara Router)
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded border border-blue-200 dark:border-blue-900/60">
                    {aiSettings.model}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAiInput(
                        `Meeting Notes from Sprint Planning:\n- We urgently need to fix the session token expiry bug on mobile. Assign to Alex, estimated 3 points.\n- Sarah is going to build the dark mode toggle and contrast settings (high priority, 5 points). Steps: audit color tokens, add aria-live announcer, test with VoiceOver.\n- Research Redis edge caching for future sprint (2 points).\n- Dave already completed the initial Vite deployment setup.`
                      )
                    }
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Paste Sample Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAiSettings(!showAiSettings)}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
                    title="Configure AI Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Settings Drawer */}
              {showAiSettings && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                    <span>AI Model & Key Settings</span>
                    <button
                      onClick={() => setShowAiSettings(false)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">Model</label>
                      <select
                        value={aiSettings.model}
                        onChange={(e) => {
                          const updated = { ...aiSettings, model: e.target.value };
                          setAiSettings(updated);
                          saveAISettings(updated);
                        }}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs"
                      >
                        {POPULAR_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-500 mb-1">API Key</label>
                      <input
                        type="password"
                        value={aiSettings.apiKey}
                        onChange={(e) => {
                          const updated = { ...aiSettings, apiKey: e.target.value };
                          setAiSettings(updated);
                          saveAISettings(updated);
                        }}
                        placeholder="sk-..."
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Notes Input */}
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                placeholder="Paste any messy notes, sprint minutes, Jira tasks, or product specifications here... Our integrated AI will clean, structure, and convert it into a visual Kanban board."
                rows={7}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-y leading-relaxed"
              />

              {/* Error Notice & Fallback */}
              {aiError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs space-y-2">
                  <div className="flex items-start gap-2 text-red-700 dark:text-red-300 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleConvertLocalFallback}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-xs transition"
                    >
                      ⚡ Convert with Smart Local Parser (Instant & Free)
                    </button>
                  </div>
                </div>
              )}

              {/* Conversion Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleConvertAI}
                  disabled={isConverting || !aiInput.trim()}
                  className="btn-3d flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Converting with {aiSettings.model}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>1-Click AI Convert</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleConvertLocalFallback}
                  disabled={!aiInput.trim()}
                  className="px-4 py-2.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 text-zinc-800 dark:text-zinc-200 font-medium text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 transition"
                  title="Instant offline rule-based parser"
                >
                  Offline Parser
                </button>
              </div>
            </div>
          ) : activeTab === 'upload' ? (
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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/5'
                  : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60'
              }`}
              onClick={() => document.getElementById('file-upload-input')?.click()}
            >
              <input
                id="file-upload-input"
                type="file"
                accept=".md,.markdown,.csv,.txt,.json,.kbf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  Select or drag a file here
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Markdown (.md), JSON / KBF (.json), or CSV (.csv)
                </p>
              </div>
              {fileName && (
                <div className="text-xs text-zinc-700 dark:text-zinc-300 font-mono bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
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
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'markdown'}
                      onChange={() => setFormat('markdown')}
                      className="accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                    <span>Markdown</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'json'}
                      onChange={() => setFormat('json')}
                      className="accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
                    />
                    <span>JSON (KBF)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                    <input
                      type="radio"
                      name="format"
                      checked={format === 'csv'}
                      onChange={() => setFormat('csv')}
                      className="accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
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
                placeholder="Paste Markdown, JSON / KBF, or CSV..."
                rows={9}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600 transition resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Clean Ingestion Preview */}
          {parseResult && (
            <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {parseResult.title}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  <span>Columns: <strong className="text-zinc-900 dark:text-zinc-200">{parseResult.columns.length}</strong></span>
                  <span>Tasks: <strong className="text-zinc-900 dark:text-zinc-200">{totalTasks}</strong></span>
                  <span>Points: <strong className="text-zinc-900 dark:text-zinc-200">{totalPoints} sp</strong></span>
                </div>
              </div>

              {/* Column Lanes Preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {parseResult.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded p-2 text-xs"
                  >
                    <div className="flex items-center justify-between font-medium text-zinc-800 dark:text-zinc-300">
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
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="replaceMode"
                checked={replaceExisting}
                onChange={() => setReplaceExisting(true)}
                className="accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <span>Replace current board</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
              <input
                type="radio"
                name="replaceMode"
                checked={!replaceExisting}
                onChange={() => setReplaceExisting(false)}
                className="accent-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600"
              />
              <span>Append tasks</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 rounded focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={!parseResult || totalTasks === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Import ({totalTasks} Tasks)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

