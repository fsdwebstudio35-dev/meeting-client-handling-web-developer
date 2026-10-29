export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export interface Participant {
  id: string; // socket.id or user.id
  name: string;
  avatar?: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  audioLevel?: number;
  pingMs?: number;
  joinedAt: number;
  stream?: MediaStream;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  attachment?: {
    name: string;
    size: number;
    type: string;
    url: string;
  };
}

export interface RoomDetails {
  id: string;
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  createdAt: string;
  isLocked: boolean;
  participantsCount: number;
}

export interface MeetingRecord {
  id: string;
  roomCode: string;
  title: string;
  date: string;
  durationSeconds: number;
  participantCount: number;
  summary?: string;
  actionItems?: string[];
  notes?: string[];
}

export interface AISummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: { task: string; assignee?: string; priority: 'High' | 'Medium' | 'Low' }[];
  suggestedNotes: string[];
}

export interface TelemetryData {
  rttMs: number;
  bitrateInKbps: number;
  bitrateOutKbps: number;
  fps: number;
  resolution: string;
  packetLossPercent: number;
  iceState: string;
}

export type DashboardViewMode = 'grid' | 'mesh' | 'telemetry' | 'crypto';
