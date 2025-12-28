
import React, { useState, useRef } from 'react';
import { AppMode } from '../types';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  mode: AppMode;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled, mode }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const placeholders: Record<AppMode, string> = {
    [AppMode.CHAT]: "Message Chatonn...",
    [AppMode.SEARCH]: "Search with Chatonn...",
    [AppMode.IMAGE]: "Describe an image for Chatonn...",
    [AppMode.VIDEO]: "Describe a video for Chatonn...",
    [AppMode.LIVE]: "Switching to Live Mode..."
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 flex items-end">
        <button type="button" className="p-3 text-white/50 hover:text-white transition-colors">
          <span className="text-xl">➕</span>
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholders[mode]}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/40 p-3 max-h-48 resize-none font-medium text-lg outline-none"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className={`p-3 rounded-2xl transition-all duration-300 ${
            text.trim() && !disabled 
              ? 'bg-indigo-500 text-white shadow-lg' 
              : 'bg-white/5 text-white/20 cursor-not-allowed'
          }`}
        >
          <span className="text-xl">↑</span>
        </button>
      </div>
      <div className="text-center mt-3">
        <p className="text-[10px] opacity-40 font-medium tracking-widest uppercase">
          AI may provide inaccurate info. Verify results.
        </p>
      </div>
    </form>
  );
};

export default ChatInput;
