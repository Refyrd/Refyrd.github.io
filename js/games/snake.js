/**
 * Refyrd Arcade Console // Module: Snake
 * High-precision, tactile Snake game with subtle micro-animations.
 */
class SnakeGame {
  constructor(canvas, uiHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = uiHooks; // { onScoreChange, onBestChange, onStateChange, triggerSound }

    // Grid configuration
    this.gridCount = 20;
    this.cellSize = this.canvas.width / this.gridCount;

    // Game state
    this.state = 'READY'; // READY, RUNNING, PAUSED, GAME_OVER
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('refyrd_snake_best') || '0', 10);

    // Snake & movement
    this.snake = [];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.inputQueue = [];

    // Food
    this.food = { x: 15, y: 10 };

    // Timing & animation
    this.tickInterval = 110; // ms per move
    this.lastTickTime = 0;
    this.animationFrameId = null;
    this.eatAnimTimer = 0;

    // Colors matching Hardware Console theme
    this.colors = {
      bg: '#0D0E10',
      gridLines: 'rgba(255, 255, 255, 0.02)',
      snakeHead: '#2E66FF',
      snakeBody: '#224EC4',
      snakeEye: '#FFFFFF',
      food: '#FF9F1C',
      foodInner: '#FFE3A8'
    };

    this.init();
  }

  init() {
    this.reset();
    this.ui.onBestChange(this.bestScore);
    this.startLoop();
  }

  reset() {
    this.score = 0;
    this.ui.onScoreChange(this.score);
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.inputQueue = [];

    const startX = 6;
    const startY = 10;
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY }
    ];

    this.spawnFood();
    this.state = 'READY';
    this.ui.onStateChange(this.state);
  }

  start() {
    if (this.state === 'READY' || this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.ui.onStateChange(this.state);
    } else if (this.state === 'GAME_OVER') {
      this.reset();
      this.state = 'RUNNING';
      this.ui.onStateChange(this.state);
    }
  }

  pause() {
    if (this.state === 'RUNNING') {
      this.state = 'PAUSED';
      this.ui.onStateChange(this.state);
    }
  }

  resume() {
    if (this.state === 'PAUSED') {
      this.state = 'RUNNING';
      this.ui.onStateChange(this.state);
    }
  }

  togglePause() {
    if (this.state === 'RUNNING') {
      this.pause();
    } else if (this.state === 'PAUSED' || this.state === 'READY') {
      this.start();
    }
  }

  spawnFood() {
    let valid = false;
    let newFood = { x: 0, y: 0 };

    while (!valid) {
      newFood.x = Math.floor(Math.random() * this.gridCount);
      newFood.y = Math.floor(Math.random() * this.gridCount);

      valid = !this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    }

    this.food = newFood;
  }

  setDirection(newDir) {
    // Prevent opposite directions
    const lastDir = this.inputQueue.length > 0 
      ? this.inputQueue[this.inputQueue.length - 1] 
      : this.direction;

    if (newDir.x !== -lastDir.x && newDir.y !== -lastDir.y) {
      if (this.inputQueue.length < 2) {
        this.inputQueue.push(newDir);
      }
    }

    if (this.state === 'READY') {
      this.start();
    }
  }

  update(timestamp) {
    if (this.state !== 'RUNNING') return;

    if (timestamp - this.lastTickTime >= this.tickInterval) {
      this.lastTickTime = timestamp;

      // Dequeue next direction
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift();
      }

      // Calculate new head position
      const head = this.snake[0];
      const newHead = {
        x: head.x + this.direction.x,
        y: head.y + this.direction.y
      };

      // Collision with wall
      if (
        newHead.x < 0 ||
        newHead.x >= this.gridCount ||
        newHead.y < 0 ||
        newHead.y >= this.gridCount
      ) {
        this.gameOver();
        return;
      }

      // Collision with self
      if (this.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        this.gameOver();
        return;
      }

      this.snake.unshift(newHead);

      // Check food consumption
      if (newHead.x === this.food.x && newHead.y === this.food.y) {
        this.score += 10;
        this.eatAnimTimer = 8; // subtle ripple duration
        this.ui.onScoreChange(this.score);
        this.ui.triggerSound('eat');

        if (this.score > this.bestScore) {
          this.bestScore = this.score;
          localStorage.setItem('refyrd_snake_best', this.bestScore.toString());
          this.ui.onBestChange(this.bestScore);
        }

        // Slight progressive acceleration every 50 points
        this.tickInterval = Math.max(70, 110 - Math.floor(this.score / 50) * 4);
        this.spawnFood();
      } else {
        this.snake.pop();
      }
    }
  }

  gameOver() {
    this.state = 'GAME_OVER';
    this.ui.triggerSound('hit');
    this.ui.onStateChange(this.state);
  }

  render(timestamp) {
    const ctx = this.ctx;
    const size = this.cellSize;

    // Clear background
    ctx.fillStyle = this.colors.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Subtle technical grid
    ctx.strokeStyle = this.colors.gridLines;
    ctx.lineWidth = 1;
    for (let i = 1; i < this.gridCount; i++) {
      ctx.beginPath();
      ctx.moveTo(i * size, 0);
      ctx.lineTo(i * size, this.canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * size);
      ctx.lineTo(this.canvas.width, i * size);
      ctx.stroke();
    }

    // Render food with subtle micro-breathing scale
    const foodPulse = Math.sin((timestamp || 0) / 240) * 0.08 + 0.96;
    const foodRadius = (size / 2 - 2) * foodPulse;
    const foodCenterX = this.food.x * size + size / 2;
    const foodCenterY = this.food.y * size + size / 2;

    ctx.fillStyle = this.colors.food;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, Math.max(2, foodRadius), 0, Math.PI * 2);
    ctx.fill();

    // Subtle inner specular pip on food
    ctx.fillStyle = this.colors.foodInner;
    ctx.beginPath();
    ctx.arc(foodCenterX - 1.5, foodCenterY - 1.5, Math.max(1, foodRadius * 0.35), 0, Math.PI * 2);
    ctx.fill();

    // Render Snake segments with soft rounded tile corners
    const segRadius = 4;
    const isEating = this.eatAnimTimer > 0;
    if (this.eatAnimTimer > 0) this.eatAnimTimer--;

    this.snake.forEach((segment, index) => {
      const isHead = index === 0;
      let x = segment.x * size + 1.5;
      let y = segment.y * size + 1.5;
      let segSize = size - 3;

      // Subtle pulse on head segment immediately when eating
      if (isHead && isEating) {
        x -= 1;
        y -= 1;
        segSize += 2;
      }

      ctx.fillStyle = isHead ? this.colors.snakeHead : this.colors.snakeBody;
      this.drawRoundedRect(ctx, x, y, segSize, segSize, segRadius);
      ctx.fill();

      // Render subtle direction sensors (eyes) on head
      if (isHead) {
        ctx.fillStyle = this.colors.snakeEye;
        const eyeOffset = 4;
        const eyeSize = 2.5;

        let eye1 = { x: x + 4, y: y + 4 };
        let eye2 = { x: x + segSize - 6, y: y + 4 };

        if (this.direction.x === 1) { // Moving right
          eye1 = { x: x + segSize - 4, y: y + 4 };
          eye2 = { x: x + segSize - 4, y: y + segSize - 6 };
        } else if (this.direction.x === -1) { // Moving left
          eye1 = { x: x + 2, y: y + 4 };
          eye2 = { x: x + 2, y: y + segSize - 6 };
        } else if (this.direction.y === 1) { // Moving down
          eye1 = { x: x + 4, y: y + segSize - 4 };
          eye2 = { x: x + segSize - 6, y: y + segSize - 4 };
        }

        ctx.fillRect(eye1.x, eye1.y, eyeSize, eyeSize);
        ctx.fillRect(eye2.x, eye2.y, eyeSize, eyeSize);
      }
    });
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
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

  startLoop() {
    const loop = (timestamp) => {
      this.update(timestamp);
      this.render(timestamp);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

// Export for app orchestrator
window.SnakeGame = SnakeGame;
