import React, { useState } from 'react';
import {
  Share2,
  Download,
  Upload,
  User,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  Kanban,
  Sparkles
} from 'lucide-react';
import type { UserProfile, Project } from '../types/kanban';

interface NavbarProps {
  project: Project;
  boardTitle: string;
  user: UserProfile;
  onOpenImport: () => void;
  onOpenCollab: () => void;
  onExportMarkdown: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  boardTitle,
  user,
  onOpenImport,
  onOpenCollab,
  onExportMarkdown,
  onExportCSV,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(project.collabCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Left: Branding & Board Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                MyKanBan
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Scrum Flow
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-xs md:max-w-md">
              {boardTitle || project.title}
            </p>
          </div>
        </div>

        {/* Center: Quick Collab Code Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-full px-3 py-1.5 shadow-inner">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            Collab Code:
          </span>
          <code className="text-xs font-mono font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
            {project.collabCode}
          </code>
          <button
            onClick={handleCopyCode}
            title="Copy Collab Code to invite teammates"
            className="text-xs text-slate-300 hover:text-white p-1 rounded-full hover:bg-slate-700 transition flex items-center gap-1"
          >
            {copied ? (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px] font-semibold">
                <Check className="w-3.5 h-3.5" /> Copied
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:border-slate-600"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Import</span> MD/CSV
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shadow-sm hover:border-slate-600"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Export as Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    onExportCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-700 text-slate-200 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                  Export as CSV (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Collab Code & Switch Projects Button */}
          <button
            onClick={onOpenCollab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm shadow-indigo-500/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collab & Projects</span>
            <span className="sm:hidden">Collab</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenCollab}
            title={`Logged in as ${user.name}`}
            className="flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-indigo-500/50 hover:ring-indigo-400 transition font-bold text-xs text-white"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.initials || <User className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
