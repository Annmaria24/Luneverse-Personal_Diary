import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/RelaxMode.css';

const sounds = [
  {
    name: 'Gentle Rain', icon: '🌧️', srcs: [
      '/src/assets/Sounds/Gentle rain.wav'
    ],
    videoId: 'M0qWBKQ7ldY'
  },
  {
    name: 'Forest Birds', icon: '🌲', srcs: [
      '/src/assets/Sounds/Forest Birds.wav'
    ],
    videoId: '2G8LAiHSCAs'
  },
  {
    name: 'Ocean Waves', icon: '🌊', srcs: [
      '/src/assets/Sounds/Ocean.wav'
    ],
    videoId: 'bn9F19Hi1Lk'
  },
  {
    name: 'Crackling Fireplace', icon: '🔥', srcs: [
      '/src/assets/Sounds/Fireplace.aiff',
      'https://cdn.pixabay.com/audio/2021/08/09/audio_4a2b3a2f5f.mp3'
    ],
    videoId: 'UgHKb_7884o'
  },
  {
    name: 'Night Ambience', icon: '🌙', srcs: [
      '/src/assets/Sounds/NightAmbience.wav'
    ],
    videoId: 'g1w3IT5WnYw'
  },
  {
    name: 'Cafe Murmur', icon: '☕', srcs: [
      '/src/assets/Sounds/Cafe Murmur.wav'
    ],
    videoId: 'uiMXGIG_DQo'
  },
  {
    name: 'Relaxing Piano', icon: '🎹', srcs: [
      '/src/assets/Sounds/Relaxing Piano.mp3'
    ], 
    videoId: 'oYoXxPCQsoM'
  },
  {
    name: 'River', icon: '🏞️', srcs: [
      '/src/assets/Sounds/River.wav'
    ], 
    videoId: 'HAzZH6wccew'
  }
];

function RelaxSound({ embedded = false }) {
  const navigate = useNavigate();
  const audioRefs = useRef({});
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState({});
  const [srcIndex, setSrcIndex] = useState({});
  const [useSynth, setUseSynth] = useState({});
  const synthEngines = useRef({});
  const ytPlayers = useRef({});
  const [ytReady, setYtReady] = useState(false);
  const pendingPlay = useRef({});
  const [videoMeta, setVideoMeta] = useState({});

  const createYTPlayer = (sound) => {
    if (!window.YT || !window.YT.Player) return null;
    if (ytPlayers.current[sound.name]) return ytPlayers.current[sound.name];

    console.log(`Creating YouTube player for ${sound.name} with video ID: ${sound.videoId}`);

    ytPlayers.current[sound.name] = new window.YT.Player(`yt-${sound.name.replace(/\s+/g,'-')}`, {
      height: '1', 
      width: '1', 
      videoId: sound.videoId,
      playerVars: { 
        autoplay: 0, 
        controls: 0, 
        rel: 0, 
        modestbranding: 1, 
        playsinline: 1, 
        origin: window.location.origin, 
        host: 'https://www.youtube.com',
        loop: 1,
        mute: 0
      },
      events: {
        onReady: (e) => {
          console.log(`YouTube player ready for ${sound.name}`);
          try { 
            e.target.unMute && e.target.unMute(); 
            e.target.setVolume && e.target.setVolume(85); 
          } catch {}
          
          if (pendingPlay.current[sound.name]) {
            try {
              e.target.loadVideoById({ 
                videoId: sound.videoId, 
                startSeconds: 0, 
                suggestedQuality: 'large' 
              });
              e.target.playVideo();
            } catch (error) {
              console.warn(`Failed to play YouTube video for ${sound.name}:`, error);
            }
            pendingPlay.current[sound.name] = false;
          }
        },
        onStateChange: (e) => {
          console.log(`YouTube state change for ${sound.name}:`, e.data);
          
          if (e.data === window.YT.PlayerState.PLAYING) {
            try {
              const v = e.target.getVideoData();
              console.log(`Now playing: ${v?.title} (ID: ${v?.video_id})`);
              
              // Verify we're playing the correct video
              if (v && v.video_id && sound.videoId && v.video_id !== sound.videoId) {
                console.warn(`Video ID mismatch! Expected: ${sound.videoId}, Got: ${v.video_id}`);
                e.target.loadVideoById({ 
                  videoId: sound.videoId, 
                  startSeconds: 0, 
                  suggestedQuality: 'large' 
                });
                return;
              }
              
              setVideoMeta(prev => ({ 
                ...prev, 
                [sound.name]: { 
                  id: v?.video_id || sound.videoId, 
                  title: v?.title || sound.name 
                } 
              }));
            } catch (error) {
              console.warn(`Error getting video data for ${sound.name}:`, error);
            }
            
            // Stop all other sounds
            sounds.forEach(s => {
              if (s.name !== sound.name) {
                const other = ytPlayers.current[s.name];
                if (other && other.pauseVideo) { 
                  try { 
                    other.pauseVideo(); 
                    other.stopVideo && other.stopVideo();
                  } catch {} 
                }
                const a = audioRefs.current[s.name];
                if (a) { 
                  try { 
                    a.pause(); 
                    a.currentTime = 0; 
                  } catch {} 
                }
                stopSynth(s);
                setPlaying(prev => ({ ...prev, [s.name]: false }));
              }
            });
            
            setPlaying(prev => ({ ...prev, [sound.name]: true }));
          }
          
          if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
            setPlaying(prev => ({ ...prev, [sound.name]: false }));
          }
        },
        onError: (error) => {
          console.error(`YouTube player error for ${sound.name}:`, error);
          setPlaying(prev => ({ ...prev, [sound.name]: false }));
          setVideoMeta(prev => ({ 
            ...prev, 
            [sound.name]: { 
              id: 'error', 
              title: 'Video unavailable' 
            } 
          }));
          
          // Fallback to audio
          const a = audioRefs.current[sound.name];
          if (a && sound.srcs && sound.srcs[0]) {
            a.src = sound.srcs[0];
            a.load();
            a.play().catch(() => { 
              setUseSynth(p => ({ ...p, [sound.name]: true })); 
              startSynth(sound); 
            });
          } else {
            setUseSynth(p => ({ ...p, [sound.name]: true })); 
            startSynth(sound);
          }
        }
      }
    });
    return ytPlayers.current[sound.name];
  };

  // Load YouTube Iframe API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYtReady(true);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => setYtReady(true);
  }, []);

  // When API becomes ready, honor any pending play intents
  useEffect(() => {
    if (!ytReady) return;
    sounds.forEach((sound) => {
      if (pendingPlay.current[sound.name]) {
        try { createYTPlayer(sound); } catch {}
      }
    });
  }, [ytReady]);

  // Cleanup function to stop all audio when component unmounts
  useEffect(() => {
    return () => {
      // Stop all audio elements
      sounds.forEach(sound => {
        const audio = audioRefs.current[sound.name];
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        
        // Stop all YouTube players
        const ytPlayer = ytPlayers.current[sound.name];
        if (ytPlayer) {
          try {
            ytPlayer.pauseVideo();
            ytPlayer.stopVideo && ytPlayer.stopVideo();
          } catch {}
        }
        
        // Stop all synths
        stopSynth(sound);
      });
    };
  }, []);

  // First user gesture to unlock audio on mobile/desktop
  const handleActivate = async () => {
    setActivated(true);
    // Attempt to unlock each audio element by playing it muted briefly
    try {
      for (const s of sounds) {
        const a = audioRefs.current[s.name];
        if (!a) continue;
        const prevMuted = a.muted;
        const prevVolume = a.volume;
        a.muted = true;
        a.volume = 0;
        a.play().then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = prevMuted;
          a.volume = prevVolume;
        }).catch(() => {
          // Ignore; some browsers will still allow subsequent gesture plays
        });
      }
    } catch (e) {
      // No-op: unlocking is best-effort
      console.warn('Audio unlock attempt failed', e);
    }
  };

  // Richer WebAudio ambience fallback per sound (procedural)
  const startSynth = async (sound) => {
    if (synthEngines.current[sound.name]?.started) return;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    await ctx.resume();

    const createNoise = (color = 'white') => {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (color === 'pink') {
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; // boost
        } else if (color === 'brown') {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut;
        } else {
          data[i] = white;
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      return src;
    };

    const gain = ctx.createGain();
    gain.gain.value = 0.06; // slightly softer base volume

    // Global smoothing: gentle lowpass + compressor for less grainy sound
    const masterLP = ctx.createBiquadFilter();
    masterLP.type = 'lowpass';
    masterLP.frequency.value = 6000;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -28;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.25;
    gain.connect(masterLP).connect(compressor).connect(ctx.destination);

    const intervals = [];
    let primary, filter, lfo, lfoGain;

    const name = sound.name.toLowerCase();
    if (name.includes('rain')) {
      // Pink/brown noise shaped like rain with random droplet ticks
      primary = createNoise('pink');
      filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 400;
      const shelf = ctx.createBiquadFilter();
      shelf.type = 'lowshelf';
      shelf.frequency.value = 200;
      shelf.gain.value = -8;
      primary.connect(filter).connect(shelf).connect(gain);
      primary.start();

      // random droplet plips
      const droplet = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(1200 + Math.random() * 800, ctx.currentTime);
        g.gain.setValueAtTime(0.0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.connect(g).connect(gain);
        o.start();
        o.stop(ctx.currentTime + 0.3);
      };
      intervals.push(setInterval(() => {
        if (Math.random() < 0.6) droplet();
      }, 250));
    } else if (name.includes('ocean')) {
      // Lowpass noise with slow swell LFO
      primary = createNoise('brown');
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.12; // slow swell
      lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.06;
      lfo.connect(lfoGain).connect(gain.gain);
      primary.connect(filter).connect(gain);
      primary.start();
      lfo.start();
    } else if (name.includes('fire')) {
      // Crackling fireplace: noise + pops
      primary = createNoise('pink');
      filter = ctx.createBiquadFilter();
      filter.type = 'lowshelf';
      filter.frequency.value = 250;
      filter.gain.value = -10;
      primary.connect(filter).connect(gain);
      primary.start();
      const crackle = () => {
        const n = createNoise('white');
        const g = ctx.createGain();
        g.gain.value = 0.0;
        g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08 + Math.random() * 0.12);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 1500 + Math.random() * 2500;
        n.connect(hp).connect(g).connect(gain);
        n.start();
        n.stop(ctx.currentTime + 0.2);
      };
      intervals.push(setInterval(() => {
        if (Math.random() < 0.9) crackle();
      }, 120));
    } else if (name.includes('forest')) {
      // Birds: gentle chirps at random
      const chirp = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        const base = 900 + Math.random() * 1200;
        o.frequency.setValueAtTime(base, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(base * (1.8 + Math.random()), ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.connect(g).connect(gain);
        o.start();
        o.stop(ctx.currentTime + 0.28);
      };
      intervals.push(setInterval(() => {
        if (Math.random() < 0.5) chirp();
      }, 350));
      // light breeze
      primary = createNoise('pink');
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;
      const breezeGain = ctx.createGain();
      breezeGain.gain.value = 0.03;
      primary.connect(filter).connect(breezeGain).connect(gain);
      primary.start();
    } else if (name.includes('night')) {
      // Crickets + low noise bed
      primary = createNoise('brown');
      const bed = ctx.createGain();
      bed.gain.value = 0.02;
      primary.connect(bed).connect(gain);
      primary.start();
      const cricket = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.value = 4500;
        g.gain.value = 0.0;
        // chirp triplet
        for (let i = 0; i < 3; i++) {
          const t0 = ctx.currentTime + i * 0.06;
          g.gain.setValueAtTime(0.0, t0);
          g.gain.linearRampToValueAtTime(0.02, t0 + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        }
        o.connect(g).connect(gain);
        o.start();
        o.stop(ctx.currentTime + 0.22);
      };
      intervals.push(setInterval(() => {
        if (Math.random() < 0.9) cricket();
      }, 400));
    } else {
      // Cafe murmur: bandpassed noise + random clinks
      primary = createNoise('pink');
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1000;
      bp.Q.value = 0.6;
      const murmurGain = ctx.createGain();
      murmurGain.gain.value = 0.04;
      primary.connect(bp).connect(murmurGain).connect(gain);
      primary.start();
      const clink = () => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = 2000 + Math.random() * 1500;
        g.gain.setValueAtTime(0.0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        o.connect(g).connect(gain);
        o.start();
        o.stop(ctx.currentTime + 0.3);
      };
      intervals.push(setInterval(() => {
        if (Math.random() < 0.2) clink();
      }, 800));
    }

    synthEngines.current[sound.name] = { ctx, gain, primary, filter, lfo, lfoGain, intervals, started: true };
  };

  const stopSynth = (sound) => {
    const eng = synthEngines.current[sound.name];
    if (!eng) return;
    try {
      if (eng.primary && eng.primary.stop) eng.primary.stop();
      if (eng.lfo && eng.lfo.stop) eng.lfo.stop();
      if (eng.intervals) eng.intervals.forEach(clearInterval);
      eng.ctx.close();
    } catch {}
    delete synthEngines.current[sound.name];
  };

  const handleCardClick = (sound) => {
    if (!activated) return;

    const audio = audioRefs.current[sound.name];
    if (!audio) return;

    const wasPlaying = !!playing[sound.name];
    
    // First, stop ALL other sounds completely
    sounds.forEach((s) => {
      if (s.name !== sound.name) {
        // Stop other audio elements
        const otherAudio = audioRefs.current[s.name];
        if (otherAudio) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
        
        // Stop other YouTube players
        const otherYt = ytPlayers.current[s.name];
        if (otherYt && ytReady) {
          try { 
            otherYt.pauseVideo(); 
            otherYt.stopVideo && otherYt.stopVideo();
          } catch {}
        }
        
        // Stop other synths
        stopSynth(s);
        
        // Update UI state for other sounds
        setPlaying(prev => ({ ...prev, [s.name]: false }));
      }
    });

    if (wasPlaying) {
      // Pause current sound completely
      audio.pause();
      audio.currentTime = 0;
      stopSynth(sound);
      
      // Pause YouTube if exists
      const yp = ytPlayers.current[sound.name];
      if (yp && ytReady) {
        try { 
          yp.pauseVideo(); 
          yp.stopVideo && yp.stopVideo();
        } catch {}
      }
      
      // Update UI state
      setPlaying(prev => ({ ...prev, [sound.name]: false }));
    } else {
      // Play current sound
      if (ytReady && sound.videoId) {
        // Use YouTube player
        try {
          // Create player if it doesn't exist
          if (!ytPlayers.current[sound.name]) {
            createYTPlayer(sound);
          }
          
          const player = ytPlayers.current[sound.name];
          if (player) {
            // Ensure we're using the correct video ID
            player.loadVideoById({ 
              videoId: sound.videoId, 
              startSeconds: 0, 
              suggestedQuality: 'large' 
            });
            player.unMute && player.unMute();
            player.setVolume && player.setVolume(85);
            player.playVideo();
          }
        } catch (error) {
          console.warn('YouTube player failed, falling back to audio:', error);
          // Fallback to audio
          playAudioFallback(sound, audio);
        }
      } else if (!ytReady && sound.videoId) {
        // Queue play until API is ready
        pendingPlay.current[sound.name] = true;
        setPlaying(prev => ({ ...prev, [sound.name]: true }));
      } else {
        // Use audio fallback
        playAudioFallback(sound, audio);
      }
    }
  };

  const playAudioFallback = (sound, audio) => {
    // Ensure correct source is selected for HTMLAudio
    const index = srcIndex[sound.name] || 0;
    const list = sound.srcs || [];
    if (list[index] && audio.src !== list[index]) {
      audio.src = list[index];
    }

    audio.muted = false;
    audio.volume = 1;
    audio.load();

    if (useSynth[sound.name]) {
      startSynth(sound);
    } else {
      audio.play().then(() => {
        // Ensure any synth is stopped if it existed
        stopSynth(sound);
        setPlaying(prev => ({ ...prev, [sound.name]: true }));
      }).catch(() => {
        // fallback to synth if play fails
        setUseSynth(prev => ({ ...prev, [sound.name]: true }));
        startSynth(sound);
        setPlaying(prev => ({ ...prev, [sound.name]: true }));
      });
    }
  };

  const Content = (
    <>
      {!activated && (
        <div className="activation-overlay">
          <button className="template-btn" onClick={handleActivate}>
            Tap to Enable Sounds
          </button>
        </div>
      )}
      {!embedded && (
        <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>
      )}
      <h2>Soundscapes</h2>
      <p>Tap a card to play or pause a relaxing background sound.</p>

      <div className="sound-grid">
        {sounds.map((sound) => (
          <div key={sound.name} className="sound-card" onClick={() => handleCardClick(sound)}>
            <div className="sound-name">
              <span style={{ marginRight: 8 }}>{sound.icon}</span>
              {sound.name}
            </div>
            <button
              className="sound-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(sound);
              }}
            >
              {playing[sound.name] ? 'Pause' : 'Play'}
            </button>
            {/* Small debug label to confirm exact YouTube id while playing */}
            {playing[sound.name] && videoMeta[sound.name]?.id && (
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: 4 }}>
                YT: {videoMeta[sound.name].id}
              </div>
            )}
            {/* Hidden YouTube container (0x0) for audio playback */}
            {sound.videoId && (
              <div id={`yt-${sound.name.replace(/\s+/g,'-')}`} style={{ width: 0, height: 0, overflow: 'hidden' }} />
            )}
            <audio
              ref={el => (audioRefs.current[sound.name] = el)}
              src={(sound.srcs && sound.srcs[0]) || ''}
              loop
              preload="auto"
              crossOrigin="anonymous"
              playsInline
              referrerPolicy="no-referrer"
              onLoadedData={() => {
                // If we were using synth due to errors but source now loaded and user is playing, switch back to audio
                if (useSynth[sound.name] && playing[sound.name]) {
                  setUseSynth(prev => ({ ...prev, [sound.name]: false }));
                  stopSynth(sound);
                  const a = audioRefs.current[sound.name];
                  a && a.play().catch(() => {});
                }
              }}
              onError={() => {
                const lastIdx = (sound.srcs?.length || 1) - 1;
                const current = srcIndex[sound.name] || 0;
                if (current < lastIdx) {
                  const next = current + 1;
                  setSrcIndex(prev => ({ ...prev, [sound.name]: next }));
                  const a = audioRefs.current[sound.name];
                  if (a && sound.srcs && sound.srcs[next]) {
                    a.src = sound.srcs[next];
                    a.load();
                    // try play again if we intended to be playing
                    if (playing[sound.name]) {
                      a.play().catch(() => {});
                    }
                  }
                } else {
                  // switch to synth fallback
                  setUseSynth(prev => ({ ...prev, [sound.name]: true }));
                  if (playing[sound.name]) {
                    startSynth(sound);
                  }
                }
              }}
              style={{ display: 'none' }}
            />
          </div>
        ))}
      </div>
    </>
  );

  if (embedded) {
    return <div>{Content}</div>;
  }

  return (
    <div className="relax-mode-page">
      <main className="relax-main">
        {Content}
      </main>
    </div>
  );
}

export default RelaxSound;
