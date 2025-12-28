
import React from 'react';
import { Message, GroundingChunk } from '../types';

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[85%] md:max-w-[70%] rounded-3xl p-5 ${
            msg.role === 'user' 
              ? 'bg-white/10 backdrop-blur-md border border-white/20' 
              : 'bg-indigo-600/20 backdrop-blur-md border border-indigo-500/30'
          }`}>
            <div className="flex items-center mb-2 space-x-2">
              <span className="text-xs font-bold uppercase tracking-widest opacity-40">
                {msg.role === 'assistant' ? 'Chatonn' : 'You'}
              </span>
            </div>
            
            <div className="text-sm md:text-base leading-relaxed break-words">
              {msg.role === 'assistant' && msg.thinking && (
                <div className="mb-4 p-3 bg-blue-500/10 border-l-2 border-blue-400/30 rounded-r-lg text-blue-300/80 text-xs italic">
                  <p className="font-bold mb-1 opacity-60 uppercase tracking-tighter">Thinking...</p>
                  <p className="whitespace-pre-wrap">{msg.thinking}</p>
                </div>
              )}

              {msg.type === 'text' && <p className="whitespace-pre-wrap">{msg.content}</p>}
              
              {msg.type === 'search-results' && (
                <div className="space-y-4">
                   <p className="whitespace-pre-wrap">{msg.content}</p>
                   {msg.metadata && msg.metadata.length > 0 && (
                     <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                       <p className="text-xs font-bold opacity-50">SOURCES</p>
                       <div className="flex flex-wrap gap-2">
                         {msg.metadata.map((chunk: GroundingChunk, i: number) => chunk.web && (
                           <a key={i} href={chunk.web.uri} target="_blank" rel="noreferrer" className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10">
                             {chunk.web.title}
                           </a>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              )}

              {msg.type === 'image' && (
                <div className="rounded-xl overflow-hidden shadow-2xl">
                  <img src={msg.content} alt="Generated" className="w-full h-auto" />
                </div>
              )}

              {msg.type === 'video' && (
                <div className="rounded-xl overflow-hidden shadow-2xl">
                  <video src={msg.content} controls className="w-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatWindow;
