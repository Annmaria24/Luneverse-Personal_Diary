import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Styles/RelaxMode.css';

const sounds = [
  { name: 'Gentle Rain', icon: '🌧️', src: 'https://cdn.pixabay.com/audio/2022/03/10/audio_3cbad0d51a.mp3' },
  { name: 'Forest Birds', icon: '🌲', src: 'https://cdn.pixabay.com/audio/2021/09/28/audio_0d3c1ee8e1.mp3' },
  { name: 'Ocean Waves', icon: '🌊', src: 'https://cdn.pixabay.com/audio/2021/08/04/audio_2f0f0b1b4e.mp3' },
  { name: 'Crackling Fireplace', icon: '🔥', src: 'https://cdn.pixabay.com/audio/2021/08/09/audio_4a2b3a2f5f.mp3' },
  { name: 'Night Ambience', icon: '🌙', src: 'https://cdn.pixabay.com/audio/2022/03/22/audio_9b7c37a1d7.mp3' },
  { name: 'Cafe Murmur', icon: '☕', src: 'https://cdn.pixabay.com/audio/2022/01/12/audio_3f4a0a0e95.mp3' },
];

function RelaxSound({ embedded = false }) {
  const navigate = useNavigate();
  const audioRefs = useRef({});
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState({});

  // First user gesture to unlock audio
  const handleActivate = () => setActivated(true);

  const handleCardClick = (sound) => {
    if (!activated) return;

    const audio = audioRefs.current[sound.name];
    if (!audio) return;

    // Pause other audios
    sounds.forEach((s) => {
      if (s.name !== sound.name) {
        const otherAudio = audioRefs.current[s.name];
        if (otherAudio) {
          otherAudio.pause();
          otherAudio.currentTime = 0;
        }
      }
    });

    audio.muted = false;
    audio.volume = 1;
    audio.load(); // Ensure audio is loaded

    if (playing[sound.name]) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      audio.play().catch((err) => {
        alert('Your browser blocked autoplay. Please tap the Play button again.');
        console.log('Play blocked:', err);
      });
    }

    setPlaying((prev) => {
      const newState = {};
      sounds.forEach((s) => {
        newState[s.name] = s.name === sound.name ? !prev[s.name] : false;
      });
      return newState;
    });
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
            <audio
              ref={el => (audioRefs.current[sound.name] = el)}
              src={sound.src}
              loop
              preload="auto"
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
