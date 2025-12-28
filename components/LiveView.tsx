
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import React, { useEffect, useRef, useState } from 'react';
import { audioUtils } from '../services/geminiService';

const LiveView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{ role: string, text: string }[]>([]);
  
  const sessionRef = useRef<any>(null);
  const audioContextInRef = useRef<AudioContext | null>(null);
  const audioContextOutRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const transcriptionRef = useRef({ input: '', output: '' });

  const startSession = async () => {
    setIsConnecting(true);
    try {
      // Must use direct process.env.API_KEY access and named parameter.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextInRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
            if (audioContextInRef.current) {
              const source = audioContextInRef.current.createMediaStreamSource(stream);
              const scriptProcessor = audioContextInRef.current.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: audioUtils.encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
                };
                
                // CRITICAL: Solely rely on sessionPromise resolves to avoid race conditions.
                sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };
              
              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContextInRef.current.destination);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Process transcriptions if enabled in config.
            if (message.serverContent?.outputTranscription) {
              transcriptionRef.current.output += message.serverContent.outputTranscription.text;
            } else if (message.serverContent?.inputTranscription) {
              transcriptionRef.current.input += message.serverContent.inputTranscription.text;
            }
            
            if (message.serverContent?.turnComplete) {
              const fullInput = transcriptionRef.current.input;
              const fullOutput = transcriptionRef.current.output;
              setTranscriptions(prev => [
                ...prev, 
                { role: 'You', text: fullInput },
                { role: 'Chatonn', text: fullOutput }
              ]);
              transcriptionRef.current = { input: '', output: '' };
            }

            // Handle audio output using the exact scheduling logic for smooth playback.
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && audioContextOutRef.current) {
              const ctx = audioContextOutRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const buffer = await audioUtils.decodeAudioData(
                audioUtils.decode(audioData),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch (e) {}
                sourcesRef.current.delete(s);
              });
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("Live Error:", e);
            setIsConnecting(false);
          },
          onclose: () => {
            setIsActive(false);
            setIsConnecting(false);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are Chatonn, a helpful AI. Keep responses brief and spoken-word friendly.'
        }
      });
      
      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start Live session:", err);
      setIsConnecting(false);
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.then((s: any) => {
        try { s.close(); } catch (e) {}
      });
    }
    audioContextInRef.current?.close();
    audioContextOutRef.current?.close();
    setIsActive(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-12">
      <div className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${
        isActive ? 'scale-110' : 'scale-100'
      }`}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-2xl ${isActive ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute inset-0 rounded-full border-4 border-white/20 ${isActive ? 'animate-ping' : ''}`}></div>
        
        <button 
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`z-10 w-48 h-48 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center text-4xl hover:scale-105 active:scale-95 ${
            isActive ? 'bg-red-500 text-white' : 'bg-white text-indigo-600'
          }`}
        >
          {isConnecting ? '...' : (isActive ? 'STOP' : 'LIVE')}
        </button>
      </div>

      <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 h-64 overflow-y-auto space-y-4">
        {transcriptions.length === 0 && (
          <p className="text-center opacity-40 italic mt-20">Transcriptions will appear here...</p>
        )}
        {transcriptions.map((t, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">{t.role}</span>
            <p className="text-sm">{t.text}</p>
          </div>
        ))}
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{isActive ? 'Speaking with Chatonn' : 'Ready to talk?'}</h2>
        <p className="text-sm opacity-60">
          {isActive ? 'Your microphone is active. Chatonn is listening.' : 'Click the button to start a real-time voice conversation.'}
        </p>
      </div>
    </div>
  );
};

export default LiveView;
