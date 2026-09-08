import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Plus,
  Radio,
  FolderKanban,
  ArrowRight,
  User,
  Trash2,
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
  onLeaveProject?: (code: string) => void;
}

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
  onLeaveProject,
}) => {
  const [activeTab, setActiveTab] = useState<'collab' | 'profile' | 'projects'>('collab');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [newProjTitle, setNewProjTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState(user.name);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    const inviteUrl = `${window.location.origin}/?room=${currentProject.collabCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCodeInput.trim()) {
      setJoinError('Please enter a room code.');
      return;
    }

    const success = onJoinCode(joinCodeInput.trim());
    if (success) {
      setJoinCodeInput('');
      onClose();
    } else {
      setJoinError('Invalid room code. Please check and try again.');
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
      initials: initials || 'U',
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="collab-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 id="collab-modal-title" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Workspace & Collaboration
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Private board management and team invitation.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close workspace modal"
            className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-900 transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center px-5 pt-2 border-b border-zinc-200 dark:border-zinc-800 gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('collab')}
            className={`pb-2.5 transition relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
              activeTab === 'collab'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Invite & Share</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 transition relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
              activeTab === 'projects'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>My Boards ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 transition relative flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
              activeTab === 'profile'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {activeTab === 'collab' && (
            <div className="space-y-4">
              {/* Active Room Code Card */}
              <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Private Board Code
                  </span>
                  <span className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Encrypted Sync
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 mt-2">
                  <code className="font-mono text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
                    {currentProject.collabCode}
                  </code>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied Link</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Invite Link</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5 leading-relaxed">
                  Only individuals with this code or direct invite link can join this board. Your data remains strictly isolated.
                </p>
              </div>

              {/* Join Board */}
              <div className="bg-zinc-50/70 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-2.5">
                <h3 className="font-medium text-xs text-zinc-800 dark:text-zinc-200">
                  Join Team Workspace with Code
                </h3>
                <form onSubmit={handleJoin} className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. KAN-842"
                    maxLength={12}
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-3 py-1.5 font-mono text-xs uppercase text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded transition border border-zinc-300 dark:border-zinc-700 flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    <span>Join</span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                  </button>
                </form>
                {joinError && <p className="text-red-600 dark:text-red-400 text-[11px] font-mono">{joinError}</p>}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="space-y-4">
              {/* New Project Form */}
              <form onSubmit={handleCreateNewProject} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2">
                <h3 className="font-medium text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                  Create New Private Board
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProjTitle}
                    onChange={(e) => setNewProjTitle(e.target.value)}
                    placeholder="Board name..."
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    Create
                  </button>
                </div>
              </form>

              {/* Projects List */}
              <div className="space-y-1.5">
                <span className="block text-zinc-500 text-[11px] font-mono">YOUR SAVED BOARDS</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border transition ${
                        proj.id === currentProject.id
                          ? 'bg-blue-50/50 dark:bg-zinc-900 border-blue-500/80 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs truncate">
                            {proj.title}
                          </span>
                          {proj.id === currentProject.id && (
                            <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-1 py-0.2 rounded border border-blue-200 dark:border-blue-500/20">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 block mt-0.5">
                          {proj.collabCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {onLeaveProject && proj.id !== currentProject.id && (
                          <button
                            onClick={() => onLeaveProject(proj.collabCode)}
                            title="Remove from saved boards"
                            className="p-1 rounded text-zinc-400 hover:text-red-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ArrowRight
                          className="w-3.5 h-3.5 text-zinc-400 cursor-pointer"
                          onClick={() => {
                            onSelectProject(proj.id);
                            onClose();
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-mono font-bold text-sm text-zinc-800 dark:text-zinc-200">
                  {name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2) || 'U'}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{name || 'User'}</h4>
                  <p className="text-[11px] text-zinc-500">
                    Displayed on assigned tasks and sprint history.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-400 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-600"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded transition focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
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

