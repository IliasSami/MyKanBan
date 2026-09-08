import React, { useState } from 'react';
import {
  Share2,
  Download,
  Upload,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  SquareKanban,
  Users
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
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Left: Minimal Branding & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/60 text-blue-400 font-bold">
            <SquareKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100 tracking-tight">
                MyKanBan
              </span>
              <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                Scrum
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-normal truncate max-w-xs md:max-w-md">
              {boardTitle || project.title}
            </p>
          </div>
        </div>

        {/* Center: Minimal Collab Code Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Share2 className="w-3 h-3 text-zinc-400" />
            <span className="text-[11px]">Room:</span>
          </span>
          <code className="text-xs font-mono font-semibold text-zinc-100">
            {project.collabCode}
          </code>
          <button
            onClick={handleCopyCode}
            title="Copy Collab Code"
            className="text-xs text-zinc-400 hover:text-zinc-100 p-0.5 rounded transition flex items-center"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Right Actions: Minimal & Functional */}
        <div className="flex items-center gap-2">
          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            <span>Import</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-zinc-800 text-zinc-200"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    onExportCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-zinc-800 text-zinc-200"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                  CSV Table (.csv)
                </button>
              </div>
            )}
          </div>

          {/* Collab Code & Projects */}
          <button
            onClick={onOpenCollab}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collab & Projects</span>
            <span className="sm:hidden">Collab</span>
          </button>

          {/* User Profile Avatar: Clean Monochrome */}
          <button
            onClick={onOpenCollab}
            title={`Active: ${user.name}`}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 hover:border-zinc-600 transition font-mono text-xs text-zinc-200"
          >
            {user.initials || 'U'}
          </button>
        </div>
      </div>
    </header>
  );
};
