import React, { useState } from 'react';
import {
  Lock,
  Download,
  Upload,
  Copy,
  Check,
  FileText,
  FileSpreadsheet,
  SquareKanban,
  Users,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import type { UserProfile, Project } from '../types/kanban';
import { useAccessibility } from '../context/AccessibilityContext';

interface NavbarProps {
  project: Project;
  boardTitle: string;
  user: UserProfile;
  onOpenImport: () => void;
  onOpenCollab: () => void;
  onOpenA11y: () => void;
  onExportMarkdown: () => void;
  onExportCSV: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  project,
  boardTitle,
  user,
  onOpenImport,
  onOpenCollab,
  onOpenA11y,
  onExportMarkdown,
  onExportCSV,
}) => {
  const [copied, setCopied] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { theme, resolvedTheme } = useAccessibility();

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${project.collabCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800/80 px-4 lg:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-4 max-w-[1920px] mx-auto">
        {/* Left: Minimal Branding & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700/60 text-blue-600 dark:text-blue-400 font-bold">
            <SquareKanban className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
                MyKanBan
              </span>
              <span className="text-[10px] uppercase font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                Scrum
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal truncate max-w-xs md:max-w-md">
              {boardTitle || project.title}
            </p>
          </div>
        </div>

        {/* Center: Private Workspace Pill with 1-click Invite Link */}
        <div className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-medium">Private:</span>
          </span>
          <code className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {project.collabCode}
          </code>
          <button
            onClick={handleCopyInviteLink}
            title="Copy Direct Invite Link"
            aria-label="Copy Direct Invite Link"
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 p-0.5 rounded transition flex items-center focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            {copied ? (
              <span className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Copied Link
              </span>
            ) : (
              <span className="text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                Copy Link
              </span>
            )}
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Display & Accessibility Button */}
          <button
            onClick={onOpenA11y}
            title="Display & Accessibility settings"
            aria-label="Display & Accessibility settings"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            {theme === 'system' ? (
              <Monitor className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            ) : resolvedTheme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span className="hidden md:inline">Theme & A11y</span>
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span>Import</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-expanded={showExportMenu}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
            >
              <Download className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>Export</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 z-50 text-xs"
                onMouseLeave={() => setShowExportMenu(false)}
              >
                <button
                  onClick={() => {
                    onExportMarkdown();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  Markdown (.md)
                </button>
                <button
                  onClick={() => {
                    onExportCSV();
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace</span>
            <span className="sm:hidden">Boards</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={onOpenCollab}
            title={`Active: ${user.name}`}
            aria-label={`User profile: ${user.name}`}
            className="flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 transition font-mono text-xs text-zinc-800 dark:text-zinc-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            {user.initials || 'U'}
          </button>
        </div>
      </div>
    </header>
  );
};

