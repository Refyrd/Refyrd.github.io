/**
 * Refyrd Arcade Console // Core Platform Orchestrator
 */
(function() {
  // DOM Elements
  const canvas = document.getElementById('game-canvas');
  const screenFrame = document.querySelector('.screen-frame');
  const scoreDisplay = document.getElementById('score-display');
  const bestDisplay = document.getElementById('best-display');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const overlay = document.getElementById('game-overlay');
  const overlayTag = document.getElementById('overlay-tag');
  const overlayMsg = document.getElementById('overlay-message');
  const overlayBtn = document.getElementById('overlay-action-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const soundIndicator = document.getElementById('sound-indicator');

  // Mobile D-Pad Buttons
  const dpadUp = document.getElementById('dpad-up');
  const dpadDown = document.getElementById('dpad-down');
  const dpadLeft = document.getElementById('dpad-left');
  const dpadRight = document.getElementById('dpad-right');

  // Sound Synthesizer via Web Audio API
  let audioCtx = null;
  let isSoundEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine') {
    if (!isSoundEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  function triggerSound(type) {
    if (type === 'eat') {
      playTone(523.25, 0.08, 'triangle'); // C5
      setTimeout(() => playTone(659.25, 0.09, 'triangle'), 60); // E5
    } else if (type === 'hit') {
      playTone(130.81, 0.22, 'sawtooth'); // C3 low buzz
    } else if (type === 'click') {
      playTone(880, 0.03, 'sine');
    }
  }

  // Sound toggle handler
  soundToggle.addEventListener('click', () => {
    initAudio();
    isSoundEnabled = !isSoundEnabled;
    soundToggle.setAttribute('aria-pressed', isSoundEnabled ? 'true' : 'false');
    soundIndicator.textContent = isSoundEnabled ? 'ON' : 'OFF';
    soundIndicator.classList.toggle('active', isSoundEnabled);
    if (isSoundEnabled) triggerSound('click');
  });

  // Score formatter
  function formatScore(num) {
    return num.toString().padStart(3, '0');
  }

  // Score bump animation
  function animateScoreBump() {
    scoreDisplay.classList.remove('score-bump');
    void scoreDisplay.offsetWidth; // Force reflow
    scoreDisplay.classList.add('score-bump');
    setTimeout(() => {
      scoreDisplay.classList.remove('score-bump');
    }, 120);
  }

  // Shake effect on collision
  function triggerFrameShake() {
    screenFrame.classList.remove('shake');
    void screenFrame.offsetWidth;
    screenFrame.classList.add('shake');
    setTimeout(() => {
      screenFrame.classList.remove('shake');
    }, 200);
  }

  // UI Hooks passed to Game
  const uiHooks = {
    onScoreChange: (score) => {
      scoreDisplay.textContent = formatScore(score);
      if (score > 0) animateScoreBump();
    },
    onBestChange: (best) => {
      bestDisplay.textContent = formatScore(best);
    },
    onStateChange: (state) => {
      if (state === 'READY') {
        overlay.classList.remove('hidden');
        overlayTag.textContent = 'READY // НАЧАЛО';
        overlayMsg.textContent = 'Нажмите любую стрелку или [ПРОДОЛЖИТЬ]';
        overlayBtn.textContent = 'СТАРТ';
        btnPause.textContent = 'PAUSE';
      } else if (state === 'RUNNING') {
        overlay.classList.add('hidden');
        btnPause.textContent = 'PAUSE';
      } else if (state === 'PAUSED') {
        overlay.classList.remove('hidden');
        overlayTag.textContent = 'PAUSED // ПАУЗА';
        overlayMsg.textContent = 'Игра на паузе. Нажмите [SPACE] или кнопку ниже';
        overlayBtn.textContent = 'ПРОДОЛЖИТЬ';
        btnPause.textContent = 'RESUME';
      } else if (state === 'GAME_OVER') {
        triggerFrameShake();
        overlay.classList.remove('hidden');
        overlayTag.textContent = 'GAME OVER // СТОЛКНОВЕНИЕ';
        overlayMsg.textContent = 'Счет зафиксирован. Попробуйте еще раз!';
        overlayBtn.textContent = 'ЗАНОВО';
        btnPause.textContent = 'PAUSE';
      }
    },
    triggerSound: (type) => triggerSound(type)
  };

  // Initialize Game Instance
  const currentGame = new SnakeGame(canvas, uiHooks);

  // Overlay button action
  overlayBtn.addEventListener('click', () => {
    initAudio();
    triggerSound('click');
    if (currentGame.state === 'READY' || currentGame.state === 'PAUSED') {
      currentGame.start();
    } else if (currentGame.state === 'GAME_OVER') {
      currentGame.reset();
      currentGame.start();
    }
  });

  // Top action buttons
  btnPause.addEventListener('click', () => {
    initAudio();
    triggerSound('click');
    currentGame.togglePause();
  });

  btnRestart.addEventListener('click', () => {
    initAudio();
    triggerSound('click');
    currentGame.reset();
    currentGame.start();
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    const key = e.key;

    // Movement keys
    if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'Ц' || key === 'ц') {
      e.preventDefault();
      currentGame.setDirection({ x: 0, y: -1 });
    } else if (key === 'ArrowDown' || key === 's' || key === 'S' || key === 'Ы' || key === 'ы') {
      e.preventDefault();
      currentGame.setDirection({ x: 0, y: 1 });
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'Ф' || key === 'ф') {
      e.preventDefault();
      currentGame.setDirection({ x: -1, y: 0 });
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === 'В' || key === 'в') {
      e.preventDefault();
      currentGame.setDirection({ x: 1, y: 0 });
    } else if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      initAudio();
      currentGame.togglePause();
    } else if (key === 'r' || key === 'R' || key === 'К' || key === 'к') {
      e.preventDefault();
      initAudio();
      currentGame.reset();
      currentGame.start();
    }
  });

  // Mobile D-Pad Events
  function attachDpad(element, dir) {
    const handlePress = (e) => {
      e.preventDefault();
      initAudio();
      currentGame.setDirection(dir);
    };
    element.addEventListener('touchstart', handlePress, { passive: false });
    element.addEventListener('mousedown', handlePress);
  }

  attachDpad(dpadUp, { x: 0, y: -1 });
  attachDpad(dpadDown, { x: 0, y: 1 });
  attachDpad(dpadLeft, { x: -1, y: 0 });
  attachDpad(dpadRight, { x: 1, y: 0 });

  // Touch Swipe on Canvas
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener('touchstart', (e) => {
    initAudio();
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 1) {
      const deltaX = e.changedTouches[0].clientX - touchStartX;
      const deltaY = e.changedTouches[0].clientY - touchStartY;
      const minDistance = 20;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minDistance) {
        // Horizontal swipe
        currentGame.setDirection({ x: deltaX > 0 ? 1 : -1, y: 0 });
      } else if (Math.abs(deltaY) >= Math.abs(deltaX) && Math.abs(deltaY) > minDistance) {
        // Vertical swipe
        currentGame.setDirection({ x: 0, y: deltaY > 0 ? 1 : -1 });
      }
    }
  }, { passive: true });
})();
