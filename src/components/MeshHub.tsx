import React, { useRef, useState } from 'react';
import { 
  MessageSquare, Users, Send, Paperclip, Shield, MicOff, Volume2, UserX, Hand, X, FileText, Image as ImageIcon 
} from 'lucide-react';
import { ChatMessage, Participant } from '../types';

interface MeshHubProps {
  participants: Participant[];
  messages: ChatMessage[];
  currentUserId: string;
  isHost: boolean;
  onSendMessage: (text: string, attachment?: any) => void;
  onClose: () => void;
}

export const MeshHub: React.FC<MeshHubProps> = ({
  participants,
  messages,
  currentUserId,
  isHost,
  onSendMessage,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'participants'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Enforce 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit.');
      return;
    }

    setFileError(null);
    setSelectedFile(file);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() && !selectedFile) return;

    let attachmentPayload = undefined;
    if (selectedFile) {
      attachmentPayload = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        url: URL.createObjectURL(selectedFile),
      };
    }

    onSendMessage(chatInput.trim(), attachmentPayload);
    setChatInput('');
    setSelectedFile(null);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <aside className="w-full lg:w-80 bg-white dark:bg-slate-900 border-l border-[#DFE7F0] dark:border-slate-800 flex flex-col h-full shadow-lg z-30">
      
      {/* Tab Header Bar */}
      <div className="p-3 border-b border-[#DFE7F0] dark:border-slate-800 flex items-center justify-between gap-2">
        
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            {messages.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#00B981] text-white text-[10px] rounded-full font-mono">
                {messages.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('participants')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'participants'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Peers ({participants.length})</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

      </div>

      {/* Tab Content Body */}
      {activeTab === 'chat' ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Messages list */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">No messages yet</p>
                <p className="text-[11px] text-slate-400">Send a note or attach a file to start the discussion.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-sans">{msg.senderName}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`max-w-[85%] p-3 rounded-2xl text-xs space-y-2 ${
                        isMe
                          ? 'bg-[#00B981] text-white rounded-br-none'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-[#DFE7F0] dark:border-slate-700'
                      }`}
                    >
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}

                      {msg.attachment && (
                        <div className="p-2 rounded-xl bg-black/10 dark:bg-black/30 border border-white/20 flex items-center gap-2">
                          {msg.attachment.type.startsWith('image/') ? (
                            <ImageIcon className="w-4 h-4 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 shrink-0" />
                          )}
                          <div className="overflow-hidden text-left flex-1">
                            <span className="block truncate font-semibold text-[11px]">{msg.attachment.name}</span>
                            <span className="block text-[10px] opacity-80 font-mono">{formatFileSize(msg.attachment.size)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Selected File Banner */}
          {selectedFile && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-t border-[#DFE7F0] dark:border-slate-700 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="truncate max-w-[200px] font-mono text-[11px]">{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)} className="p-1 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {fileError && (
            <p className="px-4 py-1 text-[11px] text-red-500 font-medium">{fileError}</p>
          )}

          {/* Chat Input Bar */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#DFE7F0] dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Attach File (Max 5MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type message..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-[#DFE7F0] dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!chatInput.trim() && !selectedFile}
              className="p-2 bg-[#00B981] hover:bg-[#008F67] disabled:opacity-50 text-white rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      ) : (
        /* Participants List */
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {participants.map((p) => {
            const isMe = p.id === currentUserId;
            return (
              <div
                key={p.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-[#DFE7F0] dark:border-slate-700/80 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#008F67] to-[#00B981] text-white font-bold text-xs flex items-center justify-center">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    {p.isHandRaised && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[10px] shadow">
                        ✋
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white">
                      {p.name} {isMe && '(You)'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.isHost ? 'Host Peer' : 'Participant'} • RTT: {p.pingMs || 18}ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  {p.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </aside>
  );
};
