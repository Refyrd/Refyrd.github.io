# Refyrd Games // Browser Mini-Games Platform

A clean, responsive web hub for lightweight browser mini-games, hosted on GitHub Pages.

[Русская версия (Russian version)](README.ru.md)

## Architecture
- **Main Hub (`/`):** Clean, spacious game catalog showcasing available and upcoming games with consistent alignment and typography.
- **Dedicated Game Pages (`/game-name/`):** Each game resides in its own isolated subfolder, providing dedicated play space, full controls, and navigation back to the hub.

## Design & Accessibility
- Built on a strict 8px modular spacing scale.
- Clear, modern system typography with zero distorted fonts and balanced whitespace.
- Tactile interactions: buttons with real press feedback (`active: translateY(1px)`), custom focus rings (`2px solid #FF9F1C`), and WCAG AA contrast compliance.
- No page scrolling during touch or mouse drag gestures (`touch-action: none`).

## Available Games
1. **Snake (`/snake/`):** Classic grid snake with progressive speed scaling, subtle food breathing, tactile score bumps, touch/mouse swipe controls, complete board victory state, and local high score tracking.
2. **Arkanoid (`/arkanoid/`):** Brick-breaker game with angle-deflection paddle physics, multi-hit reinforced blocks, particle burst effects, 3-life system, and draggable debug menu.
3. **Slot 03:** Reserved for upcoming game.

## Project Structure
```text
Refyrd.github.io/
├── index.html            # Main game catalog & hub
├── css/
│   └── main.css          # Core design system, shared grid, and typography
├── snake/
│   ├── index.html        # Dedicated Snake game page
│   ├── snake.css         # Board layout and animations
│   └── snake.js          # Snake game logic, audio synth, and swipe input
├── arkanoid/
│   ├── index.html        # Dedicated Arkanoid game page
│   ├── arkanoid.css      # Board layout, lives indicator, and animations
│   └── arkanoid.js       # Arkanoid physics engine, particle effects, and controls
├── TODO.md               # Task list and roadmap
├── README.md             # Primary documentation (English)
└── README.ru.md          # Russian documentation
```

## Local Development
Run locally with any static web server:

```bash
# Using Python standard library
python -m http.server 8000
```

## License
MIT License
