import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Plus,
  Radio,
  FolderKanban,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Palette
} from 'lucide-react';
import type { Project, UserProfile } from '../types/kanban';

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  projects: Project[];
  user: UserProfile;
  onUpdateUser: (patch: Partial<UserProfile>) => void;
  onJoinCode: (code: string) => boolean;
  onCreateProject: (title: string, description?: string) => void;
  onSelectProject: (projectId: string) => void;
}

const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

export const CollabModal: React.FC<CollabModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  projects,
  user,
  onUpdateUser,
  onJoinCode,
  onCreateProject,
  onSelectProject,
}) => {
  const [activeTab, setActiveTab] = useState<'collab' | 'profile' | 'projects'>('collab');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [newProjTitle, setNewProjTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Profile form state
  const [name, setName] = useState(user.name);
  const [avatarColor, setAvatarColor] = useState(user.avatarColor);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentProject.collabCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a collab code.');
      return;
    }

    const success = onJoinCode(joinCodeInput.trim());
    if (success) {
      setJoinCodeInput('');
      onClose();
    } else {
      setJoinError('Invalid collab code. Please check and try again.');
    }
  };

  const handleCreateNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjTitle.trim()) return;
    onCreateProject(newProjTitle.trim());
    setNewProjTitle('');
    onClose();
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    onUpdateUser({
      name: name.trim() || 'Collaborator',
      avatarColor,
      initials: initials || 'U',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Collaboration & Projects</h2>
              <p className="text-xs text-slate-400">
                Share invite codes, join teammate boards, or customize your user identity.
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

        {/* Tab switcher */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('collab')}
            className={`pb-3 transition relative flex items-center gap-1.5 ${
              activeTab === 'collab'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Collab Codes</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 transition relative flex items-center gap-1.5 ${
              activeTab === 'projects'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Switch / New Board ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 transition relative flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-indigo-400 border-b-2 border-indigo-500 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Identity & Login</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {activeTab === 'collab' && (
            <div className="space-y-6">
              {/* Current Board Share Card */}
              <div className="bg-gradient-to-br from-slate-800 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Current Board Collab Code
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Sync Active
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 mt-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-medium">Invite Code</span>
                    <span className="font-mono text-xl font-black text-indigo-300 tracking-wider">
                      {currentProject.collabCode}
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                  Send this 6-character code to your teammates. When they enter it in MyKanBan, they'll immediately sync to your board in real time.
                </p>
              </div>

              {/* Join Board with Code */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  Join Another Board
                </h3>
                <p className="text-slate-400 text-xs">
                  Enter a teammate's Collab Code (e.g., <code className="text-indigo-300">KAN-842</code>) to connect to their Kanban board.
                </p>

                <form onSubmit={handleJoin} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter Collab Code..."
                    maxLength={10}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 font-mono text-sm uppercase text-white focus:outline-none focus:border-cyan-400 tracking-wider"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition shadow"
                  >
                    <span>Connect</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
                {joinError && <p className="text-rose-400 text-xs font-semibold">{joinError}</p>}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-5">
              {/* Create New Project Form */}
              <form onSubmit={handleCreateNewProject} className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  Create New Kanban Board
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="e.g. Sprint 26: Mobile Redesign..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create
                  </button>
                </div>
              </form>

              {/* Projects List */}
              <div className="space-y-2">
                <span className="block text-slate-400 font-medium">Your Boards:</span>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                        proj.id === currentProject.id
                          ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-100 truncate text-xs">
                            {proj.title}
                          </h4>
                          {proj.id === currentProject.id && (
                            <span className="text-[10px] bg-indigo-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-indigo-400 mt-0.5 block">
                          Code: {proj.collabCode}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/80">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-lg ring-4 ring-slate-700/50"
                  style={{ backgroundColor: avatarColor }}
                >
                  {name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{name || 'Your Name'}</h4>
                  <p className="text-xs text-slate-400">
                    This avatar and name represent you on the Kanban board.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Choose Avatar Color</span>
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setAvatarColor(col)}
                      className={`w-8 h-8 rounded-full transition-transform ${
                        avatarColor === col ? 'scale-125 ring-2 ring-white shadow-lg' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
