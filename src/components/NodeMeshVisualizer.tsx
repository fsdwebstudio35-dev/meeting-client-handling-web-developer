import React, { useEffect, useRef } from 'react';
import { Participant } from '../types';

interface NodeMeshVisualizerProps {
  participants: Participant[];
}

export const NodeMeshVisualizer: React.FC<NodeMeshVisualizerProps> = ({ participants }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 50;

      const total = Math.max(participants.length, 3);
      const nodePositions: Array<{ x: number; y: number; name: string; isHost: boolean }> = [];

      // Calculate node coordinates around circle
      for (let i = 0; i < total; i++) {
        const theta = (i * 2 * Math.PI) / total + angle;
        const x = centerX + radius * Math.cos(theta);
        const y = centerY + radius * Math.sin(theta);
        const name = participants[i]?.name || `Node ${i + 1}`;
        const isHost = participants[i]?.isHost || i === 0;
        nodePositions.push({ x, y, name, isHost });
      }

      // Draw mesh connection lines between all peer pairs
      for (let i = 0; i < nodePositions.length; i++) {
        for (let j = i + 1; j < nodePositions.length; j++) {
          const p1 = nodePositions[i];
          const p2 = nodePositions[j];

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = 'rgba(0, 185, 129, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Pulse packet along line
          const progress = (Date.now() / 2000 + i + j) % 1;
          const px = p1.x + (p2.x - p1.x) * progress;
          const py = p1.y + (p2.y - p1.y) * progress;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = '#00B981';
          ctx.fill();
        }
      }

      // Draw node points and labels
      nodePositions.forEach((pos) => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, pos.isHost ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = pos.isHost ? '#00B981' : '#008F67';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();

        ctx.fillStyle = '#94A3B8';
        ctx.font = '11px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pos.name, pos.x, pos.y + 20);
      });

      angle += 0.0015;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [participants]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-4">
      <div className="text-center">
        <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-widest">WebRTC Node Topology</span>
        <h3 className="text-lg font-bold">Peer-to-Peer Full Mesh Graph</h3>
        <p className="text-xs text-slate-400">Direct audio/video data channels between all active peers</p>
      </div>

      <div className="w-full max-w-md aspect-square relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#00B981]" />
          <span>Active Peer Node</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-[#00B981]/50" />
          <span>DTLS Channel</span>
        </div>
      </div>
    </div>
  );
};
