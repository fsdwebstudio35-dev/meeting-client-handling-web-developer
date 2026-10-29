import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, Copy, Check, UserCheck, AlertOctagon } from 'lucide-react';

interface CryptoVaultViewProps {
  roomCode: string;
  isHost: boolean;
}

export const CryptoVaultView: React.FC<CryptoVaultViewProps> = ({ roomCode, isHost }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  const mockSecurityToken = `dtls_srtp_aether_hash_${roomCode.replaceAll('-', '')}_2026_x893`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(mockSecurityToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="w-full h-full p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-6 overflow-y-auto">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Crypto Vault</span>
          <h3 className="text-lg font-bold">DTLS-SRTP Security & Room Governance</h3>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Transport Encrypted</span>
        </div>
      </div>

      {/* Security Cards */}
      <div className="space-y-4">
        
        {/* Card 1: Transport Encryption Status */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Lock className="w-4 h-4" />
            <span>DTLS-SRTP Media Channel Encryption</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Audio and video packet payloads are encrypted in-flight using DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-time Transport Protocol). Direct peer keys are exchanged securely during DTLS handshake.
          </p>
        </div>

        {/* Card 2: Security Token */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2 font-mono text-xs">
          <span className="text-slate-400 block text-[11px]">Room Encryption Handshake Token</span>
          <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-700">
            <span className="text-slate-300 truncate max-w-[280px]">{mockSecurityToken}</span>
            <button
              onClick={handleCopyToken}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Copy Security Token"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-[#00B981]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Card 3: Host Lock Room Control */}
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">Lock Meeting Room</span>
            <span className="text-[11px] text-slate-400 block">Prevent new participants from joining without host approval</span>
          </div>

          <button
            onClick={() => setIsLocked(!isLocked)}
            disabled={!isHost}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              isLocked
                ? 'bg-red-500 text-white'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isLocked ? 'Room Locked' : 'Room Unlocked'}
          </button>
        </div>

      </div>

    </div>
  );
};
