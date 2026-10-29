import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { PreMeetingModal } from './components/PreMeetingModal';
import { MeetingRoom } from './components/MeetingRoom';
import { AuthModal } from './components/AuthModal';
import { MeetingRecord, User } from './types';
import { createRoom, fetchCurrentUser, fetchMeetingHistory, setAuthToken } from './services/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<'landing' | 'premeeting' | 'room'>('landing');
  
  const [activeRoomCode, setActiveRoomCode] = useState<string>('');
  const [premeetingName, setPremeetingName] = useState<string>('');
  const [premeetingParams, setPremeetingParams] = useState<{
    userName: string;
    isMuted: boolean;
    isCameraOff: boolean;
    stream: MediaStream | null;
  } | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [meetingHistory, setMeetingHistory] = useState<MeetingRecord[]>([]);

  // On mount: sync dark mode class & load current user and meeting history
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    loadUser();
    loadHistory();

    // Check URL parameters for ?room=code
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setActiveRoomCode(roomParam);
      setCurrentView('premeeting');
    }
  }, []);

  const loadUser = async () => {
    const u = await fetchCurrentUser();
    setUser(u);
    if (u) setPremeetingName(u.name);
  };

  const loadHistory = async () => {
    const history = await fetchMeetingHistory();
    setMeetingHistory(history);
  };

  const handleStartInstantMeeting = async () => {
    try {
      const room = await createRoom('Instant Holographic Collaboration');
      setActiveRoomCode(room.code);
      setCurrentView('premeeting');
    } catch (err) {
      console.error('Failed to create room', err);
      // Fallback code
      const fallbackCode = `aether-${Math.floor(1000 + Math.random() * 9000)}-x1`;
      setActiveRoomCode(fallbackCode);
      setCurrentView('premeeting');
    }
  };

  const handleJoinRoomPrompt = () => {
    const code = window.prompt('Enter AetherMeet Room Code (e.g. aether-demo-100):');
    if (code && code.trim()) {
      setActiveRoomCode(code.trim());
      setCurrentView('premeeting');
    }
  };

  const handleQuickJoin = (code: string) => {
    setActiveRoomCode(code);
    setCurrentView('premeeting');
  };

  const handlePremeetingJoin = (params: {
    userName: string;
    isMuted: boolean;
    isCameraOff: boolean;
    stream: MediaStream | null;
  }) => {
    setPremeetingParams(params);
    setCurrentView('room');
  };

  const handleLeaveRoom = () => {
    setCurrentView('landing');
    setPremeetingParams(null);
    loadHistory();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
  };

  const handleNavigateSection = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] dark:bg-[#0A0F1D] text-[#172238] dark:text-slate-100 transition-colors">
      
      {/* Show Header only on Landing page */}
      {currentView === 'landing' && (
        <Header
          user={user}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onQuickJoin={handleQuickJoin}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onNavigateSection={handleNavigateSection}
        />
      )}

      {/* Main Views */}
      {currentView === 'landing' && (
        <LandingPage
          onStartInstantMeeting={handleStartInstantMeeting}
          onJoinMeetingPrompt={handleJoinRoomPrompt}
          history={meetingHistory}
          onSelectHistoryMeeting={(rec) => {
            setActiveRoomCode(rec.roomCode);
            setCurrentView('premeeting');
          }}
        />
      )}

      {currentView === 'premeeting' && (
        <PreMeetingModal
          roomCode={activeRoomCode}
          initialName={user?.name || premeetingName}
          onJoin={handlePremeetingJoin}
          onCancel={() => setCurrentView('landing')}
        />
      )}

      {currentView === 'room' && premeetingParams && (
        <MeetingRoom
          roomCode={activeRoomCode}
          userName={premeetingParams.userName}
          initialMuted={premeetingParams.isMuted}
          initialCameraOff={premeetingParams.isCameraOff}
          initialStream={premeetingParams.stream}
          onLeave={handleLeaveRoom}
        />
      )}

      {/* Auth Modal */}
      {authModalOpen && (
        <AuthModal
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setPremeetingName(loggedInUser.name);
            setAuthModalOpen(false);
          }}
          onClose={() => setAuthModalOpen(false)}
        />
      )}

    </div>
  );
}
