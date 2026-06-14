import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { 
  ArrowLeft, 
  Send, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  PhoneOff, 
  MessageSquare,
  Sparkles,
  Play,
  Volume2
} from 'lucide-react';

const Interview = () => {
  const [role, setRole] = useState('Frontend Developer');
  const [recruiterMode, setRecruiterMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Real audio/video streaming states
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [screenShare, setScreenShare] = useState(false);
  
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // Voice recognition (Speech-to-Text) states
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const localVideoRef = useRef(null);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Request camera and microphone access
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' }, 
        audio: true 
      });
      setMediaStream(stream);
      setCameraOn(true);
      setMuted(false);
    } catch (err) {
      console.error("Webcam access failed:", err);
      alert("Could not access camera/microphone. Visual indicators will fall back, but you can continue answering text questions.");
      setCameraOn(false);
    }
  };

  // Turn off all active hardware tracks
  const stopAllTracks = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
    setCameraOn(false);
    setScreenShare(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Helper to trigger real-time AI text and spoken responses to user actions
  const triggerAIReaction = (text) => {
    setHistory(prev => [...prev, { role: 'assistant', content: text }]);
    speakText(text);
  };

  // Mute/Unmute microphone
  const toggleMute = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const newMuted = !audioTrack.enabled;
        setMuted(newMuted);
        
        if (newMuted) {
          triggerAIReaction("I notice your microphone is currently muted. Please unmute yourself when you're ready to answer the question.");
        } else {
          triggerAIReaction("Thank you. I can hear your microphone feed clearly now.");
        }
      }
    }
  };

  // Enable/Disable webcam capture
  const toggleCamera = () => {
    if (mediaStream && !screenShare) {
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const newCameraOn = videoTrack.enabled;
        setCameraOn(newCameraOn);
        
        if (!newCameraOn) {
          triggerAIReaction("I notice your camera feed is inactive. For a professional assessment experience, I recommend keeping your webcam enabled.");
        } else {
          triggerAIReaction("Thank you. Your primary camera feed is back online.");
        }
      }
    }
  };

  // Request screen capture using browser display media API
  const toggleScreenShare = async () => {
    if (!screenShare) {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setScreenShare(true);
        triggerAIReaction("Excellent, I can see your screen sharing stream now. Please walk me through your desktop view.");

        // Handle native stop sharing button click in browser
        stream.getVideoTracks()[0].onended = () => {
          handleStopScreenShare(stream);
        };
      } catch (err) {
        console.error("Screen capture failed:", err);
      }
    } else {
      handleStopScreenShare();
    }
  };

  const handleStopScreenShare = (streamToStop = screenStream) => {
    if (streamToStop) {
      streamToStop.getTracks().forEach(t => t.stop());
    }
    setScreenStream(null);
    setScreenShare(false);
    triggerAIReaction("You have stopped screen sharing. Restoring your primary camera view.");
  };

  // Voice Input (Speech-to-Text transcribing)
  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition. Please type your answers.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + resultText);
    };

    rec.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Text-to-Speech (Speak Interviewer questions)
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Remove call-control strings
      const cleaned = text.replace(/Click "Disconnect Call"|Click "End & Score"|Click "End Interview"/gi, '');
      const utterance = new SpeechSynthesisUtterance(cleaned);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoiceKeywords = ['zira', 'samantha', 'hazel', 'susan', 'karen', 'victoria', 'female', 'google us english', 'cortana'];
      let voice = voices.find(v => {
        const nameLower = v.name.toLowerCase();
        return femaleVoiceKeywords.some(keyword => nameLower.includes(keyword)) && v.lang.startsWith('en');
      });

      if (!voice) {
        voice = voices.find(v => v.lang.startsWith('en'));
      }
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Bind media stream source to video element ref dynamically
  useEffect(() => {
    if (localVideoRef.current) {
      if (screenShare && screenStream) {
        localVideoRef.current.srcObject = screenStream;
      } else if (cameraOn && mediaStream) {
        localVideoRef.current.srcObject = mediaStream;
      }
    }
  }, [mediaStream, screenStream, cameraOn, screenShare]);

  const mediaStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Update stream refs dynamically to keep cleanup handlers accurate
  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    screenStreamRef.current = screenStream;
  }, [screenStream]);

  // Start webcam when call starts
  useEffect(() => {
    if (history.length > 0 && !mediaStream) {
      startWebcam();
    }
  }, [history.length, mediaStream]);

  // Clean up all hardware tracks ONLY when the component unmounts
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Automatically read questions out loud when assistant sends them
  useEffect(() => {
    if (history.length > 0) {
      const lastMsg = history[history.length - 1];
      if (lastMsg.role === 'assistant') {
        speakText(lastMsg.content);
      }
    }
  }, [history]);

  const handleSend = async (isFirst = false) => {
    if (!isFirst && !input.trim()) return;
    setLoading(true);
    
    const newMessage = isFirst ? null : input;
    if (!isFirst) setInput('');
    
    try {
      const response = await axios.post(
        '/api/interview/chat',
        { role, history, newMessage, recruiterMode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data.messages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    setHistory([]);
    handleSend(true);
  };

  const endInterview = async () => {
    stopAllTracks();
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/interview/end',
        { role, history },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate('/interview/feedback', {
        state: {
          score: response.data.result.score,
          feedback: response.data.result.feedback,
          role,
          transcript: history,
          fillerWordsCount: response.data.result.fillerWordsCount,
          averageWordCount: response.data.result.averageWordCount,
          clarityGrade: response.data.result.clarityGrade,
          confidence: response.data.result.confidence,
          technicalAccuracy: response.data.result.technicalAccuracy,
          communication: response.data.result.communication,
          detailedEvaluations: response.data.result.detailedEvaluations
        }
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col gap-8">
      {/* Header Back Button */}
      <div className="flex items-center gap-4">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/')} 
          style={{ padding: '0.5rem 1rem' }}
        >
          <ArrowLeft size={16} />
          <span>Dashboard</span>
        </button>
        <h2 style={{ fontSize: '2rem', margin: 0, fontFamily: 'var(--font-display)' }}>Interview Call Room</h2>
      </div>

      {history.length === 0 ? (
        /* Setup Configuration Card */
        <div className="glass-panel" style={{ maxWidth: '600px' }}>
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.35rem' }}>Configure Setup</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Select your target role and evaluation mode before connecting to the simulator.
            </p>
          </div>

          <div className="input-group">
            <label className="input-label">Target Role / Designation</label>
            <input 
              className="input-field" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              placeholder="e.g. Full Stack Developer"
            />
          </div>

          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem',
              marginTop: '1.5rem',
              cursor: 'pointer'
            }}
            onClick={() => setRecruiterMode(!recruiterMode)}
          >
            <input 
              type="checkbox" 
              id="recruiter" 
              checked={recruiterMode} 
              onChange={e => setRecruiterMode(e.target.checked)} 
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <div className="flex-col" style={{ gap: '0.1rem' }}>
              <label htmlFor="recruiter" style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Recruiter Mode (Strict Evaluation)
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Enforces rigid grading guidelines matching competitive FAANG standards.
              </span>
            </div>
          </div>

          <button 
            className="btn btn-primary w-full" 
            onClick={startInterview} 
            disabled={loading}
            style={{ padding: '0.85rem' }}
          >
            <Play size={16} />
            <span>Connect to Simulator</span>
          </button>
        </div>
      ) : (
        /* Active Call Layout */
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '2rem',
          alignItems: 'stretch'
        }} className="responsive-editor-layout">
          
          {/* Left Panel: Simulated Call Screen with real web feed */}
          <div className="glass-panel flex-col" style={{ 
            justifyContent: 'space-between', 
            background: 'linear-gradient(180deg, #101118 0%, #06070a 100%)',
            minHeight: '480px',
            padding: '1.5rem',
            position: 'relative'
          }}>
            
            {/* Live Indicator overlay */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', itemsCenter: 'center', marginBottom: '1rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                padding: '0.3rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '6px', 
                  height: '6px', 
                  background: '#ef4444', 
                  borderRadius: '50%',
                  animation: 'pulse 1s infinite alternate'
                }} />
                <span>REC LIVE</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Role: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
              </span>
            </div>

            {/* Webcam/Screen stream player */}
            <div style={{
              width: '100%',
              height: '240px',
              background: '#040508',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem'
            }}>
              {/* Webcam Video Tag is ALWAYS kept in DOM to prevent React Ref Null exceptions */}
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover',
                  display: (cameraOn || screenShare) ? 'block' : 'none'
                }} 
              />
              
              {!(cameraOn || screenShare) && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📹</div>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>Webcam feed is inactive</p>
                </div>
              )}
              
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.6)',
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#fff',
                fontWeight: 600,
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                {screenShare ? 'Screen Share Stream' : 'Your Front Camera'}
              </div>
            </div>

            {/* Human HR Interviewer Face Card */}
            <div className="flex items-center gap-4" style={{ 
              background: 'rgba(255,255,255,0.02)', 
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              borderRadius: 'var(--radius-lg)',
              width: '100%',
              marginBottom: '1.5rem'
            }}>
              {/* Image element featuring human corporate interviewer avatar with fallback */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: loading ? '2px solid var(--accent-primary)' : '1px solid var(--border-strong)',
                boxShadow: loading ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-elevated)',
                flexShrink: 0
              }}>
                <img 
                  src="/interviewer_avatar.png" 
                  alt="AI Interviewer" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200"; }}
                />
              </div>

              <div className="flex-col" style={{ flex: 1, gap: '0.15rem' }}>
                <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  {loading ? 'AI Interviewer is speaking...' : 'AI Interviewer (Listening)'}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {loading ? 'Analyzing syntax and keywords' : 'Waiting for answer context'}
                </span>
                {loading && (
                  <div className="waveform" style={{ height: '18px', margin: '0.25rem 0 0 0', justifyContent: 'flex-start' }}>
                    <div className="wave-bar" style={{ width: '3px', height: '4px' }} />
                    <div className="wave-bar" style={{ width: '3px', height: '4px' }} />
                    <div className="wave-bar" style={{ width: '3px', height: '4px' }} />
                    <div className="wave-bar" style={{ width: '3px', height: '4px' }} />
                    <div className="wave-bar" style={{ width: '3px', height: '4px' }} />
                  </div>
                )}
              </div>
            </div>

            {/* Hardware Controls */}
            <div className="flex justify-center gap-3 w-full" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
              <button 
                onClick={toggleMute} 
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: muted ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  borderColor: muted ? '#ef4444' : undefined,
                  color: muted ? '#ef4444' : undefined
                }}
                title={muted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {muted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button 
                onClick={toggleCamera} 
                className="btn btn-secondary"
                disabled={screenShare}
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: !cameraOn ? 'rgba(239, 68, 68, 0.15)' : undefined,
                  borderColor: !cameraOn ? '#ef4444' : undefined,
                  color: !cameraOn ? '#ef4444' : undefined,
                  opacity: screenShare ? 0.5 : 1
                }}
                title={cameraOn ? 'Turn Camera Off' : 'Turn Camera On'}
              >
                {!cameraOn ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              <button 
                onClick={toggleScreenShare} 
                className="btn btn-secondary"
                style={{ 
                  borderRadius: '50%', 
                  width: '44px', 
                  height: '44px', 
                  padding: 0,
                  background: screenShare ? 'rgba(16, 185, 129, 0.15)' : undefined,
                  borderColor: screenShare ? 'var(--accent-tertiary)' : undefined,
                  color: screenShare ? 'var(--accent-tertiary)' : undefined
                }}
                title={screenShare ? 'Stop Sharing' : 'Share Desktop'}
              >
                <Monitor size={18} />
              </button>

              <button 
                onClick={endInterview} 
                className="btn btn-danger"
                style={{ borderRadius: 'var(--radius-md)', padding: '0.5rem 1.25rem' }}
              >
                <PhoneOff size={16} />
                <span>End & Score</span>
              </button>
            </div>

          </div>

          {/* Right Panel: Conversation Stream */}
          <div className="glass-panel flex-col gap-4" style={{ height: '540px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <MessageSquare size={16} color="var(--accent-primary)" />
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SESSION TRANSCRIPT</strong>
            </div>

            {/* Conversation Log */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '0.5rem', 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem' 
            }}>
              {history.map((msg, idx) => {
                if (msg.role === 'system') return null;
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      alignSelf: isAssistant ? 'flex-start' : 'flex-end',
                      maxWidth: '85%',
                      background: isAssistant ? 'rgba(255, 255, 255, 0.02)' : 'var(--gradient-primary)',
                      border: isAssistant ? '1px solid var(--border-subtle)' : 'none',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <strong style={{ 
                      display: 'block', 
                      marginBottom: '0.25rem', 
                      fontSize: '0.75rem', 
                      color: isAssistant ? 'var(--accent-tertiary)' : 'rgba(255, 255, 255, 0.8)' 
                    }}>
                      {isAssistant ? '🎤 INTERVIEWER' : '💬 YOU'}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: '1.5', color: isAssistant ? 'var(--text-secondary)' : 'white' }}>
                      {msg.content}
                    </p>
                  </div>
                );
              })}
              {loading && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Interviewer is typing...
                  </span>
                </div>
              )}
            </div>

            {/* User Answer Input Block */}
            <div className="flex gap-2" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              {/* Speech-to-Text Button */}
              <button 
                className="btn btn-secondary" 
                onClick={startVoiceInput} 
                style={{ 
                  padding: '0.75rem 1rem',
                  borderColor: isListening ? '#ef4444' : undefined,
                  background: isListening ? 'rgba(239, 68, 68, 0.1)' : undefined,
                  color: isListening ? '#ef4444' : undefined
                }}
                title={isListening ? 'Stop Listening' : 'Speak Answer'}
                disabled={loading}
              >
                <Mic size={16} />
              </button>

              <input 
                className="input-field" 
                style={{ flex: 1 }} 
                value={input} 
                onChange={e => setInput(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Type or speak your answer context here..."}
                onKeyPress={e => e.key === 'Enter' && handleSend(false)}
                disabled={loading}
              />
              <button 
                className="btn btn-primary" 
                onClick={() => handleSend(false)} 
                disabled={loading || !input.trim()}
                style={{ padding: '0.75rem 1.25rem' }}
              >
                <Send size={14} />
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default Interview;
