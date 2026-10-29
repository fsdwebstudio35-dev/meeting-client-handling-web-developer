/**
 * WebRTC Peer Manager for AetherMeet
 * Implements low-latency Peer-to-Peer mesh signaling with STUN/TURN traversal
 */

export const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export class WebRTCManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  // Callbacks
  private onRemoteStreamCallback: ((peerId: string, stream: MediaStream) => void) | null = null;
  private onIceCandidateCallback: ((peerId: string, candidate: RTCIceCandidate) => void) | null = null;
  private onConnectionStateCallback: ((peerId: string, state: RTCPeerConnectionState) => void) | null = null;

  constructor() {}

  public setCallbacks(handlers: {
    onRemoteStream: (peerId: string, stream: MediaStream) => void;
    onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
    onConnectionState?: (peerId: string, state: RTCPeerConnectionState) => void;
  }) {
    this.onRemoteStreamCallback = handlers.onRemoteStream;
    this.onIceCandidateCallback = handlers.onIceCandidate;
    this.onConnectionStateCallback = handlers.onConnectionState || null;
  }

  public setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    this.setupAudioAnalyser(stream);
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public createPeerConnection(peerId: string): RTCPeerConnection {
    if (this.peerConnections.has(peerId)) {
      this.closePeerConnection(peerId);
    }

    const pc = new RTCPeerConnection(STUN_SERVERS);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming remote media stream
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(peerId, event.streams[0]);
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(peerId, event.candidate);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(peerId, pc.connectionState);
      }
    };

    this.peerConnections.set(peerId, pc);
    return pc;
  }

  public async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = this.createPeerConnection(peerId);
    }

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    });
    await pc.setLocalDescription(offer);
    return offer;
  }

  public async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = this.createPeerConnection(peerId);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    return answer;
  }

  public async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  public async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn(`ICE candidate error for peer ${peerId}:`, err);
      }
    }
  }

  public async replaceVideoTrack(newVideoTrack: MediaStreamTrack | null): Promise<void> {
    this.peerConnections.forEach(async (pc) => {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      } else if (newVideoTrack && this.localStream) {
        pc.addTrack(newVideoTrack, this.localStream);
      }
    });
  }

  public async replaceAudioTrack(newAudioTrack: MediaStreamTrack | null): Promise<void> {
    this.peerConnections.forEach(async (pc) => {
      const senders = pc.getSenders();
      const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
      if (audioSender) {
        await audioSender.replaceTrack(newAudioTrack);
      } else if (newAudioTrack && this.localStream) {
        pc.addTrack(newAudioTrack, this.localStream);
      }
    });
  }

  private setupAudioAnalyser(stream: MediaStream) {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack) return;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioContext.createAnalyser();
      this.audioAnalyser.fftSize = 64;
      source.connect(this.audioAnalyser);
    } catch (e) {
      console.warn('AudioAnalyser setup skipped', e);
    }
  }

  public getAudioLevel(): number {
    if (!this.audioAnalyser) return 0;
    const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
    this.audioAnalyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(100, Math.round((avg / 128) * 100));
  }

  public getStats(peerId: string): Promise<RTCStatsReport | null> {
    const pc = this.peerConnections.get(peerId);
    if (!pc) return Promise.resolve(null);
    return pc.getStats();
  }

  public closePeerConnection(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
  }

  public closeAll() {
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((t) => t.stop());
      this.screenStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  }
}

export const rtcManager = new WebRTCManager();
