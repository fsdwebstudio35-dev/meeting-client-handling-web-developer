import React, { useState, useEffect } from 'react';
import { Sparkles, FileText, CheckCircle2, ListChecks, Bot, X, RefreshCw, AlertCircle } from 'lucide-react';
import { AISummaryResult } from '../types';
import { generateAISummary } from '../services/api';

interface AIAssistantPanelProps {
  roomCode: string;
  chatMessages: string[];
  onClose: () => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  roomCode,
  chatMessages,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AISummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);

  // Web Speech API for live auto-captions
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isCapturing) {
      try {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              setCaptions((prev) => [...prev, `[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] ${text}`]);
            }
          }
        };

        recognition.start();
      } catch (e) {
        console.warn('Speech recognition error', e);
      }
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isCapturing]);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateAISummary({
        roomCode,
        chatTranscript: chatMessages,
        captionsTranscript: captions,
      });
      setAiResult(result);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to Gemini AI server pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-full lg:w-96 bg-white dark:bg-slate-900 border-l border-[#DFE7F0] dark:border-slate-800 flex flex-col h-full shadow-2xl z-30 overflow-hidden">
      
      {/* Panel Header */}
      <div className="p-4 border-b border-[#DFE7F0] dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#00B981]/10 text-[#00B981] flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Gemini AI Assistant</h3>
            <span className="text-[10px] text-slate-400 font-mono">Model: gemini-3.8-flash</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Consent & AI Notice Banner */}
      <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-[#DFE7F0] dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-[#00B981] shrink-0 mt-0.5" />
        <p className="leading-tight">
          AI features require user transcript consent. Processing occurs via secure server endpoints using Google Gemini.
        </p>
      </div>

      <div className="flex-1 p-4 space-y-5 overflow-y-auto">
        
        {/* Caption Capturing Toggle */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-[#DFE7F0] dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Live Captions</span>
            <span className="text-[10px] text-slate-400">Speech-to-text logging</span>
          </div>
          <button
            onClick={() => setIsCapturing(!isCapturing)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              isCapturing ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-[#00B981] text-white hover:bg-[#008F67]'
            }`}
          >
            {isCapturing ? 'Stop Captions' : 'Start Captions'}
          </button>
        </div>

        {/* Captions Feed Box */}
        {captions.length > 0 && (
          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono max-h-36 overflow-y-auto space-y-1 border border-slate-800">
            <span className="text-[10px] text-emerald-400 font-bold block mb-1">Live Caption Stream:</span>
            {captions.map((cap, i) => (
              <p key={i} className="text-[11px] leading-tight">{cap}</p>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#008F67] to-[#00B981] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md shadow-[#00B981]/20 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing Room Transcript...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate AI Summary & Action Items</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* AI Result Card */}
        {aiResult && (
          <div className="space-y-4 pt-2">
            
            {/* Executive Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <FileText className="w-4 h-4 text-[#00B981]" />
                <span>Executive Summary</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {aiResult.summary}
              </p>
            </div>

            {/* Action Items */}
            {aiResult.actionItems && aiResult.actionItems.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <ListChecks className="w-4 h-4 text-[#00B981]" />
                  <span>Action Items</span>
                </div>
                <ul className="space-y-1.5">
                  {aiResult.actionItems.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00B981] shrink-0 mt-0.5" />
                      <div>
                        <span>{item.task}</span>
                        {item.priority && (
                          <span className={`ml-2 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            item.priority === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                          }`}>
                            {item.priority}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggested Notes */}
            {aiResult.suggestedNotes && aiResult.suggestedNotes.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Bot className="w-4 h-4 text-[#00B981]" />
                  <span>Key Discussion Takeaways</span>
                </div>
                <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                  {aiResult.suggestedNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>

    </aside>
  );
};
