
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppMode, Message } from './types';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import ChatInput from './components/ChatInput';
import { GeminiService } from './services/geminiService';
import LiveView from './components/LiveView';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string, files?: File[]) => {
    if (!text && (!files || files.length === 0)) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      type: 'text',
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const gemini = new GeminiService();
      
      if (activeMode === AppMode.CHAT) {
        const response = await gemini.chat(text);
        addAssistantMessage(response.text, 'text', undefined, response.thinking);
      } else if (activeMode === AppMode.SEARCH) {
        const result = await gemini.search(text);
        addAssistantMessage(result.text, 'search-results', result.grounding);
      } else if (activeMode === AppMode.IMAGE) {
        const imageUrl = await gemini.generateImage(text);
        addAssistantMessage(imageUrl, 'image');
      } else if (activeMode === AppMode.VIDEO) {
        // Fixed: Use non-null assertion as aistudio is assumed to be accessible.
        const hasKey = await window.aistudio!.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsApiKey(true);
          setIsTyping(false);
          return;
        }
        try {
          const videoUrl = await gemini.generateVideo(text);
          addAssistantMessage(videoUrl, 'video');
        } catch (videoError: any) {
          // If the request fails with this specific message, reset key state to prompt user again.
          if (videoError.message?.includes("Requested entity was not found")) {
            setNeedsApiKey(true);
          }
          throw videoError;
        }
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      addAssistantMessage(`Sorry, an error occurred: ${error.message}`, 'text');
    } finally {
      setIsTyping(false);
    }
  };

  const addAssistantMessage = (content: string, type: Message['type'] = 'text', metadata?: any, thinking?: string) => {
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content,
      thinking,
      type,
      metadata,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, assistantMsg]);
  };

  const handleSelectKey = async () => {
    // Fixed: Use non-null assertion as aistudio is assumed to be accessible.
    await window.aistudio!.openSelectKey();
    // Rule: Assume success after triggering the dialog to avoid race conditions.
    setNeedsApiKey(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden text-white">
      <Sidebar activeMode={activeMode} onModeChange={setActiveMode} />
      
      <main className="flex-1 flex flex-col relative bg-black/20 backdrop-blur-sm">
        {activeMode === AppMode.LIVE ? (
          <LiveView />
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-4">
                  <h1 className="text-4xl md:text-6xl font-bold tracking-tight opacity-90">
                    How can Chatonn Free help you?
                  </h1>
                  <p className="text-lg opacity-60">
                    Ask me anything—I can write code, generate images, search the web, and more.
                  </p>
                </div>
              )}
              <ChatWindow messages={messages} />
              {isTyping && (
                <div className="flex items-center space-x-2 p-4 bg-white/10 rounded-2xl w-fit animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
              {needsApiKey && (
                <div className="flex flex-col items-center p-8 bg-red-500/20 border border-red-500/50 rounded-2xl max-w-lg mx-auto text-center space-y-4">
                  <p className="font-semibold">A paid API key is required for video generation.</p>
                  <p className="text-sm opacity-80">Please select your API key from a paid GCP project.</p>
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-400 underline text-xs">Learn about billing</a>
                  <button 
                    onClick={handleSelectKey}
                    className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-opacity-90 transition-all"
                  >
                    Select API Key
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 sticky bottom-0">
              <ChatInput onSend={handleSendMessage} disabled={isTyping} mode={activeMode} />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
