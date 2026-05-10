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
  const ytContainerRef = useRef(null); // Stable parent for all YT iframes
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

    const elementId = `yt-player-${sound.name.replace(/\s+/g, '-')}`;
    
    // Ensure the element exists in our stable container
    if (!document.getElementById(elementId)) {
      const div = document.createElement('div');
      div.id = elementId;
      div.style.width = '1px';
      div.style.height = '1px';
      div.style.position = 'absolute';
      div.style.opacity = '0.01';
      div.style.pointerEvents = 'none';
      ytContainerRef.current.appendChild(div);
    }

    console.log(`Creating YouTube player for ${sound.name}`);

    ytPlayers.current[sound.name] = new window.YT.Player(elementId, {
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
        loop: 1
      },
      events: {
        onReady: (e) => {
          console.log(`YouTube player ready for ${sound.name}`);
          try { 
            e.target.unMute && e.target.unMute(); 
            e.target.setVolume && e.target.setVolume(85); 
          } catch {} // eslint-disable-line no-empty
          
          if (pendingPlay.current[sound.name]) {
            try { e.target.playVideo(); } catch {} // eslint-disable-line no-empty
            pendingPlay.current[sound.name] = false;
          }
        },
        onStateChange: (e) => {
          // If video is cued (5) but we wanted it playing, force play
          if (e.data === 5 && pendingPlay.current[sound.name]) {
            e.target.playVideo();
            pendingPlay.current[sound.name] = false;
          }

          if (e.data === window.YT.PlayerState.PLAYING) {
            try {
              const v = e.target.getVideoData();
              setVideoMeta(prev => ({ 
                ...prev, 
                [sound.name]: { id: v?.video_id || sound.videoId, title: v?.title || sound.name } 
              }));
            } catch {} // eslint-disable-line no-empty
            
            // Stop all others
            sounds.forEach(s => {
              if (s.name !== sound.name) {
                const other = ytPlayers.current[s.name];
                if (other && other.pauseVideo) try { other.pauseVideo(); } catch {} // eslint-disable-line no-empty
                const a = audioRefs.current[s.name];
                if (a) { a.pause(); a.currentTime = 0; }
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
        onError: () => {
          setPlaying(prev => ({ ...prev, [sound.name]: false }));
          playAudioFallback(sound, audioRefs.current[sound.name]);
        }
      }
    });
    return ytPlayers.current[sound.name];
  };

  // Load YouTube API
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

  // Pre-warm all players as soon as API is ready to eliminate playback delay
  useEffect(() => {
    if (!ytReady) return;
    sounds.forEach(s => {
      if (s.videoId) createYTPlayer(s);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const audios = audioRefs.current;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const yts = ytPlayers.current;
      sounds.forEach(s => {
        if (audios[s.name]) { audios[s.name].pause(); audios[s.name].currentTime = 0; }
        if (yts[s.name]) try { yts[s.name].pauseVideo(); } catch {} // eslint-disable-line no-empty
        stopSynth(s);
      });
    };
  }, []);

  const handleActivate = async () => {
    setActivated(true);
    for (const s of sounds) {
      const a = audioRefs.current[s.name];
      if (a) {
        a.muted = true;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.muted = false; }).catch(() => {});
      }
    }
  };

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
        if (color === 'pink') { data[i] = (lastOut + 0.02 * white) / 1.02; lastOut = data[i]; data[i] *= 3.5; }
        else if (color === 'brown') { lastOut = (lastOut + 0.02 * white) / 1.02; data[i] = lastOut; }
        else data[i] = white;
      }
      const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true; return src;
    };
    const gain = ctx.createGain(); gain.gain.value = 0.06;
    const masterLP = ctx.createBiquadFilter(); masterLP.type = 'lowpass'; masterLP.frequency.value = 6000;
    gain.connect(masterLP).connect(ctx.destination);
    const intervals = [];
    let primary, lfo, lfoGain;
    const name = sound.name.toLowerCase();
    if (name.includes('rain')) {
      primary = createNoise('pink'); primary.connect(gain); primary.start();
    } else if (name.includes('ocean')) {
      primary = createNoise('brown'); lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.12;
      lfoGain = ctx.createGain(); lfoGain.gain.value = 0.06; lfo.connect(lfoGain).connect(gain.gain);
      primary.connect(gain); primary.start(); lfo.start();
    } else {
      primary = createNoise('pink'); primary.connect(gain); primary.start();
    }
    synthEngines.current[sound.name] = { ctx, gain, primary, lfo, lfoGain, intervals, started: true };
  };

  const stopSynth = (sound) => {
    const eng = synthEngines.current[sound.name];
    if (!eng) return;
    try {
      if (eng.primary?.stop) eng.primary.stop();
      if (eng.lfo?.stop) eng.lfo.stop();
      if (eng.intervals) eng.intervals.forEach(clearInterval);
      eng.ctx.close();
    } catch {} // eslint-disable-line no-empty
    delete synthEngines.current[sound.name];
  };

  const handleCardClick = (sound) => {
    if (!activated) return;
    const audio = audioRefs.current[sound.name];
    const wasPlaying = !!playing[sound.name];

    // Stop others
    sounds.forEach(s => {
      if (s.name !== sound.name) {
        const a = audioRefs.current[s.name];
        if (a) { a.pause(); a.currentTime = 0; }
        const yt = ytPlayers.current[s.name];
        if (yt && yt.pauseVideo) try { yt.pauseVideo(); } catch {} // eslint-disable-line no-empty
        stopSynth(s);
        setPlaying(prev => ({ ...prev, [s.name]: false }));
      }
    });

    if (wasPlaying) {
      if (audio) { audio.pause(); audio.currentTime = 0; }
      const yt = ytPlayers.current[sound.name];
      if (yt && yt.pauseVideo) try { yt.pauseVideo(); } catch {} // eslint-disable-line no-empty
      stopSynth(sound);
      setPlaying(prev => ({ ...prev, [sound.name]: false }));
    } else {
      if (ytReady && sound.videoId) {
        if (!ytPlayers.current[sound.name]) {
          pendingPlay.current[sound.name] = true;
          createYTPlayer(sound);
          setPlaying(prev => ({ ...prev, [sound.name]: true }));
        } else {
          const p = ytPlayers.current[sound.name];
          if (p && typeof p.playVideo === 'function') p.playVideo();
          else { pendingPlay.current[sound.name] = true; setPlaying(prev => ({ ...prev, [sound.name]: true })); }
        }
      } else {
        playAudioFallback(sound, audio);
      }
    }
  };

  const playAudioFallback = (sound, audio) => {
    if (!audio) return;
    audio.muted = false;
    audio.volume = 1;
    if (useSynth[sound.name]) startSynth(sound);
    else audio.play().then(() => setPlaying(prev => ({ ...prev, [sound.name]: true })))
                   .catch(() => { setUseSynth(p => ({ ...p, [sound.name]: true })); startSynth(sound); setPlaying(prev => ({ ...prev, [sound.name]: true })); });
  };

  const Content = (
    <>
      {!activated && (
        <div className="activation-overlay">
          <button className="template-btn" onClick={handleActivate}>Tap to Enable Sounds</button>
        </div>
      )}
      {!embedded && <button className="template-btn" onClick={() => navigate('/relax')}>← Back</button>}
      <h2>Soundscapes</h2>
      <p>Tap a card to play or pause a relaxing background sound.</p>

      <div className="sound-grid">
        {sounds.map((sound) => (
          <div key={sound.name} className="sound-card" onClick={() => handleCardClick(sound)}>
            <div className="sound-name"><span>{sound.icon}</span> {sound.name}</div>
            <button className="sound-btn" onClick={(e) => { e.stopPropagation(); handleCardClick(sound); }}>
              {playing[sound.name] ? 'Pause' : 'Play'}
            </button>
            <audio ref={el => (audioRefs.current[sound.name] = el)} src={sound.srcs[0]} loop style={{ display: 'none' }} />
          </div>
        ))}
      </div>
      
      {/* Stable container for YouTube iframes - React will NOT manage children here */}
      <div ref={ytContainerRef} className="yt-stable-container" style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: -1 }} />
    </>
  );

  return embedded ? <div>{Content}</div> : <div className="relax-mode-page"><main className="relax-main">{Content}</main></div>;
}

export default RelaxSound;
