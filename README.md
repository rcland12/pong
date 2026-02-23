# Professional Pong (TypeScript)

A polished Pong experience with responsive canvas artwork, soft neon glow, and AI-assisted defensive play. Written in TypeScript for clarity and maintainability.

## What’s special

- **Design:** Gradient canvas + subtle glow effects + modern UI / scoreboard overlays.
- **Controls:** Left paddle uses `W/S`, right paddle responds to `Arrow Up/Down` and an automatic assist when hands are off the keyboard.
- **Flow:** Start/pause/resume button with a 20-point win target and scoreboard highlights.
- **Tech stack:** TypeScript + DOM Canvas without external frameworks.

## How to run

```bash
cd pong
npm install
npm run build
# serve index.html with any static server (e.g., `npx serve`, `python -m http.server`, or open it directly in a browser)
```

Feel free to drop the entire `pong` folder into a static host, copy `index.html` + `dist/main.js`, or integrate it into a larger landing page.

**Note:** Running inside this chat or in Discord isn’t supported; open the generated `index.html` in a browser tab on any machine with modern Web APIs.
