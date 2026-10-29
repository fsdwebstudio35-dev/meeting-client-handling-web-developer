import React, { useEffect, useRef, useState } from 'react';
import { 
  Camera, Mic, MicOff, Video, VideoOff, Volume2, X, Check, Copy, Sparkles, AlertTriangle, ArrowRight 
} from 'lucide-react';
import { rtcManager } from '../services/webrtc';

interface PreMeetingModalProps {
  roomCode: string;
  initialName?: string;
  onJoin: (params: { userName: string; isMuted: boolean; isCameraOff: boolean; stream: MediaStream | null }) => void;
  onCancel: () => void;
}

export const PreMeetingModal: React.FC<PreMeetingModalProps> = ({
  roomCode,
  initialName = '',
  onJoin,
  onCancel,
}) => {
  const [name, setName] = useState(initialName || `User-${Math.floor(100 + Math.random() * 900)}`);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>('');
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const levelIntervalRef = useRef<any>(null);

  useEffect(() => {
    startMediaPreview();
    return () => {
      stopMediaPreview();
    };
  }, []);

  useEffect(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !isCameraOff;

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !isMuted;
    }
  }, [isCameraOff, isMuted]);

  const startMediaPreview = async (camId?: string, micId?: string) => {
    try {
      setPermissionError(null);
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: camId ? { deviceId: { exact: camId } } : true,
        audio: micId ? { deviceId: { exact: micId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      rtcManager.setLocalStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate devices once permission granted
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices(allDevices);

      const cams = allDevices.filter((d) => d.kind === 'videoinput');
      const mics = allDevices.filter((d) => d.kind === 'audioinput');
      const speakers = allDevices.filter((d) => d.kind === 'audiooutput');

      if (cams.length && !selectedCam) setSelectedCam(cams[0].deviceId);
      if (mics.length && !selectedMic) setSelectedMic(mics[0].deviceId);
      if (speakers.length && !selectedSpeaker) setSelectedSpeaker(speakers[0].deviceId);

      // Start mic level analyzer
      clearInterval(levelIntervalRef.current);
      levelIntervalRef.current = setInterval(() => {
        if (!isMuted) {
          setMicLevel(rtcManager.getAudioLevel());
        } else {
          setMicLevel(0);
        }
      }, 100);

    } catch (err: any) {
      console.warn('Camera/Mic permission error:', err);
      setPermissionError('Camera or Microphone access was denied or not found. You can still join as a viewer.');
    }
  };

  const stopMediaPreview = () => {
    if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const handleDeviceChange = (type: 'cam' | 'mic', deviceId: string) => {
    if (type === 'cam') {
      setSelectedCam(deviceId);
      startMediaPreview(deviceId, selectedMic);
    } else {
      setSelectedMic(deviceId);
      startMediaPreview(selectedCam, deviceId);
    }
  };

  const playTestSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio test failed', e);
    }
  };

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}?room=${roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleJoinClick = () => {
    onJoin({
      userName: name.trim() || 'Guest Participant',
      isMuted,
      isCameraOff,
      stream: localStreamRef.current,
    });
  };

  const cams = devices.filter((d) => d.kind === 'videoinput');
  const mics = devices.filter((d) => d.kind === 'audioinput');
  const speakers = devices.filter((d) => d.kind === 'audiooutput');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl border border-[#DFE7F0] dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-[#DFE7F0] dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono text-[#00B981] font-bold uppercase tracking-wider block">Pre-Meeting Setup</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Joining Room: {roomCode}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">

          {permissionError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Camera Preview Box */}
          <div className="relative aspect-video rounded-2xl bg-slate-900 overflow-hidden border border-slate-700 shadow-inner group">
            {!isCameraOff && !permissionError ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <VideoOff className="w-10 h-10 text-slate-600" />
                <span className="text-xs font-medium">Camera is disabled or unavailable</span>
              </div>
            )}

            {/* Mic level bar overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur px-3 py-2 rounded-xl text-xs text-white">
              <div className="flex items-center gap-2">
                {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-[#00B981]" />}
                <div className="w-24 sm:w-36 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00B981] transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
              </div>

              {/* Toggle Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                    isMuted ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => setIsCameraOff(!isCameraOff)}
                  className={`p-2 rounded-lg text-xs font-semibold transition-colors ${
                    isCameraOff ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  title={isCameraOff ? 'Turn Camera On' : 'Turn Camera Off'}
                >
                  {isCameraOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={playTestSound}
                  className="px-2.5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg font-medium flex items-center gap-1 transition-colors"
                  title="Test Speaker Output"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Test Sound</span>
                </button>
              </div>
            </div>
          </div>

          {/* Device Controls & Display Name Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Display Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Your Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter display name..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-[#00B981] focus:outline-none"
              />
            </div>

            {/* Camera Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-[#00B981]" />
                Camera Device
              </label>
              <select
                value={selectedCam}
                onChange={(e) => handleDeviceChange('cam', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none"
              >
                {cams.length ? (
                  cams.map((c) => (
                    <option key={c.deviceId} value={c.deviceId}>
                      {c.label || `Camera ${c.deviceId.slice(0, 5)}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Camera</option>
                )}
              </select>
            </div>

            {/* Microphone Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Mic className="w-3.5 h-3.5 text-[#00B981]" />
                Microphone Device
              </label>
              <select
                value={selectedMic}
                onChange={(e) => handleDeviceChange('mic', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none"
              >
                {mics.length ? (
                  mics.map((m) => (
                    <option key={m.deviceId} value={m.deviceId}>
                      {m.label || `Microphone ${m.deviceId.slice(0, 5)}`}
                    </option>
                  ))
                ) : (
                  <option value="">Default Microphone</option>
                )}
              </select>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-[#DFE7F0] dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            onClick={handleCopyInvite}
            className="px-4 py-2.5 rounded-xl border border-[#DFE7F0] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#00B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <button
            onClick={handleJoinClick}
            disabled={!name.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#008F67] to-[#00B981] hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-[#00B981]/20 transition-all flex items-center gap-2"
          >
            <span>Join Meeting Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
