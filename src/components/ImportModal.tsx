import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import {
  inspectDocument,
  type DocumentType,
} from '../utils/documentInspector';
import {
  LLM_PLATFORMS,
  generateLLMPrompt,
  MASTER_PROMPT_INSTRUCTIONS,
} from '../services/promptGenerator';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (
    data: { title?: string; columns: { title: string; tasks: any[] }[] },
    replace: boolean
  ) => void;
}

const SAMPLE_NATIVE_MARKDOWN = `# OutCraft.ai Technical SEO Remediation — Sprint Workflow

> Crawl: https://www.outcraft.ai/ · Screaming Frog 19.8 · 2026-09-07 · HubSpot CMS behind Cloudflare
> Flow: P0 this week → P1 this month → P2 quarter → P3 opportunistic · Re-audit loop gates "Done"

## Backlog

- [ ] Rewrite Link Anchor Text Sitewide @Content #high ~5 #seo #links #accessibility
  > 236 outlinks have no anchor text; 108 use non-descriptive text ("click here", "learn more").
  - [ ] Audit rich-text content and CTA modules for empty anchors
  - [ ] Replace generic anchors with descriptive link labels
  - [ ] Add aria-labels to icon/CTA links

- [ ] Compress Images Over 100 KB @Content #medium ~5 #images #media #hubspot
  > 1,058 images exceed 100 KB; prefer WebP/AVIF via HubSpot Files hs-fs width params.
  - [ ] Re-export heaviest images to WebP/AVIF
  - [ ] Serve per-width variants from HubSpot Files
  - [ ] Shrink 205 image alt-text issues (90 missing, 73 empty, 42 too long)

- [ ] Add Width and Height to Image Tags @Dev #medium ~3 #images #html #hubspot
  > 170 images missing width/height cause layout shift; fix at the image-module template level.

- [ ] Implement Security Headers Sitewide @DevOps #medium ~5 #security #headers #cloudflare
  > XFO missing on 97.8% of pages; Referrer-Policy missing 92.96%; XCTO 14.2%; CSP 9.3%.
  - [ ] Set X-Frame-Options: SAMEORIGIN at Cloudflare edge or HubSpot
  - [ ] Set X-Content-Type-Options: nosniff
  - [ ] Set Referrer-Policy: strict-origin-when-cross-origin

## Sprint To-Do

- [ ] Write Unique Title Tags @Content #high ~3 #seo #meta #hubspot
  > 57 titles exceed 60 chars; /pricing has raw URL as title; 2 duplicate pairs.
  - [ ] Add a real title to /pricing
  - [ ] Trim the automated " | Outcraft AI" suffix in the blog template

- [ ] Fix 71 Mojibake Image URLs @Content #high ~2 #urls #images #hubspot
  > Non-ASCII characters in file names (e.g. "Screenshot_2026-05-20_at_8.54.44â__PM.png").
  - [ ] Re-upload or rename files with clean ASCII names
  - [ ] Update content references to new URLs

## In Progress

- [ ] Resolve Dead Knowledge Base URLs @Content #urgent ~3 #hubspot #cms #404
  > 18 URLs under /outcraft-ai-knowledge-base/ return 404 but are still listed in sitemap.xml.
  - [ ] Unpublish dead KB posts in CMS
  - [ ] Add 301 redirects to live equivalents

- [ ] Eliminate Legacy Redirect Chains @SEO #urgent ~3 #redirects #links #hubspot
  > /blog/marketing/* URLs 301 in 2 hops; will-ai-replace-sales-jobs chain ends in a 404.
  - [ ] Add direct 301 to target slugs
  - [ ] Link straight to targets to bypass chains entirely

- [ ] Remove Invalid JSON-LD from Global Head @Dev #urgent ~5 #structured-data #jsonld #schema
  > Every one of 101 pages emits Product/SoftwareApplication/Review JSON-LD that fails validation; eligibility 0%.
  - [ ] Locate auto-injected schema block (global head template / module script)
  - [ ] Remove Product + SoftwareApplication + Review JSON-LD
  - [ ] Keep BlogPosting and FAQPage (valid, eligible 100%)

- [ ] Fix Sitewide Logo Link Protocol @Dev #urgent ~1 #security #hubspot #design
  > Global header logo links to http://outcraft.ai/ (202 insecure links; extra 301 hop on every page).
  - [ ] In Design Manager, change logo URL to https://www.outcraft.ai/
  - [ ] Add aria-label "Outcraft AI — homepage" to logo

## Review / QA

- [ ] Optimize Mobile Core Web Vitals (INP) @Dev #high ~8 #performance #analytics
  > Mobile INP 237 ms fails the 200 ms threshold; ~475 KB unused third-party JS.
  - [ ] Defer non-critical tracking scripts
  - [ ] Re-run PageSpeed Insights to verify INP < 200 ms

## Done

- [x] Crawl OutCraft.ai with Screaming Frog 19.8 @SEO #medium ~8 #screaming-frog #audit
  > JS-rendered crawl completed: 2,084 URLs inspected, 0 5xx errors.
`;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  // Modal navigation mode: 'native' | 'wizard'
  const [activeTab, setActiveTab] = useState<'native' | 'wizard'>('native');

  // Direct Native Import states
  const [docType, setDocType] = useState<DocumentType>('markdown');
  const [nativeContent, setNativeContent] = useState<string>(SAMPLE_NATIVE_MARKDOWN);
  const [nativeFileName, setNativeFileName] = useState<string | null>(null);
  const [nativeDragOver, setNativeDragOver] = useState(false);

  // Wizard states
  const [rawDocument, setRawDocument] = useState<string>('');
  const [includeDocInPrompt, setIncludeDocInPrompt] = useState(true);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedInstructions, setCopiedInstructions] = useState(false);
  const [aiOutputMarkdown, setAiOutputMarkdown] = useState<string>('');

  // Import options
  const [replaceExisting, setReplaceExisting] = useState(true);

  // Real-time inspection for Native Tab
  const nativeInspection = useMemo(() => {
    return inspectDocument(nativeContent, docType);
  }, [nativeContent, docType]);

  // Real-time inspection for Wizard Step 3 output
  const wizardInspection = useMemo(() => {
    if (!aiOutputMarkdown.trim()) return null;
    return inspectDocument(aiOutputMarkdown, 'markdown');
  }, [aiOutputMarkdown]);

  // Generated prompt for external LLMs
  const fullGeneratedPrompt = useMemo(() => {
    return includeDocInPrompt ? generateLLMPrompt(rawDocument) : MASTER_PROMPT_INSTRUCTIONS;
  }, [rawDocument, includeDocInPrompt]);

  if (!isOpen) return null;

  // File Upload Handlers for Native Import
  const handleProcessNativeFile = (file: File) => {
    setNativeFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') setDocType('csv');
    else if (ext === 'json' || ext === 'kbf') setDocType('json');
    else setDocType('markdown');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        setNativeContent(text);
        // Also populate rawDocument for the wizard if user switches tabs
        setRawDocument(text);
      }
    };
    reader.readAsText(file);
  };

  // File Upload Handlers for Wizard Step 1
  const handleProcessWizardFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        setRawDocument(text);
      }
    };
    reader.readAsText(file);
  };

  // Copy Handlers
  const handleCopyCompletePrompt = async () => {
    try {
      await navigator.clipboard.writeText(fullGeneratedPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = fullGeneratedPrompt;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    }
  };

  const handleCopyInstructionsOnly = async () => {
    try {
      await navigator.clipboard.writeText(MASTER_PROMPT_INSTRUCTIONS);
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 2500);
    } catch {
      setCopiedInstructions(true);
      setTimeout(() => setCopiedInstructions(false), 2500);
    }
  };

  // Execute Import
  const handleExecuteNativeImport = () => {
    if (!nativeInspection.parseResult || nativeInspection.tasksCount === 0) return;
    onImport(nativeInspection.parseResult, replaceExisting);
    onClose();
  };

  const handleExecuteWizardImport = () => {
    if (!wizardInspection?.parseResult || wizardInspection.tasksCount === 0) return;
    onImport(wizardInspection.parseResult, replaceExisting);
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
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                Import Kanban Workflow
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Native file ingestion or guided preformatting with Claude, ChatGPT, or Gemini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-900/60 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('native')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'native'
                ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 -mb-px'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            Direct Native Import
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              .md · .json · .csv
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wizard')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'wizard'
                ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 -mb-px'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            AI ChatBot Preformatter
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold">
              Claude · ChatGPT · Gemini
            </span>
          </button>
        </div>

        {/* Tab 1: Direct Native Import */}
        {activeTab === 'native' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Format Selection & Preset */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-medium">Format:</span>
                <div className="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDocType('markdown')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      docType === 'markdown'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('json')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      docType === 'json'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType('csv')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      docType === 'csv'
                        ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    CSV
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDocType('markdown');
                  setNativeContent(SAMPLE_NATIVE_MARKDOWN);
                  setNativeFileName('Sample_Sprint_Workflow.md');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Load Sample Gold-Standard Markdown
              </button>
            </div>

            {/* Drag and Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setNativeDragOver(true);
              }}
              onDragLeave={() => setNativeDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setNativeDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessNativeFile(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 transition text-center flex flex-col items-center justify-center gap-2 ${
                nativeDragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/20'
              }`}
            >
              <Upload className="w-5 h-5 text-zinc-400" />
              <div className="text-xs">
                <label className="font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                  Click to upload
                  <input
                    type="file"
                    accept=".md,.markdown,.json,.kbf,.csv,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessNativeFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <span className="text-zinc-500"> or drag and drop your file here</span>
              </div>
              {nativeFileName && (
                <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-800/80 px-2 py-0.5 rounded">
                  Loaded: {nativeFileName}
                </div>
              )}
            </div>

            {/* Document Text Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Document Content
                </label>
                <span className="text-[11px] font-mono text-zinc-400">
                  {nativeContent.split(/\r?\n/).length} lines · {nativeContent.length} chars
                </span>
              </div>
              <textarea
                value={nativeContent}
                onChange={(e) => {
                  setNativeContent(e.target.value);
                  setRawDocument(e.target.value);
                }}
                rows={9}
                placeholder="Paste your native MyKanBan markdown, JSON, or CSV here..."
                className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
              />
            </div>

            {/* Real-Time Inspection Diagnostic Card */}
            {nativeInspection.isParsable ? (
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    {nativeInspection.diagnosis.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                    <span>{nativeInspection.columnsCount} columns</span>
                    <span>•</span>
                    <span>{nativeInspection.tasksCount} tasks</span>
                    <span>•</span>
                    <span>~{nativeInspection.pointsCount} pts</span>
                  </div>
                </div>

                {nativeInspection.parseResult && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {nativeInspection.parseResult.columns.map((col, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/80 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-2xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {col.title}: <strong className="text-zinc-900 dark:text-zinc-100">{col.tasks.length}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      {nativeInspection.diagnosis.title}
                    </div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-normal">
                      {nativeInspection.diagnosis.message}
                    </p>
                  </div>
                </div>

                {/* Prompt Guide Callout */}
                <div className="pt-2 border-t border-amber-200/80 dark:border-amber-800/60 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                    Convert raw audits, meeting notes, or PRDs with your favorite AI ChatBot in 1-click:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawDocument(nativeContent);
                      setActiveTab('wizard');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Open AI Preformatter Guide
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Guided AI ChatBot Preformatter */}
        {activeTab === 'wizard' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Guide Step 1: Input Document */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Input Your Unstructured Document / Audit Report
                  </h3>
                </div>
                <label className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Upload file (.md, .txt)
                  <input
                    type="file"
                    accept=".md,.markdown,.txt,.doc"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProcessWizardFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                value={rawDocument}
                onChange={(e) => setRawDocument(e.target.value)}
                rows={4}
                placeholder="Paste your raw meeting notes, SEO audit, PRD, or messy task list here..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
              />
              <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono">
                <span>
                  {rawDocument.split(/\r?\n/).length} lines · {rawDocument.length} chars
                </span>
                {rawDocument.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setRawDocument(SAMPLE_NATIVE_MARKDOWN)}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                  >
                    Paste sample SEO audit
                  </button>
                )}
              </div>
            </div>

            {/* Guide Step 2: Copy Master Prompt & Launch AI */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Copy Master Prompt & Open AI ChatBot
                  </h3>
                </div>

                {/* Option Toggle */}
                <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeDocInPrompt}
                    onChange={(e) => setIncludeDocInPrompt(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Embed document in prompt (Recommended)</span>
                </label>
              </div>

              {/* Copy Buttons */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyCompletePrompt}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs ${
                    copiedPrompt
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Prompt to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Complete Master Prompt {includeDocInPrompt && rawDocument.trim() ? '(With Document)' : ''}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleCopyInstructionsOnly}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition flex items-center gap-1.5 ${
                    copiedInstructions
                      ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {copiedInstructions ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied Instructions
                    </>
                  ) : (
                    <>
                      <FileCode className="w-3.5 h-3.5" />
                      Copy Instructions Only
                    </>
                  )}
                </button>
              </div>

              {/* LLM Launcher Buttons */}
              <div className="pt-2">
                <div className="text-[11px] font-medium text-zinc-500 mb-2">
                  Launch your preferred AI model in 1-click, paste the prompt, and copy the response:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LLM_PLATFORMS.map((platform) => (
                    <a
                      key={platform.id}
                      href={platform.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-2.5 rounded-xl border bg-white dark:bg-zinc-950 transition flex flex-col gap-1 group shadow-2xs ${platform.color}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs flex items-center gap-1">
                          {platform.name}
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition" />
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {platform.badge}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                        {platform.description}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Guide Step 3: Paste Preformatted Markdown */}
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Paste Preformatted AI Markdown Response
                  </h3>
                </div>
                {aiOutputMarkdown.trim() && (
                  <button
                    type="button"
                    onClick={() => setAiOutputMarkdown('')}
                    className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Clear
                  </button>
                )}
              </div>

              <textarea
                value={aiOutputMarkdown}
                onChange={(e) => setAiOutputMarkdown(e.target.value)}
                rows={6}
                placeholder="Paste the Markdown output generated by Claude, ChatGPT, or Gemini here..."
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
              />

              {/* Real-Time Live Validation for Wizard Step 3 */}
              {wizardInspection && (
                <div>
                  {wizardInspection.isParsable ? (
                    <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Valid MyKanBan Native Markdown Ready
                        </div>
                        <div className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                          {wizardInspection.columnsCount} columns · {wizardInspection.tasksCount} tasks · ~{wizardInspection.pointsCount} pts
                        </div>
                      </div>

                      {wizardInspection.parseResult && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {wizardInspection.parseResult.columns.map((col, i) => (
                            <span
                              key={i}
                              className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/80 text-zinc-700 dark:text-zinc-300 font-medium flex items-center gap-1.5 shadow-2xs"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {col.title}: <strong className="text-zinc-900 dark:text-zinc-100">{col.tasks.length}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Formatting Notice:</strong> Ensure the AI returned markdown with columns (e.g. ## Backlog, ## Sprint To-Do) and task lines (e.g. - [ ] Title @Role #priority ~points).
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Replace current board (uncheck to append)</span>
            </label>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
            >
              Cancel
            </button>

            {activeTab === 'native' ? (
              <button
                type="button"
                disabled={!nativeInspection.isParsable}
                onClick={handleExecuteNativeImport}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
                  nativeInspection.isParsable
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Import to Kanban Board
              </button>
            ) : (
              <button
                type="button"
                disabled={!wizardInspection?.isParsable}
                onClick={handleExecuteWizardImport}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs ${
                  wizardInspection?.isParsable
                    ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                Import Structured Board
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
