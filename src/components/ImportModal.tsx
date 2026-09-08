import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Wand2,
  FileUp,
  Zap,
  Check,
  FileCode,
  Table,
} from 'lucide-react';
import {
  inspectDocument,
  type DocumentType,
} from '../utils/documentInspector';
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
  - [x] Header parsing logic
  - [x] Checkbox bullet parsing
  - [ ] Live visual preview modal

## Code Review
- [ ] Review PR #42: Realtime WebSocket synchronization @Sarah #urgent ~3

## Done
- [x] React SPA Vite setup @Alex #medium ~2
- [x] Minimal two-color design system configuration #medium ~1
`;

const SAMPLE_NOTES = `Sprint Planning & Architecture Notes:
We met on Monday to outline our upcoming sprint goals.
Alex needs to fix the session token expiry bug on mobile as soon as possible (urgent priority, ~3 story points).
Sarah will work on designing the dark mode toggle and WCAG accessibility contrast settings (high priority, ~5 points). Subtasks include auditing color tokens, adding an aria-live announcer, and testing with VoiceOver.
Dave is assigned to research Redis edge caching for future sprint velocity (estimated 2 points).
We already finished setting up the Vite build and Cloudflare Pages deployment pipeline last week.`;

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
          "priority": "urgent",
          "storyPoints": 5,
          "assignee": "Alex",
          "tags": ["kbf", "engine"]
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
  // Step 1: Document Type & Content State
  const [docType, setDocType] = useState<DocumentType>('markdown');
  const [inputMode, setInputMode] = useState<'upload' | 'editor'>('upload');
  const [content, setContent] = useState<string>(SAMPLE_MARKDOWN);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Conversion & AI States
  const [isConverting, setIsConverting] = useState(false);
  const [conversionPhase, setConversionPhase] = useState<string>('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState(getStoredAISettings);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [convertedSuccess, setConvertedSuccess] = useState(false);

  // Import options
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Reset conversion state when content changes significantly
  useEffect(() => {
    setConvertedSuccess(false);
    setAiError(null);
  }, [docType]);

  // Systematically Inspect Document Parsability in Real-Time
  const inspection = useMemo(() => {
    return inspectDocument(content, docType);
  }, [content, docType]);

  if (!isOpen) return null;

  // File Upload Handlers
  const handleProcessFile = (file: File) => {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);

    // Detect format from extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      setDocType('csv');
    } else if (ext === 'json' || ext === 'kbf') {
      setDocType('json');
    } else if (ext === 'md' || ext === 'markdown') {
      setDocType('markdown');
    } else {
      // .txt or unknown -> default to notes or markdown
      setDocType('markdown');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        setContent(text);
        setConvertedSuccess(false);
        setAiError(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Convert via Nara Router AI
  const handleRunAIConvert = async () => {
    if (!content.trim()) return;
    setIsConverting(true);
    setAiError(null);
    setConversionPhase(`Connecting to Nara Router (${aiSettings.model})...`);

    try {
      setConversionPhase('Structuring columns, extracting tasks & assigning tags...');
      const structuredResult = await convertWithAI(content, {
        apiKey: aiSettings.apiKey,
        model: aiSettings.model,
        baseUrl: aiSettings.baseUrl,
      });

      setContent(structuredResult);
      setDocType('markdown');
      setInputMode('editor');
      setConvertedSuccess(true);
      setConversionPhase('');
    } catch (err: any) {
      setAiError(err.message || 'AI conversion request failed.');
      setConversionPhase('');
    } finally {
      setIsConverting(false);
    }
  };

  // Convert via Smart Local Heuristic (Offline & Zero Cost)
  const handleRunLocalHeuristic = () => {
    if (!content.trim()) return;
    setIsConverting(true);
    setAiError(null);
    try {
      const structuredResult = convertWithLocalHeuristic(content);
      setContent(structuredResult);
      setDocType('markdown');
      setInputMode('editor');
      setConvertedSuccess(true);
    } catch (err: any) {
      setAiError(err.message || 'Local conversion failed.');
    } finally {
      setIsConverting(false);
    }
  };

  // Execute Final Board Import
  const handleExecuteImport = () => {
    if (!inspection.parseResult || inspection.tasksCount === 0) return;
    onImport(inspection.parseResult, replaceExisting);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Document Ingestion & AI Conversion
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                  Nara Engine
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Systematic inspection, automated AI transformation, and instant board loading.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAiSettings(!showAiSettings)}
              aria-label="AI Settings"
              className={`p-1.5 rounded-lg border transition ${
                showAiSettings
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-600'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900'
              }`}
              title="Configure Nara Router AI"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Settings Drawer */}
        {showAiSettings && (
          <div className="px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-xs space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Nara Router Configuration
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                https://router.bynara.id/v1
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Active Model
                </label>
                <select
                  value={aiSettings.model}
                  onChange={(e) => {
                    const updated = { ...aiSettings, model: e.target.value };
                    setAiSettings(updated);
                    saveAISettings(updated);
                  }}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                >
                  {POPULAR_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) => {
                    const updated = { ...aiSettings, apiKey: e.target.value };
                    setAiSettings(updated);
                    saveAISettings(updated);
                  }}
                  placeholder="sk-nry-..."
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: Document Type & Input Source */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono flex items-center justify-center">
                  1
                </span>
                Document Type
              </label>

              {/* Sample Presets */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="hidden sm:inline">Try Sample:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('markdown');
                    setContent(SAMPLE_MARKDOWN);
                    setInputMode('editor');
                    setFileName('Sprint25.md');
                    setFileSize('1.2 KB');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition font-mono text-[10px]"
                >
                  Scrum.md
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('notes');
                    setContent(SAMPLE_NOTES);
                    setInputMode('editor');
                    setFileName('MeetingNotes.txt');
                    setFileSize('0.8 KB');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition font-mono text-[10px]"
                >
                  Notes.txt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('json');
                    setContent(SAMPLE_JSON);
                    setInputMode('editor');
                    setFileName('Sprint26.json');
                    setFileSize('1.5 KB');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition font-mono text-[10px]"
                >
                  KBF.json
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDocType('csv');
                    setContent(SAMPLE_CSV);
                    setInputMode('editor');
                    setFileName('Tasks.csv');
                    setFileSize('0.6 KB');
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition font-mono text-[10px]"
                >
                  Tasks.csv
                </button>
              </div>
            </div>

            {/* Document Type Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setDocType('markdown')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  docType === 'markdown'
                    ? 'btn-3d bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FileText className={`w-4 h-4 shrink-0 mt-0.5 ${docType === 'markdown' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-semibold">Markdown (.md)</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Task list with stages</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocType('notes')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  docType === 'notes'
                    ? 'btn-3d bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Sparkles className={`w-4 h-4 shrink-0 mt-0.5 ${docType === 'notes' ? 'text-amber-500' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-semibold">Notes / PRD</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Unstructured text</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocType('json')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  docType === 'json'
                    ? 'btn-3d bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${docType === 'json' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-semibold">JSON / KBF</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Native schema</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDocType('csv')}
                className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  docType === 'csv'
                    ? 'btn-3d bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 dark:border-blue-600 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500/20'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <Table className={`w-4 h-4 shrink-0 mt-0.5 ${docType === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                <div>
                  <div className="text-xs font-semibold">CSV Spreadsheet</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Table exports</div>
                </div>
              </button>
            </div>
          </div>

          {/* Input Method Switcher: Upload File vs Paste Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    inputMode === 'upload'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('editor')}
                  className={`px-3 py-1 rounded-md font-medium transition flex items-center gap-1.5 ${
                    inputMode === 'editor'
                      ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Edit / Paste Text</span>
                </button>
              </div>

              {fileName && (
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <span className="bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 truncate max-w-[200px]">
                    {fileName} {fileSize ? `(${fileSize})` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      setFileSize(null);
                      setContent('');
                    }}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    title="Clear file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Ingestion View */}
            {inputMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById('document-upload-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition flex flex-col items-center justify-center gap-2.5 cursor-pointer ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10'
                    : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/60'
                }`}
              >
                <input
                  id="document-upload-input"
                  type="file"
                  accept=".md,.markdown,.txt,.json,.kbf,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
                  }}
                />
                <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 border border-zinc-200 dark:border-zinc-800 shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Click to browse or drop your {docType === 'markdown' ? 'Markdown (.md)' : docType === 'notes' ? 'Notes / PRD' : docType === 'json' ? 'JSON (.json)' : 'CSV (.csv)'} file here
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Supports .md, .markdown, .txt, .json, .kbf, .csv
                  </p>
                </div>
                {fileName ? (
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Loaded: {fileName}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInputMode('editor');
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline pt-1"
                  >
                    Or paste text directly in editor
                  </button>
                )}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or write your document here..."
                rows={8}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition resize-y leading-relaxed"
              />
            )}
          </div>

          {/* STEP 2: Systematic Parsability & Diagnosis Engine */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono flex items-center justify-center">
                2
              </span>
              Structure & Parsability Diagnosis
            </div>

            {/* Case A: Empty */}
            {inspection.diagnosis.status === 'empty' && (
              <div className="p-3.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs text-zinc-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-zinc-400" />
                <span>Upload a document or enter text above to run parsability analysis.</span>
              </div>
            )}

            {/* Case B: Ready & Natively Parsable */}
            {inspection.isParsable && inspection.diagnosis.status === 'ready' && (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-emerald-950/30 text-xs space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                        {convertedSuccess ? '✨ AI Conversion Successful & Verified' : inspection.diagnosis.title}
                      </div>
                      <p className="text-emerald-800 dark:text-emerald-300 mt-0.5">
                        {inspection.diagnosis.message}
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 shrink-0">
                    PARSABLE
                  </span>
                </div>

                {/* Column Breakdown Badges */}
                {inspection.parseResult && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-emerald-200 dark:border-emerald-900/50">
                    {inspection.parseResult.columns.map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/70 text-zinc-800 dark:text-zinc-200 text-[11px]"
                      >
                        <span className="font-medium">{col.title}</span>
                        <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
                          {col.tasks.length}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Case C: Not Parsable -> Prompt to use Internal AI */}
            {!inspection.isParsable && inspection.diagnosis.status !== 'empty' && (
              <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 text-xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-amber-950 dark:text-amber-200">
                        {inspection.diagnosis.title}
                      </div>
                      <p className="text-amber-850 dark:text-amber-300 mt-0.5">
                        {inspection.diagnosis.message}
                      </p>
                      {inspection.diagnosis.details && (
                        <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-400 mt-1.5 space-y-0.5">
                          {inspection.diagnosis.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-300 shrink-0">
                    REQUIRES AI
                  </span>
                </div>

                {/* AI Error Alert if occurred */}
                {aiError && (
                  <div className="p-2.5 rounded-lg bg-red-100/80 dark:bg-red-950/60 border border-red-300 dark:border-red-900 text-red-800 dark:text-red-300 text-[11px]">
                    <div className="font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>AI Request Notice: {aiError}</span>
                    </div>
                    <div className="text-[10px] text-red-700 dark:text-red-400 mt-0.5">
                      Tip: You can use the instant offline smart parser below, or configure a custom API key.
                    </div>
                  </div>
                )}

                {/* Action Prompt to use Internal AI */}
                <div className="pt-2 border-t border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Use Internal AI to convert to Kanban?</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunAIConvert}
                      disabled={isConverting}
                      className="btn-3d flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isConverting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Converting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Convert with Nara AI</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleRunLocalHeuristic}
                      disabled={isConverting}
                      className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs rounded-xl font-medium border border-zinc-200 dark:border-zinc-700 transition"
                      title="Instant rule-based offline conversion"
                    >
                      <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                      Offline Parser
                    </button>
                  </div>
                </div>

                {isConverting && conversionPhase && (
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1.5 italic animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    {conversionPhase}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: Preview & Target Configuration */}
          {inspection.isParsable && inspection.parseResult && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono flex items-center justify-center">
                    3
                  </span>
                  Kanban Board Preview
                </div>

                <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 flex items-center gap-3">
                  <span>Columns: <strong>{inspection.columnsCount}</strong></span>
                  <span>Tasks: <strong>{inspection.tasksCount}</strong></span>
                  <span>Points: <strong>{inspection.pointsCount} sp</strong></span>
                </div>
              </div>

              {/* Mini Column Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {inspection.parseResult.columns.map((col, idx) => (
                  <div
                    key={idx}
                    className="card-3d bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="truncate">{col.title}</span>
                      <span className="font-mono text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-zinc-600 dark:text-zinc-400">
                        {col.tasks.length}
                      </span>
                    </div>
                    {col.tasks[0] && (
                      <div className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                        • {col.tasks[0].title}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Import Target Mode */}
              <div className="flex items-center gap-4 text-xs pt-1.5">
                <span className="text-zinc-500 font-medium">Destination:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="radio"
                    name="importMode"
                    checked={replaceExisting}
                    onChange={() => setReplaceExisting(true)}
                    className="accent-blue-600 focus:ring-blue-500"
                  />
                  <span>Replace active board</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!replaceExisting}
                    onChange={() => setReplaceExisting(false)}
                    className="accent-blue-600 focus:ring-blue-500"
                  />
                  <span>Append to existing board</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-xl transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!inspection.isParsable && inspection.diagnosis.status !== 'empty' && (
              <button
                type="button"
                onClick={handleRunAIConvert}
                disabled={isConverting}
                className="btn-3d flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Run AI Conversion</span>
              </button>
            )}

            {inspection.isParsable && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={inspection.tasksCount === 0}
                className="btn-3d flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition disabled:opacity-50 shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Import {inspection.tasksCount} Tasks into Board</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
