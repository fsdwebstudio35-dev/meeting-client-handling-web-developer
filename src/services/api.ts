import { AuthState, AISummaryResult, MeetingRecord, RoomDetails, User } from '../types';

const API_BASE = '';

export function getAuthToken(): string | null {
  return localStorage.getItem('aethermeet_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('aethermeet_token', token);
  } else {
    localStorage.removeItem('aethermeet_token');
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'API Request failed');
  }
  return data;
}

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const data = await fetchWithAuth('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data;
}

export async function registerUser(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
  const data = await fetchWithAuth('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  setAuthToken(data.token);
  return data;
}

export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const data = await fetchWithAuth('/api/auth/me');
    return data.user;
  } catch (err) {
    setAuthToken(null);
    return null;
  }
}

export async function createRoom(title?: string): Promise<RoomDetails> {
  const data = await fetchWithAuth('/api/rooms/create', {
    method: 'POST',
    body: JSON.stringify({ title: title || 'AetherMeet Session' }),
  });
  return data.room;
}

export async function getRoomDetails(code: string): Promise<RoomDetails> {
  const data = await fetchWithAuth(`/api/rooms/${code}`);
  return data.room;
}

export async function fetchMeetingHistory(): Promise<MeetingRecord[]> {
  try {
    const data = await fetchWithAuth('/api/meetings/history');
    return data.history;
  } catch (err) {
    return [];
  }
}

export async function generateAISummary(params: {
  roomCode: string;
  chatTranscript: string[];
  captionsTranscript: string[];
}): Promise<AISummaryResult> {
  const data = await fetchWithAuth('/api/ai/summarize', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return data.result;
}
