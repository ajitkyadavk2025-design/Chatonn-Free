
import React from 'react';
import { AppMode } from '../types';

interface SidebarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange }) => {
  const modes = [
    { id: AppMode.CHAT, icon: '💬', label: 'Chat' },
    { id: AppMode.SEARCH, icon: '🔍', label: 'Search' },
    { id: AppMode.IMAGE, icon: '🎨', label: 'Image' },
    { id: AppMode.VIDEO, icon: '🎥', label: 'Video' },
    { id: AppMode.LIVE, icon: '🎤', label: 'Live' },
  ];

  return (
    <aside className="w-20 md:w-64 flex flex-col bg-black/40 backdrop-blur-md border-r border-white/10 z-10 transition-all duration-300">
      <div className="p-6">
        <h1 className="hidden md:block text-2xl font-bold text-white tracking-tighter">CHAT<span className="text-indigo-400">ONN</span></h1>
        <div className="md:hidden text-2xl text-center">💎</div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-4">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`w-full flex items-center p-4 rounded-2xl transition-all duration-200 ${
              activeMode === mode.id 
                ? 'bg-white/10 shadow-lg text-white' 
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-xl">{mode.icon}</span>
            <span className="hidden md:block ml-4 font-medium">{mode.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-white/10">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-inner"></div>
          <div className="hidden md:block ml-3">
            <p className="text-sm font-semibold text-white/90">User</p>
            <p className="text-xs text-indigo-300/60 font-medium">Free Edition</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
