import React, { useEffect, useState } from 'react';
import { Activity, Wifi, Shield, Cpu, Gauge } from 'lucide-react';
import { TelemetryData } from '../types';

export const TelemetryView: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    rttMs: 18,
    bitrateInKbps: 2450,
    bitrateOutKbps: 1890,
    fps: 60,
    resolution: '1920x1080',
    packetLossPercent: 0.0,
    iceState: 'connected',
  });

  // Simulate real live network telemetry fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        rttMs: Math.max(12, Math.min(35, prev.rttMs + Math.floor((Math.random() - 0.5) * 4))),
        bitrateInKbps: Math.max(1800, Math.min(3200, prev.bitrateInKbps + Math.floor((Math.random() - 0.5) * 120))),
        bitrateOutKbps: Math.max(1400, Math.min(2500, prev.bitrateOutKbps + Math.floor((Math.random() - 0.5) * 90))),
        fps: 60,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-6 overflow-y-auto">
      
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">Network Telemetry</span>
          <h3 className="text-lg font-bold">Real-Time WebRTC Media Diagnostics</h3>
        </div>
        <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>STUN Traversal Nominal</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        
        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
          <span className="text-[11px] text-slate-400 block font-sans">Round-Trip Time</span>
          <span className="text-xl font-bold text-white tracking-tight">{telemetry.rttMs} ms</span>
          <span className="text-[10px] text-emerald-400 block">Sub-20ms Ultra Low</span>
        </div>

        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
          <span className="text-[11px] text-slate-400 block font-sans">Inbound Bitrate</span>
          <span className="text-xl font-bold text-[#00B981] tracking-tight">{(telemetry.bitrateInKbps / 1000).toFixed(2)} Mbps</span>
          <span className="text-[10px] text-slate-400 block">{telemetry.resolution}</span>
        </div>

        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
          <span className="text-[11px] text-slate-400 block font-sans">Outbound Bitrate</span>
          <span className="text-xl font-bold text-emerald-400 tracking-tight">{(telemetry.bitrateOutKbps / 1000).toFixed(2)} Mbps</span>
          <span className="text-[10px] text-slate-400 block">{telemetry.fps} FPS VP8</span>
        </div>

        <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
          <span className="text-[11px] text-slate-400 block font-sans">Packet Loss</span>
          <span className="text-xl font-bold text-white tracking-tight">{telemetry.packetLossPercent.toFixed(1)}%</span>
          <span className="text-[10px] text-emerald-400 block">Zero Degradation</span>
        </div>

      </div>

      {/* Simulated Live Bandwidth Graph Bar */}
      <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-3 font-mono">
        <div className="flex items-center justify-between text-xs text-slate-300 font-sans">
          <span className="font-bold flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Adaptive Bandwidth Allocation
          </span>
          <span className="text-emerald-400">Optimal Connection</span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Video Channel (1080p 60fps)</span>
              <span>{(telemetry.bitrateInKbps / 10).toFixed(0)}% Capacity</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#008F67] to-[#00B981] transition-all duration-500"
                style={{ width: `${Math.min(100, telemetry.bitrateInKbps / 30)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Opus Audio Channel (48kHz Stereo)</span>
              <span>128 Kbps</span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-1/4 rounded-full" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
