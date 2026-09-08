import React from 'react';
import { Sun, Moon, Monitor, Eye, ZoomIn, Activity, X } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

interface AccessibilityMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ isOpen, onClose }) => {
  const {
    theme,
    setTheme,
    contrast,
    setContrast,
    textSize,
    setTextSize,
    reducedMotion,
    setReducedMotion,
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="a11y-menu-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-5 shadow-2xl bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 id="a11y-menu-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Display & Accessibility
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Customize appearance and visual comfort.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close accessibility settings"
            className="p-1 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-4 text-xs">
          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Theme selector">
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  theme === 'light'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  theme === 'dark'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                aria-pressed={theme === 'system'}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border text-xs font-medium transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                  theme === 'system'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-blue-500" />
              <div>
                <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                  High Contrast (WCAG AAA)
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  Crisper borders and maximum text contrast
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={contrast === 'high'}
              onClick={() => setContrast(contrast === 'high' ? 'normal' : 'high')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                contrast === 'high' ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  contrast === 'high' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Text Size */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <ZoomIn className="w-4 h-4 text-blue-500" />
              <div>
                <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                  Large Text
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  Enlarge fonts by 15% for improved legibility
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={textSize === 'large'}
              onClick={() => setTextSize(textSize === 'large' ? 'normal' : 'large')}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                textSize === 'large' ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  textSize === 'large' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-blue-500" />
              <div>
                <span className="block font-medium text-zinc-900 dark:text-zinc-100">
                  Reduce Motion
                </span>
                <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">
                  Disable transitions for motion sensitivity
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                reducedMotion ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  reducedMotion ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer & Attribution */}
        <div className="mt-5 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Built by{' '}
            <a
              href="https://iliassami.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-800 dark:text-zinc-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 underline decoration-zinc-300 dark:decoration-zinc-700 underline-offset-2 transition"
            >
              Ilias Sami
            </a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
