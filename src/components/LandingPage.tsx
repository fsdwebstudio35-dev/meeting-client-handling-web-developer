import React, { useState } from 'react';
import { 
  Video, Plus, ArrowRight, ShieldCheck, Zap, Monitor, Sparkles, 
  ChevronDown, Lock, Cpu, Globe, Activity, CheckCircle, Clock, Users,
  Copy, Play, RefreshCw, Server
} from 'lucide-react';
import { MeetingRecord } from '../types';

interface LandingPageProps {
  onStartInstantMeeting: () => void;
  onJoinMeetingPrompt: () => void;
  history: MeetingRecord[];
  onSelectHistoryMeeting: (record: MeetingRecord) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartInstantMeeting,
  onJoinMeetingPrompt,
  history,
  onSelectHistoryMeeting,
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const faqs = [
    {
      q: 'How does AetherMeet achieve low latency without media servers?',
      a: 'AetherMeet establishes direct peer-to-peer WebRTC mesh data channels and media streams between participants, bypassing intermediate media servers. Signaling occurs over encrypted Socket.IO WebSockets with automatic STUN/TURN traversal.',
    },
    {
      q: 'Is end-to-end encryption supported?',
      a: 'All media streams utilize WebRTC standard DTLS-SRTP transport encryption. Peer data and audio/video packets remain encrypted in transit. Signaling frames are secured over TLS 1.3.',
    },
    {
      q: 'How do the Gemini AI capabilities work during a call?',
      a: 'Meeting audio transcription is logged securely and processed by our Express backend using the official @google/genai SDK (gemini-3.8-flash) to output structured executive summaries, action items, and meeting notes.',
    },
    {
      q: 'What browser permissions are required?',
      a: 'AetherMeet requires standard browser permissions for camera and microphone access. Screen sharing uses the native WebRTC getDisplayMedia API.',
    },
    {
      q: 'When does AetherMeet switch from P2P Mesh to SFU relay?',
      a: 'For sessions up to 6–8 participants, peer-to-peer mesh provides minimal latency. For large-scale broadcasts, our architecture connects to a selective forwarding unit (SFU) such as LiveKit or mediasoup.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative pt-12 lg:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          {/* Subtle Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00B981]/10 border border-[#00B981]/20 text-[#008F67] dark:text-[#00B981] text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>WebRTC 2.0 • Socket.IO Signaling • Gemini AI Powered</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            Next-Gen Holographic <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#008F67] via-[#00B981] to-emerald-400 bg-clip-text text-transparent">
              Video Collaboration
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Experience ultra low-latency WebRTC video meetings with real-time peer mesh telemetry, crystal-clear screen sharing, and automated Gemini AI transcription & summaries.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartInstantMeeting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#008F67] to-[#00B981] hover:opacity-95 text-white font-bold text-sm shadow-lg shadow-[#00B981]/25 transition-all flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Instant Meeting</span>
            </button>

            <button
              onClick={onJoinMeetingPrompt}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-sm border border-[#DFE7F0] dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Video className="w-4 h-4 text-[#00B981]" />
              <span>Join Meeting</span>
            </button>
          </div>

          {/* Quick Stats Strip */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center max-w-3xl mx-auto text-slate-500 dark:text-slate-400 text-xs font-mono">
            <div className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-[#DFE7F0] dark:border-slate-800">
              <span className="block text-slate-900 dark:text-white font-bold text-base font-sans">&lt; 20 ms</span>
              <span>Ultra Low Latency</span>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-[#DFE7F0] dark:border-slate-800">
              <span className="block text-slate-900 dark:text-white font-bold text-base font-sans">1080p 60fps</span>
              <span>UHD Video Stream</span>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-[#DFE7F0] dark:border-slate-800">
              <span className="block text-slate-900 dark:text-white font-bold text-base font-sans">DTLS-SRTP</span>
              <span>Transport Encrypted</span>
            </div>
            <div className="p-3 bg-white/60 dark:bg-slate-800/40 rounded-xl border border-[#DFE7F0] dark:border-slate-800">
              <span className="block text-slate-900 dark:text-white font-bold text-base font-sans">Gemini 3.8</span>
              <span>Smart Notes & Summary</span>
            </div>
          </div>

        </div>

        {/* 2. INTERACTIVE MEETING PREVIEW */}
        <div className="mt-14 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-4 sm:p-6">
          
          {/* Header Bar inside preview */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-200 font-semibold font-sans">Room: aether-demo-100</span>
              <span className="hidden sm:inline bg-slate-800 text-emerald-400 px-2 py-0.5 rounded text-[11px]">P2P Mesh Connected</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden md:inline">RTT: 18ms</span>
              <span className="hidden sm:inline">Encrypted DTLS-SRTP</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg font-sans text-xs">
                3 Connected
              </span>
            </div>
          </div>

          {/* Participant Tile Grid Mockup */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            
            {/* Tile 1: Alex */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 group">
              <img 
                src="/src/assets/images/avatar_alex_1793274052134.jpg" 
                alt="Alex Vance" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                  Alex Vance (Host)
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </span>
                <div className="flex items-center gap-1 text-[10px] bg-black/60 backdrop-blur text-emerald-400 px-2 py-0.5 rounded font-mono">
                  <span>1080p</span>
                  <span>•</span>
                  <span>2.4 Mbps</span>
                </div>
              </div>
            </div>

            {/* Tile 2: Sarah */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-[#00B981] shadow-lg shadow-[#00B981]/20 group">
              <img 
                src="/src/assets/images/avatar_sarah_1793274051710.jpg" 
                alt="Dr. Sarah Chen" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-[#00B981] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                Active Speaker
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                  Dr. Sarah Chen
                </span>
                {/* Simulated Audio Visualizer Wave */}
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-1 bg-[#00B981] h-full rounded-full animate-bounce" />
                  <span className="w-1 bg-[#00B981] h-2/3 rounded-full animate-bounce delay-75" />
                  <span className="w-1 bg-[#00B981] h-4/5 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            </div>

            {/* Tile 3: Network Topology Hologram */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-800 border border-slate-700/80 group">
              <img 
                src="/src/assets/images/hero_network_preview_1793274052002.jpg" 
                alt="Mesh Topology" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-between p-3">
                <span className="text-emerald-400 text-xs font-semibold font-mono flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" />
                  Node Mesh Stream
                </span>
                <div className="space-y-1">
                  <span className="text-white text-xs font-medium block">STUN/TURN Traversal Active</span>
                  <span className="text-slate-400 text-[11px] font-mono block">Packets: 0% Loss • 60 FPS</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Built for High-Performance Teams
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto">
            AetherMeet combines direct peer WebRTC streaming with server-side AI processing.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#00B981]/10 text-[#00B981] flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Low-Latency WebRTC</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Direct peer-to-peer audio and video media channels deliver real-time sub-20ms communication without central server bottlenecks.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#00B981]/10 text-[#00B981] flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure Meetings</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              JWT token authentication, host lock capabilities, and DTLS-SRTP media encryption ensure private, tamper-proof calls.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#00B981]/10 text-[#00B981] flex items-center justify-center font-bold">
              <Monitor className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">HD Screen Sharing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Share full screens, app windows, or browser tabs using getDisplayMedia with adaptive resolution and smooth frame rates.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#00B981]/10 text-[#00B981] flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Gemini AI Assistant</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Server-side Gemini 3.8 Flash automatically transcribes transcripts, generates structured summaries, and extracts key action items.
            </p>
          </div>

        </div>
      </section>

      {/* 4. RECENT MEETING HISTORY */}
      <section id="history" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Recent Meeting History</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Access saved call summaries and reconnect with one click</p>
          </div>
          <button
            onClick={onStartInstantMeeting}
            className="px-4 py-2 bg-[#00B981] hover:bg-[#008F67] text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            New Meeting
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800/60 rounded-2xl border border-[#DFE7F0] dark:border-slate-700">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No recent meeting logs found</p>
            <p className="text-xs text-slate-500 mt-1">Start a meeting to view auto-generated records and AI notes.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((record) => (
              <div
                key={record.id}
                className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700 hover:border-[#00B981] transition-all space-y-3 cursor-pointer group"
                onClick={() => onSelectHistoryMeeting(record)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded">
                    {record.roomCode}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{record.date}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#00B981] transition-colors line-clamp-1">
                  {record.title}
                </h3>

                {record.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {record.summary}
                  </p>
                )}

                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {record.participantCount} participants
                  </span>
                  <span className="text-[#00B981] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Rejoin Room
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. TECHNOLOGY ARCHITECTURE */}
      <section id="architecture" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono mb-2">
                <Cpu className="w-3.5 h-3.5" />
                SYSTEM DESIGN
              </div>
              <h2 className="text-2xl font-bold">AetherMeet Hybrid Peer Topology</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              STUN/TURN Traversal • Socket.IO Signaling • Express Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            
            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  1. WebRTC Mesh
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Client-Direct</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                Direct RTCPeerConnection channels transmit opus audio and VP8/H.264 video streams directly between browser peers.
              </p>
            </div>

            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-[#00B981] font-bold">
                <span className="flex items-center gap-2">
                  <Server className="w-4 h-4" />
                  2. Socket.IO Relay
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Express Port 3000</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                WebSocket signaling server routes SDP offers, SDP answers, and ICE candidate attributes for NAT/firewall traversal.
              </p>
            </div>

            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  3. Gemini AI Pipeline
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">Server SDK</span>
              </div>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                @google/genai parses live transcript logs server-side to generate executive summaries and structured JSON task items.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 6. FAQ ACCORDION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-slate-600 dark:text-slate-400 text-xs">Everything you need to know about AetherMeet platform security and media routing.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800/80 rounded-2xl border border-[#DFE7F0] dark:border-slate-700/80 overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-5 text-left flex items-center justify-between font-semibold text-sm text-slate-900 dark:text-white"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaq === idx ? 'rotate-180 text-[#00B981]' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer id="security" className="border-t border-[#DFE7F0] dark:border-slate-800 pt-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#00B981] flex items-center justify-center text-white font-bold text-xs">
              A
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-sm">AetherMeet</span>
            <span className="text-[11px] text-slate-400">· Next-Gen Holographic Video Collaboration</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#architecture" className="hover:text-slate-900 dark:hover:text-white transition-colors">Architecture</a>
            <a href="#faq" className="hover:text-slate-900 dark:hover:text-white transition-colors">Security FAQ</a>
          </div>

        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <span>© {new Date().getFullYear()} AetherMeet. All rights reserved. Powered by WebRTC & Gemini AI.</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">
            DTLS-SRTP Protected • Server Port 3000
          </span>
        </div>
      </footer>

    </div>
  );
};
