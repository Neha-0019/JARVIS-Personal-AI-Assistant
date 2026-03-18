import React, { useState, useEffect, useRef } from 'react';
import {
    LiveKitRoom,
    RoomAudioRenderer,
    useTracks,
    useParticipants,
    useIsSpeaking,
    useChat,
} from '@livekit/components-react';
import { Track } from 'livekit-client';

// ------------------------------------------------------------------
// STYLES & ANIMATIONS
// ------------------------------------------------------------------
const globalStyles = `
  @keyframes wave {
    0% { transform: scaleY(0.5); }
    50% { transform: scaleY(1.5); }
    100% { transform: scaleY(0.5); }
  }
  @keyframes pulse {
    0% { transform: scale(0.95); opacity: 0.5; }
    50% { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(0.95); opacity: 0.5; }
  }
  input:focus, button:focus {
    outline: none;
  }
`;

// ------------------------------------------------------------------
// REUSABLE COMPONENTS
// ------------------------------------------------------------------

const ScanLines = () => (
    <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'repeating-linear-gradient(to bottom, transparent, transparent 3px, rgba(0, 200, 255, 0.03) 4px)',
        pointerEvents: 'none',
        zIndex: 10
    }} />
);

const CornerBrackets = ({ color = '#00c8ff', size = 24, thickness = 2 }) => {
    const baseStyle = { position: 'absolute', width: size, height: size, borderColor: color, borderStyle: 'solid', pointerEvents: 'none', zIndex: 11 };
    return (
        <>
            <div style={{ ...baseStyle, top: 0, left: 0, borderWidth: `${thickness}px 0 0 ${thickness}px` }} />
            <div style={{ ...baseStyle, top: 0, right: 0, borderWidth: `${thickness}px ${thickness}px 0 0` }} />
            <div style={{ ...baseStyle, bottom: 0, left: 0, borderWidth: `0 0 ${thickness}px ${thickness}px` }} />
            <div style={{ ...baseStyle, bottom: 0, right: 0, borderWidth: `0 ${thickness}px ${thickness}px 0` }} />
        </>
    );
};

const AudioWave = ({ active }) => {
    return (
        <div style={{ display: 'flex', gap: 4, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} style={{
                    width: 3,
                    height: active ? 20 : 4,
                    background: '#00c8ff',
                    borderRadius: 2,
                    animation: active ? `wave ${0.5 + (i % 4) * 0.2}s infinite ease-in-out` : 'none',
                    transition: 'height 0.3s ease'
                }} />
            ))}
        </div>
    );
};

// ------------------------------------------------------------------
// UI COMPONENTS
// ------------------------------------------------------------------

const LocalCamera = () => {
    const videoRef = useRef(null);
    const tracks = useTracks([Track.Source.Camera], { onlySubscribed: false });
    const localCameraTrack = tracks.find(t => t.participant.isLocal)?.publication?.track;

    useEffect(() => {
        if (localCameraTrack && videoRef.current) {
            localCameraTrack.attach(videoRef.current);
        }
        return () => {
            if (localCameraTrack && videoRef.current) {
                localCameraTrack.detach(videoRef.current);
            }
        };
    }, [localCameraTrack]);

    return (
        <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16/9',
            background: '#010508',
            border: '1px solid rgba(0, 200, 255, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <ScanLines />
            <CornerBrackets />

            {localCameraTrack ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                />
            ) : (
                <div style={{ color: 'rgba(0, 200, 255, 0.5)', fontFamily: 'Orbitron', fontSize: 14 }}>CAMERA NO SIGNAL</div>
            )}

            <div style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                fontFamily: 'Orbitron',
                fontSize: 10,
                color: '#00c8ff',
                background: 'rgba(0, 200, 255, 0.1)',
                padding: '2px 6px',
                border: '1px solid rgba(0,200,255,0.3)',
                zIndex: 20
            }}>
                LIVE FEED
            </div>
        </div>
    );
};

const JarvisStatusUI = ({ connected, isSpeaking }) => {
    const [dots, setDots] = useState('');

    useEffect(() => {
        if (!connected) {
            const id = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
            return () => clearInterval(id);
        }
    }, [connected]);

    const statusText = !connected ? `STANDBY${dots}` : (isSpeaking ? 'SPEAKING' : 'LISTENING');

    return (
        <div style={{
            position: 'relative',
            height: 240,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(0, 200, 255, 0.2)',
            background: 'rgba(0, 200, 255, 0.02)',
            marginBottom: 24
        }}>
            <CornerBrackets size={12} />
            <ScanLines />

            <div style={{ position: 'relative', width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {/* Outer Ring */}
                <div style={{
                    position: 'absolute', width: 96, height: 96, borderRadius: '50%',
                    border: `2px solid ${isSpeaking ? '#00c8ff' : (connected ? 'rgba(0,200,255,0.4)' : 'rgba(0,200,255,0.1)')}`,
                    boxShadow: isSpeaking ? '0 0 20px #00c8ff' : 'none',
                    transition: 'all 0.3s ease'
                }} />
                {/* Middle Ring */}
                <div style={{
                    position: 'absolute', width: 72, height: 72, borderRadius: '50%',
                    border: `2px dashed ${connected ? 'rgba(0,200,255,0.6)' : 'rgba(0,200,255,0.2)'}`,
                    animation: connected ? 'pulse 4s infinite linear' : 'none'
                }} />
                {/* Inner Circle */}
                <div style={{
                    position: 'absolute', width: 44, height: 44, borderRadius: '50%',
                    background: isSpeaking ? 'radial-gradient(circle, #fff 0%, #00c8ff 70%, transparent 100%)' : (connected ? 'rgba(0,200,255,0.3)' : 'rgba(0,200,255,0.05)'),
                    boxShadow: isSpeaking ? '0 0 15px #00c8ff' : 'none',
                    transition: 'all 0.3s ease'
                }} />
            </div>

            <div style={{ fontFamily: 'Orbitron', fontSize: 20, fontWeight: 700, color: '#00c8ff', letterSpacing: 4, marginBottom: 4 }}>JARVIS</div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: 12, color: connected ? '#00ff88' : 'rgba(255,255,255,0.4)', letterSpacing: 1, marginBottom: 12 }}>{statusText}</div>

            <AudioWave active={isSpeaking} />
        </div>
    );
};

const JarvisStatusConnected = ({ participant }) => {
    const isSpeaking = useIsSpeaking(participant);
    return <JarvisStatusUI connected={true} isSpeaking={isSpeaking} />;
};

const JarvisStatus = () => {
    const participants = useParticipants();
    const agent = participants.find(p => !p.isLocal);

    if (!agent) {
        return <JarvisStatusUI connected={false} isSpeaking={false} />;
    }
    return <JarvisStatusConnected participant={agent} />;
};

const TextChat = () => {
    const { send, chatMessages, isSending } = useChat();
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim() && !isSending) {
            send(input.trim());
            setInput('');
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: 380,
            border: '1px solid rgba(0, 200, 255, 0.2)', background: 'rgba(0, 200, 255, 0.02)', position: 'relative'
        }}>
            <CornerBrackets size={12} />

            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', padding: '8px 12px',
                borderBottom: '1px solid rgba(0, 200, 255, 0.2)', background: 'rgba(0, 200, 255, 0.05)'
            }}>
                <div style={{ display: 'flex', gap: 4, marginRight: 12 }}>
                    <div style={{ width: 4, height: 4, background: '#00c8ff' }}></div>
                    <div style={{ width: 4, height: 4, background: '#00c8ff' }}></div>
                </div>
                <span style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#00c8ff', letterSpacing: 1 }}>TEXT LINK</span>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {chatMessages.map((msg, i) => {
                    const isAgent = !msg.from?.isLocal;
                    return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isAgent ? 'flex-start' : 'flex-end' }}>
                            <div style={{ fontFamily: 'Orbitron', fontSize: 9, color: isAgent ? '#00c8ff' : 'rgba(255,255,255,0.5)', marginBottom: 2, letterSpacing: 1 }}>
                                {isAgent ? 'JARVIS' : 'USER'}
                            </div>
                            <div style={{
                                background: isAgent ? 'rgba(0, 200, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                border: `1px solid ${isAgent ? 'rgba(0, 200, 255, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                padding: '8px 12px',
                                borderRadius: 4,
                                fontFamily: 'Rajdhani',
                                fontSize: 14,
                                color: isAgent ? '#fff' : 'rgba(255,255,255,0.9)',
                                maxWidth: '85%',
                                wordBreak: 'break-word'
                            }}>
                                {msg.message}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} style={{ display: 'flex', padding: 12, borderTop: '1px solid rgba(0, 200, 255, 0.2)' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="ENTER COMMAND..."
                    style={{
                        flex: 1, background: 'transparent', border: 'none', color: '#fff',
                        fontFamily: 'Rajdhani', fontSize: 14, letterSpacing: 1
                    }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    style={{
                        background: 'transparent',
                        border: `1px solid ${input.trim() ? '#00c8ff' : 'rgba(0,200,255,0.2)'}`,
                        color: input.trim() ? '#00c8ff' : 'rgba(0,200,255,0.2)',
                        fontFamily: 'Orbitron', fontSize: 10, padding: '4px 12px', cursor: input.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s'
                    }}
                >
                    SEND
                </button>
            </form>
        </div>
    );
};

const RoomUI = ({ onDisconnect }) => {
    return (
        <div style={{
            maxWidth: 1100, margin: '0 auto', padding: '24px',
            display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24,
            height: '100%'
        }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                    <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#00c8ff', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, background: '#00c8ff' }} /> VISUAL INPUT — CAM-01
                    </div>
                    <LocalCamera />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button onClick={onDisconnect} style={{
                        background: 'rgba(255, 80, 80, 0.1)',
                        border: '1px solid rgba(255, 80, 80, 0.5)',
                        color: '#ff5050',
                        fontFamily: 'Orbitron', fontWeight: 700, fontSize: 12, letterSpacing: 2,
                        padding: '12px 24px', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.2)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(255,80,80,0.4)'; }}
                        onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 80, 80, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        DISCONNECT
                    </button>
                </div>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: 'Orbitron', fontSize: 12, color: '#00c8ff', letterSpacing: 2, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, background: '#00c8ff' }} /> AGENT STATUS
                </div>
                <JarvisStatus />

                <div style={{
                    border: '1px solid rgba(0,200,255,0.2)', background: 'rgba(0,200,255,0.02)', padding: 12, marginBottom: 16,
                    fontFamily: 'Rajdhani', fontSize: 12, color: 'rgba(255,255,255,0.7)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>VOICE</span><span style={{ color: '#00c8ff' }}>Aoede (Google)</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>MODEL</span><span style={{ color: '#00c8ff' }}>Gemini Realtime</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>CAMERA</span><span style={{ color: '#00ff88' }}>Active</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>MODE</span><span style={{ color: '#00c8ff' }}>Full Duplex</span></div>
                </div>

                <div style={{ fontFamily: 'Rajdhani', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 8, fontStyle: 'italic' }}>
                    * Tip: Speak naturally. You can interrupt Jarvis at any time.
                </div>

                <TextChat />
            </div>

            <RoomAudioRenderer />
        </div>
    );
};

const ConnectScreen = ({ onConnect, connecting, error }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div style={{ position: 'relative', width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
                {/* Arc Reactor Rings */}
                <div style={{
                    position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                    border: '2px solid rgba(0,200,255,0.2)',
                    animation: 'pulse 4s infinite ease-in-out'
                }} />
                <div style={{
                    position: 'absolute', width: 130, height: 130, borderRadius: '50%',
                    border: '4px dashed rgba(0,200,255,0.5)',
                    animation: 'pulse 3s infinite ease-in-out reverse'
                }} />
                <div style={{
                    position: 'absolute', width: 100, height: 100, borderRadius: '50%',
                    border: '2px solid rgba(0,200,255,0.8)',
                    boxShadow: '0 0 20px rgba(0,200,255,0.5), inset 0 0 20px rgba(0,200,255,0.5)',
                    animation: 'pulse 2s infinite ease-in-out'
                }} />
                <div style={{
                    position: 'absolute', width: 40, height: 40, borderRadius: '50%',
                    background: '#00c8ff',
                    boxShadow: '0 0 30px #00c8ff, 0 0 60px #fff'
                }} />
            </div>

            <div style={{ fontFamily: 'Orbitron', fontSize: 40, fontWeight: 900, color: '#00c8ff', letterSpacing: 12, textShadow: '0 0 10px rgba(0,200,255,0.5)', marginBottom: 8 }}>JARVIS</div>
            <div style={{ fontFamily: 'Rajdhani', fontSize: 16, color: '#fff', letterSpacing: 6, opacity: 0.7, marginBottom: 40 }}>PERSONAL AI ASSISTANT</div>

            {error && (
                <div style={{
                    border: '1px solid rgba(255,80,80,0.5)', background: 'rgba(255,80,80,0.1)', color: '#ff5050',
                    padding: '12px 24px', fontFamily: 'Rajdhani', fontSize: 14, marginBottom: 24, maxWidth: 400, textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <button onClick={onConnect} disabled={connecting} style={{
                background: 'rgba(0,200,255,0.1)',
                border: '1px solid #00c8ff',
                color: '#00c8ff',
                fontFamily: 'Orbitron', fontWeight: 700, fontSize: 16, letterSpacing: 4,
                padding: '16px 48px', cursor: connecting ? 'default' : 'pointer',
                boxShadow: connecting ? 'none' : '0 0 15px rgba(0,200,255,0.2), inset 0 0 15px rgba(0,200,255,0.1)',
                transition: 'all 0.3s',
                opacity: connecting ? 0.7 : 1
            }}
                onMouseOver={e => { if (!connecting) { e.currentTarget.style.background = 'rgba(0,200,255,0.2)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,200,255,0.4), inset 0 0 20px rgba(0,200,255,0.2)'; } }}
                onMouseOut={e => { if (!connecting) { e.currentTarget.style.background = 'rgba(0,200,255,0.1)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(0,200,255,0.2), inset 0 0 15px rgba(0,200,255,0.1)'; } }}
            >
                {connecting ? 'INITIALIZING...' : 'INITIATE'}
            </button>

            <div style={{ position: 'absolute', bottom: 24, fontFamily: 'Rajdhani', fontSize: 10, letterSpacing: 4, color: 'rgba(255,255,255,0.2)' }}>
                STARK INDUSTRIES · AI DIVISION
            </div>
        </div>
    );
};

// ------------------------------------------------------------------
// APP ROOT
// ------------------------------------------------------------------

function App() {
    const [roomToken, setRoomToken] = useState('');
    const [serverUrl, setServerUrl] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');

    const handleConnect = async () => {
        setConnecting(true);
        setError('');
        try {
            const resp = await fetch('http://localhost:8000/token');
            if (!resp.ok) throw new Error('Failed to fetch token. Is token server running?');
            const data = await resp.json();
            if (data.error) throw new Error(data.error);

            setRoomToken(data.token);
            setServerUrl(data.url);
        } catch (err) {
            setError(err.message);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setRoomToken('');
        setServerUrl('');
    };

    return (
        <>
            <style>{globalStyles}</style>
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>

                {/* Navigation Bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 24px', borderBottom: '1px solid rgba(0,200,255,0.2)',
                    background: 'rgba(0,200,255,0.02)', width: '100%'
                }}>
                    <div style={{ fontFamily: 'Orbitron', fontWeight: 900, fontSize: 18, color: '#00c8ff', letterSpacing: 4 }}>
                        J.A.R.V.I.S
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: roomToken ? '#00ff88' : 'rgba(255,255,255,0.3)',
                            boxShadow: roomToken ? '0 0 10px #00ff88' : 'none'
                        }} />
                        <div style={{ fontFamily: 'Orbitron', fontSize: 10, letterSpacing: 2, color: roomToken ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>
                            {roomToken ? 'CONNECTED' : 'OFFLINE'}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {!roomToken ? (
                        <ConnectScreen onConnect={handleConnect} connecting={connecting} error={error} />
                    ) : (
                        <LiveKitRoom
                            token={roomToken}
                            serverUrl={serverUrl}
                            connect={true}
                            video={true}
                            audio={true}
                            onDisconnected={handleDisconnect}
                        >
                            <RoomUI onDisconnect={handleDisconnect} />
                        </LiveKitRoom>
                    )}
                </div>
            </div>
        </>
    );
}

export default App;
