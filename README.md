# Browser Mini-Games Platform

A responsive, accessible web hub for lightweight browser mini-games, hosted on GitHub Pages.

[Русская версия (Russian version)](README.ru.md)

## Features
- **Pure Web Stack:** Built with modern HTML5, CSS3, and Vanilla JavaScript with zero runtime dependencies.
- **Crafted UI:** Designed without generic AI templates or sterile layouts, focused on distinct character and high tactile feedback.
- **Accessibility:** Full keyboard navigability (Tab/Enter/Escape), high contrast (WCAG AA compliant), and proper interaction affordances.
- **Mobile Friendly:** Fully responsive design with touch targets meeting the 44px minimum standard.

## Project Structure
```text
Refyrd.github.io/
├── index.html        # Main games catalog and platform shell
├── css/              # Core stylesheets and themes
├── js/               # Game runtime and platform logic
├── games/            # Self-contained mini-game modules
├── TODO.md           # Task list and project progress
├── README.md         # English documentation (primary)
└── README.ru.md      # Russian documentation
```

## Local Development
Since this project uses vanilla web standards, you can run it locally with any static HTTP server or VS Code extension like Live Server:

```bash
# Using Python (built-in)
python -m http.server 8000

# Or open index.html directly in your browser
```

## License
MIT License
