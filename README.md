# Browser Mini-Games Platform

A responsive, accessible web console for lightweight browser mini-games, hosted on GitHub Pages.

[Русская версия (Russian version)](README.ru.md)

## Design Identity
The platform is crafted with a physical **Hardware Pocket Console** aesthetic (inspired by Teenage Engineering and Playdate). No generic SaaS templates, no bloated frameworks, zero blue-purple gradients, and zero dead controls.

## Features
- **Pure Web Standards:** Built with modern semantic HTML5, modular CSS, and Vanilla JavaScript. Zero build steps, zero external dependencies.
- **Cartridge Architecture:** Modular games system. Each game runs as an isolated cartridge module inside the console frame.
- **Subtle Micro-Animations:** Breathing food pulse, tactile score bump, soft tile corners, and micro-screen shake on collision.
- **Accessibility & Controls:** Full keyboard navigation (WASD, Arrow keys, Space, R), touch swipe, and an on-screen tactile D-pad for mobile devices (meeting the 44px tap target standard).
- **Audio Feedback:** Built-in retro micro-synthesizer using Web Audio API (optional, muted by default with toggle).
- **High Contrast:** Compliant with WCAG AA standards across all text and interactive states.

## Available Games
1. **Snake (Slot 01):** Smooth grid movement, food pulse micro-animation, collision physics, progressive speed scaling, and local storage high score tracking.
2. **Slot 02:** Available for next game.
3. **Slot 03:** Available for next game.

## Project Structure
```text
Refyrd.github.io/
├── index.html            # Main console chassis and runtime
├── css/
│   ├── main.css          # Hardware console theme, layout, and telemetry
│   └── snake.css         # Snake-specific frame styling and animations
├── js/
│   ├── app.js            # Platform orchestrator, Web Audio synth, input handling
│   └── games/
│       └── snake.js      # Snake game engine module
├── TODO.md               # Project roadmap and checklist
├── README.md             # Primary documentation (English)
└── README.ru.md          # Russian documentation
```

## Local Development
Run with any static server or open `index.html` directly in your browser:

```bash
# Using Python built-in server
python -m http.server 8000
```

## License
MIT License
