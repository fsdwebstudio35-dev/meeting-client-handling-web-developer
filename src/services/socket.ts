import { io, Socket } from 'socket.io-client';
import { ChatMessage, Participant } from '../types';

class SocketService {
  private socket: Socket | null = null;

  public connect(): Socket {
    if (!this.socket) {
      this.socket = io(window.location.origin, {
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public joinRoom(params: {
    roomCode: string;
    userName: string;
    isMuted: boolean;
    isCameraOff: boolean;
  }) {
    if (!this.socket) this.connect();
    this.socket?.emit('join-room', params);
  }

  public leaveRoom(roomCode: string) {
    this.socket?.emit('leave-room', { roomCode });
  }

  public toggleAudio(isMuted: boolean) {
    this.socket?.emit('toggle-audio', { isMuted });
  }

  public toggleVideo(isCameraOff: boolean) {
    this.socket?.emit('toggle-video', { isCameraOff });
  }

  public toggleScreenShare(isScreenSharing: boolean) {
    this.socket?.emit('toggle-screen-share', { isScreenSharing });
  }

  public toggleRaiseHand(isHandRaised: boolean) {
    this.socket?.emit('toggle-raise-hand', { isHandRaised });
  }

  public sendReaction(emoji: string) {
    this.socket?.emit('send-reaction', { emoji });
  }

  public sendChatMessage(text: string, attachment?: any) {
    this.socket?.emit('send-chat-message', { text, attachment });
  }

  // WebRTC Signaling
  public sendOffer(toPeerId: string, offer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc-offer', { toPeerId, offer });
  }

  public sendAnswer(toPeerId: string, answer: RTCSessionDescriptionInit) {
    this.socket?.emit('webrtc-answer', { toPeerId, answer });
  }

  public sendIceCandidate(toPeerId: string, candidate: RTCIceCandidate) {
    this.socket?.emit('webrtc-ice-candidate', { toPeerId, candidate });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
