import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'aethermeet-super-secret-key-2026';
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory and db.json exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBData {
  users: Array<{ id: string; name: string; email: string; passwordHash: string; avatar?: string }>;
  rooms: Array<{ id: string; code: string; title: string; hostId: string; hostName: string; createdAt: string; isLocked: boolean }>;
  meetings: Array<{ id: string; roomCode: string; title: string; date: string; durationSeconds: number; participantCount: number; summary?: string; actionItems?: string[]; notes?: string[] }>;
}

function loadDB(): DBData {
  if (!fs.existsSync(DB_FILE)) {
    const initialData: DBData = {
      users: [],
      rooms: [
        {
          id: 'room-demo-1',
          code: 'aether-demo-100',
          title: 'Holographic Mesh Architecture Sync',
          hostId: 'system-host',
          hostName: 'Dr. Elena Vance',
          createdAt: new Date().toISOString(),
          isLocked: false,
        },
      ],
      meetings: [
        {
          id: 'meet-prev-1',
          roomCode: 'aether-demo-100',
          title: 'WebRTC Low-Latency Optimization',
          date: '2026-10-28 14:30',
          durationSeconds: 2140,
          participantCount: 6,
          summary: 'Reviewed STUN/TURN traversal metrics and finalized peer mesh candidate filtering.',
          actionItems: ['Deploy updated TURN TURN-relays in US-East', 'Implement frame degradation fallback on packet loss'],
          notes: ['Target latency maintained under 20ms across 8 peers.'],
        },
      ],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB, re-initializing...', err);
    return { users: [], rooms: [], meetings: [] };
  }
}

function saveDB(data: DBData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const app = express();
app.use(express.json({ limit: '10mb' }));

const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
  },
});

// Middleware to verify Auth Token
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    (req as any).user = decoded;
    next();
  });
}

// REST Endpoints
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  const db = loadDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ message: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name,
    email,
    passwordHash,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
  };

  db.users.push(newUser);
  saveDB(db);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    user: { id: newUser.id, name: newUser.name, email: newUser.email, avatar: newUser.avatar },
    token,
  });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    token,
  });
});

app.get('/api/auth/me', authenticateToken, (req: Request, res: Response) => {
  const userPayload = (req as any).user;
  const db = loadDB();
  const user = db.users.find((u) => u.id === userPayload.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.json({
    user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
  });
});

app.post('/api/rooms/create', (req: Request, res: Response) => {
  const { title } = req.body;
  const userPayload = (req as any).user || { id: 'guest', name: 'Guest User' };

  const db = loadDB();
  const roomCode = `aether-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5)}`;
  const newRoom = {
    id: `room_${Date.now()}`,
    code: roomCode,
    title: title || 'AetherMeet Collaboration Room',
    hostId: userPayload.id,
    hostName: userPayload.name,
    createdAt: new Date().toISOString(),
    isLocked: false,
  };

  db.rooms.push(newRoom);
  saveDB(db);

  return res.json({ room: newRoom });
});

app.get('/api/rooms/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const db = loadDB();
  let room = db.rooms.find((r) => r.code === code);

  if (!room) {
    // Dynamically instantiate if valid code format
    room = {
      id: `room_${Date.now()}`,
      code,
      title: `AetherMeet Room (${code})`,
      hostId: 'host-guest',
      hostName: 'Host Participant',
      createdAt: new Date().toISOString(),
      isLocked: false,
    };
    db.rooms.push(room);
    saveDB(db);
  }

  return res.json({ room });
});

app.get('/api/meetings/history', (req: Request, res: Response) => {
  const db = loadDB();
  return res.json({ history: db.meetings });
});

app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  const { roomCode, chatTranscript, captionsTranscript } = req.body;

  if (!ai) {
    return res.json({
      result: {
        summary: 'Gemini AI API key is not configured in environment variables. Simulated AI processing disabled.',
        keyPoints: ['No active GEMINI_API_KEY detected.'],
        actionItems: [{ task: 'Configure GEMINI_API_KEY in Secrets panel to enable real AI summarization.', priority: 'High' }],
        suggestedNotes: ['AI capabilities require server-side Gemini key.'],
      },
    });
  }

  try {
    const combinedContext = [
      'Meeting Captions:',
      ...(captionsTranscript || []),
      'Chat Messages:',
      ...(chatTranscript || []),
    ].join('\n');

    const prompt = `Analyze the following meeting transcript and chat logs from AetherMeet room ${roomCode}.
Return a JSON object containing:
1. "summary": A concise executive summary paragraph.
2. "keyPoints": Array of key discussion points.
3. "actionItems": Array of objects with "task", "assignee", and "priority" ("High" | "Medium" | "Low").
4. "suggestedNotes": Array of key takeaways or agenda notes.

Transcript:
${combinedContext || 'No dialogue or chat recorded.'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ result: parsed });
  } catch (err: any) {
    console.error('Gemini AI error:', err);
    return res.status(500).json({ message: 'Failed to generate AI summary', error: err.message });
  }
});

// Socket.IO Room & WebRTC Mesh Signaling Engine
interface RoomSocketState {
  id: string;
  name: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: number;
}

const activeRooms: Map<string, Map<string, RoomSocketState>> = new Map();

io.on('connection', (socket) => {
  let currentRoomCode: string | null = null;

  socket.on('join-room', ({ roomCode, userName, isMuted, isCameraOff }) => {
    currentRoomCode = roomCode;
    socket.join(roomCode);

    if (!activeRooms.has(roomCode)) {
      activeRooms.set(roomCode, new Map());
    }

    const roomParticipants = activeRooms.get(roomCode)!;
    const participantState: RoomSocketState = {
      id: socket.id,
      name: userName || `User-${socket.id.substring(0, 4)}`,
      isMuted: !!isMuted,
      isCameraOff: !!isCameraOff,
      isScreenSharing: false,
      isHandRaised: false,
      joinedAt: Date.now(),
    };

    roomParticipants.set(socket.id, participantState);

    // Notify existing peers about the new user
    socket.to(roomCode).emit('user-joined', {
      peerId: socket.id,
      participant: participantState,
    });

    // Send list of all current participants in the room to the newly joined client
    const allParticipants = Array.from(roomParticipants.values());
    socket.emit('room-users', { participants: allParticipants, yourPeerId: socket.id });
  });

  socket.on('webrtc-offer', ({ toPeerId, offer }) => {
    io.to(toPeerId).emit('webrtc-offer', {
      fromPeerId: socket.id,
      offer,
    });
  });

  socket.on('webrtc-answer', ({ toPeerId, answer }) => {
    io.to(toPeerId).emit('webrtc-answer', {
      fromPeerId: socket.id,
      answer,
    });
  });

  socket.on('webrtc-ice-candidate', ({ toPeerId, candidate }) => {
    io.to(toPeerId).emit('webrtc-ice-candidate', {
      fromPeerId: socket.id,
      candidate,
    });
  });

  socket.on('toggle-audio', ({ isMuted }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        user.isMuted = isMuted;
        io.to(currentRoomCode).emit('user-updated', { peerId: socket.id, updates: { isMuted } });
      }
    }
  });

  socket.on('toggle-video', ({ isCameraOff }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        user.isCameraOff = isCameraOff;
        io.to(currentRoomCode).emit('user-updated', { peerId: socket.id, updates: { isCameraOff } });
      }
    }
  });

  socket.on('toggle-screen-share', ({ isScreenSharing }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        user.isScreenSharing = isScreenSharing;
        io.to(currentRoomCode).emit('user-updated', { peerId: socket.id, updates: { isScreenSharing } });
      }
    }
  });

  socket.on('toggle-raise-hand', ({ isHandRaised }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        user.isHandRaised = isHandRaised;
        io.to(currentRoomCode).emit('user-updated', { peerId: socket.id, updates: { isHandRaised } });
      }
    }
  });

  socket.on('send-reaction', ({ emoji }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        io.to(currentRoomCode).emit('reaction-received', {
          peerId: socket.id,
          userName: user.name,
          emoji,
        });
      }
    }
  });

  socket.on('send-chat-message', ({ text, attachment }) => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      const user = room.get(socket.id);
      if (user) {
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          senderId: socket.id,
          senderName: user.name,
          text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment,
        };
        io.to(currentRoomCode).emit('chat-message', message);
      }
    }
  });

  socket.on('leave-room', () => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      room.delete(socket.id);
      if (room.size === 0) {
        activeRooms.delete(currentRoomCode);
      } else {
        io.to(currentRoomCode).emit('user-left', { peerId: socket.id });
      }
      socket.leave(currentRoomCode);
      currentRoomCode = null;
    }
  });

  socket.on('disconnect', () => {
    if (currentRoomCode && activeRooms.has(currentRoomCode)) {
      const room = activeRooms.get(currentRoomCode)!;
      room.delete(socket.id);
      if (room.size === 0) {
        activeRooms.delete(currentRoomCode);
      } else {
        io.to(currentRoomCode).emit('user-left', { peerId: socket.id });
      }
    }
  });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, () => {
    console.log(`>>> AetherMeet Server listening on http://localhost:${PORT}`);
  });
}

startServer();
