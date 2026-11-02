/**
 * Snake Mini-Game // Refyrd Games
 * Features swipe/drag touch and mouse navigation, victory state, and debug controls.
 */
(function() {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const screenBox = document.querySelector('.canvas-screen-box');
  const scoreDisplay = document.getElementById('score-display');
  const bestDisplay = document.getElementById('best-display');
  const btnPause = document.getElementById('btn-pause');
  const btnRestart = document.getElementById('btn-restart');
  const overlay = document.getElementById('game-overlay');
  const overlayHeading = document.getElementById('overlay-heading');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayBtn = document.getElementById('overlay-btn');
  const soundToggle = document.getElementById('sound-toggle');
  const soundStatus = document.getElementById('sound-status');
  const debugBadge = document.getElementById('debug-badge');

  // Debug Modal Elements
  const debugModal = document.getElementById('debug-modal');
  const dbgAddLength = document.getElementById('dbg-add-length');
  const dbgSoundEat = document.getElementById('dbg-sound-eat');
  const dbgSoundHit = document.getElementById('dbg-sound-hit');
  const dbgWin = document.getElementById('dbg-win');
  const dbgGameover = document.getElementById('dbg-gameover');
  const dbgClose = document.getElementById('dbg-close');

  // Audio Synthesizer
  let audioCtx = null;
  let isSoundOn = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine') {
    if (!isSoundOn || !audioCtx) return;
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
    } catch (e) {}
  }

  function playSound(name) {
    if (name === 'eat') {
      playTone(523.25, 0.08, 'triangle');
      setTimeout(() => playTone(659.25, 0.08, 'triangle'), 60);
    } else if (name === 'hit') {
      playTone(130.81, 0.2, 'sawtooth');
    } else if (name === 'win') {
      playTone(523.25, 0.1, 'triangle');
      setTimeout(() => playTone(659.25, 0.1, 'triangle'), 100);
      setTimeout(() => playTone(783.99, 0.12, 'triangle'), 200);
      setTimeout(() => playTone(1046.5, 0.25, 'triangle'), 300);
    } else if (name === 'click') {
      playTone(880, 0.03, 'sine');
    }
  }

  soundToggle.addEventListener('click', () => {
    initAudio();
    isSoundOn = !isSoundOn;
    soundToggle.setAttribute('aria-pressed', isSoundOn ? 'true' : 'false');
    soundStatus.textContent = isSoundOn ? 'on' : 'off';
    if (isSoundOn) playSound('click');
  });

  // Game Engine & State
  const gridCount = 20;
  const totalCells = gridCount * gridCount;
  const cellSize = canvas.width / gridCount;

  let state = 'READY'; // READY, RUNNING, PAUSED, GAME_OVER, VICTORY
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('refyrd_snake_best') || '0', 10);
  bestDisplay.textContent = String(bestScore).padStart(3, '0');

  // Cheats / Debug state tracker
  let isDebugSession = false;
  let pauseClicks = 0;
  let pauseClickTimer = null;

  let snake = [];
  let direction = { x: 1, y: 0 };
  let inputQueue = [];
  let food = { x: 15, y: 10 };

  let tickInterval = 110;
  let lastTickTime = 0;
  let eatPulseTimer = 0;

  function markDebugUsed() {
    if (!isDebugSession) {
      isDebugSession = true;
      debugBadge.classList.remove('hidden');
    }
  }

  function resetGame() {
    score = 0;
    scoreDisplay.textContent = '000';
    direction = { x: 1, y: 0 };
    inputQueue = [];
    tickInterval = 110;
    isDebugSession = false;
    debugBadge.classList.add('hidden');

    const startX = 6;
    const startY = 10;
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    spawnFood();
    state = 'READY';
    showOverlay('Ready', 'Swipe across the screen or use Arrows/WASD to steer.', 'Start Game');
    btnPause.textContent = 'Pause';
  }

  function spawnFood() {
    if (snake.length >= totalCells) {
      triggerVictory();
      return;
    }
    let valid = false;
    while (!valid) {
      const rx = Math.floor(Math.random() * gridCount);
      const ry = Math.floor(Math.random() * gridCount);
      if (!snake.some(seg => seg.x === rx && seg.y === ry)) {
        food = { x: rx, y: ry };
        valid = true;
      }
    }
  }

  function setDirection(newDir) {
    const lastDir = inputQueue.length > 0 ? inputQueue[inputQueue.length - 1] : direction;
    if (newDir.x !== -lastDir.x && newDir.y !== -lastDir.y) {
      if (inputQueue.length < 2) {
        inputQueue.push(newDir);
      }
    }
    if (state === 'READY') {
      startGame();
    }
  }

  function startGame() {
    state = 'RUNNING';
    hideOverlay();
    btnPause.textContent = 'Pause';
  }

  function pauseGame() {
    if (state === 'RUNNING') {
      state = 'PAUSED';
      showOverlay('Paused', 'Game paused. Press Space or tap the button below.', 'Resume');
      btnPause.textContent = 'Resume';
    }
  }

  function resumeGame() {
    if (state === 'PAUSED') {
      state = 'RUNNING';
      hideOverlay();
      btnPause.textContent = 'Pause';
    }
  }

  function togglePause() {
    if (state === 'RUNNING') pauseGame();
    else if (state === 'PAUSED') resumeGame();
    else if (state === 'READY') startGame();
  }

  function triggerGameOver() {
    state = 'GAME_OVER';
    playSound('hit');

    screenBox.classList.remove('shake');
    void screenBox.offsetWidth;
    screenBox.classList.add('shake');
    setTimeout(() => screenBox.classList.remove('shake'), 200);

    showOverlay('Game Over', 'The snake crashed into a wall or its own tail.', 'Play Again');
    btnPause.textContent = 'Pause';
  }

  function triggerVictory() {
    state = 'VICTORY';
    playSound('win');
    showOverlay('Victory!', 'Congratulations! The snake filled the entire board. You beat the game!', 'Play Again');
    btnPause.textContent = 'Pause';
  }

  function showOverlay(heading, desc, btnText) {
    overlayHeading.textContent = heading;
    overlayDesc.textContent = desc;
    overlayBtn.textContent = btnText;
    overlay.classList.remove('hidden');
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  function animateScoreBump() {
    scoreDisplay.classList.remove('score-bump');
    void scoreDisplay.offsetWidth;
    scoreDisplay.classList.add('score-bump');
    setTimeout(() => scoreDisplay.classList.remove('score-bump'), 120);
  }

  // Update Loop
  function update(timestamp) {
    if (state !== 'RUNNING') return;

    if (timestamp - lastTickTime >= tickInterval) {
      lastTickTime = timestamp;

      if (inputQueue.length > 0) {
        direction = inputQueue.shift();
      }

      const head = snake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
      };

      // Wall collision
      if (newHead.x < 0 || newHead.x >= gridCount || newHead.y < 0 || newHead.y >= gridCount) {
        triggerGameOver();
        return;
      }

      // Self collision
      if (snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        triggerGameOver();
        return;
      }

      snake.unshift(newHead);

      // Eat food
      if (newHead.x === food.x && newHead.y === food.y) {
        score += 10;
        eatPulseTimer = 6;
        scoreDisplay.textContent = String(score).padStart(3, '0');
        animateScoreBump();
        playSound('eat');

        // Only save high score if debug/cheat mode was NOT used
        if (!isDebugSession && score > bestScore) {
          bestScore = score;
          localStorage.setItem('refyrd_snake_best', bestScore.toString());
          bestDisplay.textContent = String(bestScore).padStart(3, '0');
        }

        if (snake.length >= totalCells) {
          triggerVictory();
          return;
        }

        tickInterval = Math.max(70, 110 - Math.floor(score / 50) * 4);
        spawnFood();
      } else {
        snake.pop();
      }
    }
  }

  // Render Loop
  function render(timestamp) {
    ctx.fillStyle = '#0D0E11';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle precision grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let i = 1; i < gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Food with subtle breathing
    const pulse = Math.sin((timestamp || 0) / 260) * 0.08 + 0.94;
    const foodRadius = (cellSize / 2 - 2) * pulse;
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;

    ctx.fillStyle = '#FF9F1C';
    ctx.beginPath();
    ctx.arc(fx, fy, Math.max(2, foodRadius), 0, Math.PI * 2);
    ctx.fill();

    // Food inner reflection pip
    ctx.fillStyle = '#FFE5B4';
    ctx.beginPath();
    ctx.arc(fx - 1.5, fy - 1.5, Math.max(1, foodRadius * 0.35), 0, Math.PI * 2);
    ctx.fill();

    // Snake rendering
    const segRadius = 4;
    const isEating = eatPulseTimer > 0;
    if (eatPulseTimer > 0) eatPulseTimer--;

    snake.forEach((segment, index) => {
      const isHead = index === 0;
      let x = segment.x * cellSize + 1.5;
      let y = segment.y * cellSize + 1.5;
      let size = cellSize - 3;

      if (isHead && isEating) {
        x -= 1;
        y -= 1;
        size += 2;
      }

      ctx.fillStyle = isHead ? '#2E66FF' : '#1F4ECC';
      drawRoundedRect(ctx, x, y, size, size, segRadius);
      ctx.fill();

      // Head eyes
      if (isHead) {
        ctx.fillStyle = '#FFFFFF';
        const eyeSize = 2.5;
        let eye1 = { x: x + 4, y: y + 4 };
        let eye2 = { x: x + size - 6, y: y + 4 };

        if (direction.x === 1) {
          eye1 = { x: x + size - 4, y: y + 4 };
          eye2 = { x: x + size - 4, y: y + size - 6 };
        } else if (direction.x === -1) {
          eye1 = { x: x + 2, y: y + 4 };
          eye2 = { x: x + 2, y: y + size - 6 };
        } else if (direction.y === 1) {
          eye1 = { x: x + 4, y: y + size - 4 };
          eye2 = { x: x + size - 6, y: y + size - 4 };
        }

        ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize);
        ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize);
      }
    });
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function gameLoop(timestamp) {
    update(timestamp);
    render(timestamp);
    requestAnimationFrame(gameLoop);
  }

  // 10 Clicks on Pause to trigger Debug Menu
  btnPause.addEventListener('click', () => {
    initAudio();
    playSound('click');

    pauseClicks++;
    clearTimeout(pauseClickTimer);
    pauseClickTimer = setTimeout(() => {
      pauseClicks = 0;
    }, 2500);

    if (pauseClicks >= 10) {
      pauseClicks = 0;
      pauseGame();
      debugModal.classList.remove('hidden');
      return;
    }

    togglePause();
  });

  // Debug Actions
  dbgClose.addEventListener('click', () => {
    debugModal.classList.add('hidden');
  });

  // Draggable Debug Window Controller
  const debugHandle = document.getElementById('debug-drag-handle');
  let isDraggingDebug = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  debugHandle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#dbg-close')) return;
    isDraggingDebug = true;
    try { debugHandle.setPointerCapture(e.pointerId); } catch (err) {}
    const rect = debugModal.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
  });

  debugHandle.addEventListener('pointermove', (e) => {
    if (!isDraggingDebug) return;
    const winWidth = window.innerWidth;
    const winHeight = window.innerHeight;
    const modalWidth = debugModal.offsetWidth;
    const modalHeight = debugModal.offsetHeight;

    const newX = Math.max(8, Math.min(winWidth - modalWidth - 8, e.clientX - dragOffsetX));
    const newY = Math.max(8, Math.min(winHeight - modalHeight - 8, e.clientY - dragOffsetY));

    debugModal.style.left = `${newX}px`;
    debugModal.style.top = `${newY}px`;
    debugModal.style.transform = 'none';
  });

  function stopDragDebug(e) {
    if (isDraggingDebug) {
      isDraggingDebug = false;
      try { debugHandle.releasePointerCapture(e.pointerId); } catch (err) {}
    }
  }

  debugHandle.addEventListener('pointerup', stopDragDebug);
  debugHandle.addEventListener('pointercancel', stopDragDebug);

  dbgAddLength.addEventListener('click', () => {
    markDebugUsed();
    const tail = snake[snake.length - 1];
    for (let i = 0; i < 5; i++) {
      snake.push({ x: tail.x, y: tail.y });
    }
    playSound('eat');
  });

  dbgSoundEat.addEventListener('click', () => {
    initAudio();
    playSound('eat');
  });

  dbgSoundHit.addEventListener('click', () => {
    initAudio();
    playSound('hit');
  });

  dbgWin.addEventListener('click', () => {
    markDebugUsed();
    triggerVictory();
  });

  dbgGameover.addEventListener('click', () => {
    markDebugUsed();
    triggerGameOver();
  });

  // Overlay Action Button
  overlayBtn.addEventListener('click', () => {
    initAudio();
    playSound('click');
    if (state === 'READY' || state === 'PAUSED') {
      startGame();
    } else if (state === 'GAME_OVER' || state === 'VICTORY') {
      resetGame();
      startGame();
    }
  });

  btnRestart.addEventListener('click', () => {
    initAudio();
    playSound('click');
    resetGame();
    startGame();
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === 'Ц' || key === 'ц') {
      e.preventDefault();
      setDirection({ x: 0, y: -1 });
    } else if (key === 'ArrowDown' || key === 's' || key === 'S' || key === 'Ы' || key === 'ы') {
      e.preventDefault();
      setDirection({ x: 0, y: 1 });
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === 'Ф' || key === 'ф') {
      e.preventDefault();
      setDirection({ x: -1, y: 0 });
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === 'В' || key === 'в') {
      e.preventDefault();
      setDirection({ x: 1, y: 0 });
    } else if (key === ' ' || key === 'Spacebar') {
      e.preventDefault();
      initAudio();
      togglePause();
    } else if (key === 'r' || key === 'R' || key === 'К' || key === 'к') {
      e.preventDefault();
      initAudio();
      resetGame();
      startGame();
    }
  });

  // Unified Pointer & Touch Swipe Drag Controller (Zero Page Scrolling)
  let startX = 0;
  let startY = 0;
  let isPointerDown = false;
  const minSwipeDistance = 16;

  function handleGestureStart(x, y) {
    initAudio();
    startX = x;
    startY = y;
    isPointerDown = true;
  }

  function handleGestureMove(x, y, preventFn) {
    if (!isPointerDown) return;
    const dx = x - startX;
    const dy = y - startY;

    if (Math.abs(dx) >= minSwipeDistance || Math.abs(dy) >= minSwipeDistance) {
      if (preventFn) preventFn();

      if (Math.abs(dx) > Math.abs(dy)) {
        setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
      } else {
        setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
      }
      startX = x;
      startY = y;
    }
  }

  function handleGestureEnd() {
    isPointerDown = false;
  }

  // Touch Events (passive: false is necessary to call preventDefault and stop scrolling)
  screenBox.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      handleGestureStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: false });

  screenBox.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      e.preventDefault(); // Stop mobile screen scrolling completely
      handleGestureMove(e.touches[0].clientX, e.touches[0].clientY, () => e.preventDefault());
    }
  }, { passive: false });

  screenBox.addEventListener('touchend', () => {
    handleGestureEnd();
  }, { passive: true });

  screenBox.addEventListener('touchcancel', () => {
    handleGestureEnd();
  }, { passive: true });

  // Mouse Drag Events
  screenBox.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      handleGestureStart(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isPointerDown) {
      handleGestureMove(e.clientX, e.clientY, () => e.preventDefault());
    }
  });

  window.addEventListener('mouseup', () => {
    handleGestureEnd();
  });

  // Start
  resetGame();
  requestAnimationFrame(gameLoop);
})();
