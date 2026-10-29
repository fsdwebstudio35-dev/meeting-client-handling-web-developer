import React, { useEffect, useRef, useState } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, Hand, Smile, MessageSquare, 
  Sparkles, PhoneOff, Copy, Check, Users, ShieldCheck, Activity, Grid, 
  Share2, Network, Lock, Maximize2, Volume2 
} from 'lucide-react';
import { ChatMessage, DashboardViewMode, Participant } from '../types';
import { socketService } from '../services/socket';
import { rtcManager } from '../services/webrtc';
import { NodeMeshVisualizer } from './NodeMeshVisualizer';
import { TelemetryView } from './TelemetryView';
import { CryptoVaultView } from './CryptoVaultView';
import { MeshHub } from './MeshHub';
import { AIAssistantPanel } from './AIAssistantPanel';

interface MeetingRoomProps {
  roomCode: string;
  userName: string;
  initialMuted: boolean;
  initialCameraOff: boolean;
  initialStream: MediaStream | null;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  roomCode,
  userName,
  initialMuted,
  initialCameraOff,
  initialStream,
  onLeave,
}) => {
  const [viewMode, setViewMode] = useState<DashboardViewMode>('grid');
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isCameraOff, setIsCameraOff] = useState(initialCameraOff);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMeshHub, setShowMeshHub] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  
  const [copiedCode, setCopiedCode] = useState(false);
  const [meetingSeconds, setMeetingSeconds] = useState(0);
  const [activeReaction, setActiveReaction] = useState<{ emoji: string; userName: string } | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [myPeerId, setMyPeerId] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize Local Media Stream & Socket Signaling
  useEffect(() => {
    const socket = socketService.connect();

    if (initialStream) {
      rtcManager.setLocalStream(initialStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = initialStream;
      }
    }

    // Join room event
    socketService.joinRoom({
      roomCode,
      userName,
      isMuted: initialMuted,
      isCameraOff: initialCameraOff,
    });

    // Socket Event Handlers
    socket.on('room-users', ({ participants: roomUsers, yourPeerId }) => {
      setMyPeerId(yourPeerId);
      const mapped: Participant[] = roomUsers.map((u: any, idx: number) => ({
        id: u.id,
        name: u.name,
        isHost: idx === 0,
        isMuted: u.isMuted,
        isCameraOff: u.isCameraOff,
        isScreenSharing: u.isScreenSharing,
        isHandRaised: u.isHandRaised,
        joinedAt: u.joinedAt,
      }));
      setParticipants(mapped);

      // Create WebRTC connections for existing peers
      roomUsers.forEach((peer: any) => {
        if (peer.id !== yourPeerId) {
          rtcManager.createPeerConnection(peer.id);
        }
      });
    });

    socket.on('user-joined', ({ peerId, participant }) => {
      setParticipants((prev) => [
        ...prev.filter((p) => p.id !== peerId),
        {
          id: participant.id,
          name: participant.name,
          isHost: false,
          isMuted: participant.isMuted,
          isCameraOff: participant.isCameraOff,
          isScreenSharing: false,
          isHandRaised: false,
          joinedAt: participant.joinedAt,
        },
      ]);

      // Initiate WebRTC offer to new peer
      rtcManager.createOffer(peerId).then((offer) => {
        socketService.sendOffer(peerId, offer);
      });
    });

    socket.on('webrtc-offer', async ({ fromPeerId, offer }) => {
      const answer = await rtcManager.handleOffer(fromPeerId, offer);
      socketService.sendAnswer(fromPeerId, answer);
    });

    socket.on('webrtc-answer', async ({ fromPeerId, answer }) => {
      await rtcManager.handleAnswer(fromPeerId, answer);
    });

    socket.on('webrtc-ice-candidate', async ({ fromPeerId, candidate }) => {
      await rtcManager.addIceCandidate(fromPeerId, candidate);
    });

    socket.on('user-updated', ({ peerId, updates }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === peerId ? { ...p, ...updates } : p))
      );
    });

    socket.on('reaction-received', ({ userName: senderName, emoji }) => {
      setActiveReaction({ emoji, userName: senderName });
      setTimeout(() => setActiveReaction(null), 3000);
    });

    socket.on('chat-message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('user-left', ({ peerId }) => {
      rtcManager.closePeerConnection(peerId);
      setParticipants((prev) => prev.filter((p) => p.id !== peerId));
    });

    // Set WebRTC Remote Stream Callbacks
    rtcManager.setCallbacks({
      onRemoteStream: (peerId, stream) => {
        setParticipants((prev) =>
          prev.map((p) => (p.id === peerId ? { ...p, stream } : p))
        );
      },
      onIceCandidate: (peerId, candidate) => {
        socketService.sendIceCandidate(peerId, candidate);
      },
    });

    return () => {
      socketService.leaveRoom(roomCode);
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('webrtc-offer');
      socket.off('webrtc-answer');
      socket.off('webrtc-ice-candidate');
      socket.off('user-updated');
      socket.off('reaction-received');
      socket.off('chat-message');
      socket.off('user-left');
    };
  }, [roomCode]);

  // Handle Local Mic Mute Toggle
  const handleToggleMic = () => {
    const nextState = !isMuted;
    setIsMuted(nextState);
    const localStream = rtcManager.getLocalStream();
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !nextState;
    }
    socketService.toggleAudio(nextState);
  };

  // Handle Local Cam Toggle
  const handleToggleCam = () => {
    const nextState = !isCameraOff;
    setIsCameraOff(nextState);
    const localStream = rtcManager.getLocalStream();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !nextState;
    }
    socketService.toggleVideo(nextState);
  };

  // Handle Screen Share Toggle
  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        await rtcManager.replaceVideoTrack(videoTrack);
        setIsScreenSharing(true);
        socketService.toggleScreenShare(true);

        videoTrack.onended = () => {
          handleStopScreenShare();
        };
      } catch (err) {
        console.warn('Screen share canceled or denied', err);
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const localStream = rtcManager.getLocalStream();
    const originalVideoTrack = localStream ? localStream.getVideoTracks()[0] : null;

    await rtcManager.replaceVideoTrack(originalVideoTrack);
    setIsScreenSharing(false);
    socketService.toggleScreenShare(false);
  };

  // Handle Hand Raise Toggle
  const handleToggleHand = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    socketService.toggleRaiseHand(nextState);
  };

  // Handle Reaction
  const handleSendEmoji = (emoji: string) => {
    socketService.sendReaction(emoji);
    setShowEmojiPicker(false);
  };

  // Copy Room Code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Format Timer
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? `${h}:` : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const myParticipant = participants.find((p) => p.id === myPeerId);

  return (
    <div className="flex h-screen bg-[#0A0F1D] text-slate-100 overflow-hidden select-none">
      
      {/* 1. LEFT NAVIGATION SIDEBAR */}
      <aside className="w-16 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 space-y-6 shrink-0 z-20">
        
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#008F67] to-[#00B981] flex items-center justify-center text-white shadow-md">
          <Video className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3 flex flex-col items-center">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 rounded-xl transition-all ${
              viewMode === 'grid'
                ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Stage Grid View"
          >
            <Grid className="w-5 h-5" />
          </button>

          <button
            onClick={() => setViewMode('mesh')}
            className={`p-3 rounded-xl transition-all ${
              viewMode === 'mesh'
                ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Node Mesh Topology"
          >
            <Network className="w-5 h-5" />
          </button>

          <button
            onClick={() => setViewMode('telemetry')}
            className={`p-3 rounded-xl transition-all ${
              viewMode === 'telemetry'
                ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Live WebRTC Telemetry"
          >
            <Activity className="w-5 h-5" />
          </button>

          <button
            onClick={() => setViewMode('crypto')}
            className={`p-3 rounded-xl transition-all ${
              viewMode === 'crypto'
                ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Crypto Vault & Security"
          >
            <Lock className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onLeave}
          className="p-3 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all"
          title="Leave Room"
        >
          <PhoneOff className="w-5 h-5" />
        </button>

      </aside>

      {/* 2. MAIN CENTER STAGE AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Header Status Bar */}
        <header className="h-14 px-6 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between text-xs font-mono shrink-0">
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span className="text-slate-400">Room:</span>
              <span className="text-white font-bold">{roomCode}</span>
              <button
                onClick={handleCopyCode}
                className="ml-1 text-slate-400 hover:text-emerald-400 transition-colors"
                title="Copy Room Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CONNECTED • 18ms • DTLS-SRTP</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-slate-800 px-3 py-1.5 rounded-xl text-slate-300 font-bold">
              {formatTime(meetingSeconds)}
            </span>
            
            <span className="flex items-center gap-1.5 bg-[#00B981]/10 text-[#00B981] px-3 py-1.5 rounded-xl border border-[#00B981]/30 font-bold">
              <Users className="w-3.5 h-3.5" />
              {participants.length} Online
            </span>
          </div>

        </header>

        {/* Reaction Floating Toast Banner */}
        {activeReaction && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900/90 border border-emerald-500/40 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-sm text-white animate-bounce">
            <span className="text-xl">{activeReaction.emoji}</span>
            <span className="font-semibold text-xs">{activeReaction.userName} reacted</span>
          </div>
        )}

        {/* Stage Viewport */}
        <main className="flex-1 p-4 overflow-hidden relative">
          
          {viewMode === 'grid' && (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
              
              {/* Local Participant Tile */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg group">
                {!isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <div className="w-16 h-16 rounded-full bg-[#008F67] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-semibold">{userName} (You)</span>
                  </div>
                )}

                {/* Hand Raised Indicator */}
                {isHandRaised && (
                  <div className="absolute top-3 right-3 bg-amber-400 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl shadow flex items-center gap-1">
                    <span>✋ Hand Raised</span>
                  </div>
                )}

                {/* Bottom Overlay Label */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center justify-between text-xs text-white">
                  <span className="font-bold flex items-center gap-1.5">
                    {userName} (You)
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    {isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>
              </div>

              {/* Remote Participants Tiles */}
              {participants
                .filter((p) => p.id !== myPeerId)
                .map((peer) => (
                  <div
                    key={peer.id}
                    className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg group"
                  >
                    {peer.stream && !peer.isCameraOff ? (
                      <video
                        ref={(el) => {
                          if (el && peer.stream) el.srcObject = peer.stream;
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg">
                          {peer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold">{peer.name}</span>
                      </div>
                    )}

                    {peer.isHandRaised && (
                      <div className="absolute top-3 right-3 bg-amber-400 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-xl shadow flex items-center gap-1">
                        <span>✋ Raised Hand</span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-center justify-between text-xs text-white">
                      <span className="font-bold">{peer.name}</span>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        {peer.isMuted && <MicOff className="w-3.5 h-3.5 text-red-400" />}
                      </div>
                    </div>
                  </div>
                ))}

            </div>
          )}

          {viewMode === 'mesh' && <NodeMeshVisualizer participants={participants} />}
          {viewMode === 'telemetry' && <TelemetryView />}
          {viewMode === 'crypto' && <CryptoVaultView roomCode={roomCode} isHost={true} />}

        </main>

        {/* 3. BOTTOM CONTROL TOOLBAR */}
        <footer className="h-20 px-6 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between z-20 shrink-0">
          
          {/* Left Room Info */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">AetherMeet P2P Mesh</span>
          </div>

          {/* Center Call Control Buttons */}
          <div className="flex items-center gap-3">
            
            {/* Mic Toggle */}
            <button
              onClick={handleToggleMic}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                isMuted
                  ? 'bg-red-500 text-white shadow-red-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={handleToggleCam}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                isCameraOff
                  ? 'bg-red-500 text-white shadow-red-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>

            {/* Screen Share Toggle */}
            <button
              onClick={handleToggleScreenShare}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                isScreenSharing
                  ? 'bg-[#00B981] text-white shadow-[#00B981]/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5" />
            </button>

            {/* Hand Raise Toggle */}
            <button
              onClick={handleToggleHand}
              className={`p-3.5 rounded-2xl transition-all shadow-md ${
                isHandRaised
                  ? 'bg-amber-400 text-slate-900 shadow-amber-400/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
              title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            >
              <Hand className="w-5 h-5" />
            </button>

            {/* Reaction Emoji Picker Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-2xl transition-all"
                title="Send Reaction"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 p-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex items-center gap-2 z-50">
                  {['👏', '👍', '🎉', '❤️', '🙋', '💡'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleSendEmoji(emoji)}
                      className="p-2 text-xl hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Leave Room Button */}
            <button
              onClick={onLeave}
              className="px-5 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">Leave</span>
            </button>

          </div>

          {/* Right Panels Toggle Buttons */}
          <div className="flex items-center gap-2">
            
            {/* AI Assistant Toggle */}
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className={`p-3 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                showAIAssistant
                  ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Gemini AI Assistant"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden lg:inline">AI Notes</span>
            </button>

            {/* Mesh Hub Toggle */}
            <button
              onClick={() => setShowMeshHub(!showMeshHub)}
              className={`p-3 rounded-2xl transition-all flex items-center gap-1.5 text-xs font-bold ${
                showMeshHub
                  ? 'bg-[#00B981] text-white shadow-md shadow-[#00B981]/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
              title="Chat & Participants"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="hidden lg:inline">Mesh Hub</span>
            </button>

          </div>

        </footer>

      </div>

      {/* 3. RIGHT SIDE PANELS */}
      {showMeshHub && (
        <MeshHub
          participants={participants}
          messages={chatMessages}
          currentUserId={myPeerId}
          isHost={true}
          onSendMessage={(text, attachment) => socketService.sendChatMessage(text, attachment)}
          onClose={() => setShowMeshHub(false)}
        />
      )}

      {showAIAssistant && (
        <AIAssistantPanel
          roomCode={roomCode}
          chatMessages={chatMessages.map((m) => `${m.senderName}: ${m.text}`)}
          onClose={() => setShowAIAssistant(false)}
        />
      )}

    </div>
  );
};
