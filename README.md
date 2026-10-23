# Brick Blaster

A DX Ball style brick breaker built with React, TypeScript, Vite and HTML5 canvas.

## Run it

```bash
npm install
npm run dev      # start the dev server, then open the link it prints
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Shared leaderboard

The top 3 scores are shared by every player through the `api/scores.ts`
Vercel function, which stores them in Upstash Redis (free tier).

1. In the Vercel dashboard open your project, then **Storage → Create → Upstash (Redis)**
   and connect it to the project. This adds the `KV_REST_API_URL` and
   `KV_REST_API_TOKEN` environment variables.
2. Redeploy.

`npm run dev` doesn't run the API, so the menu shows "Leaderboard unavailable".
To test it locally run `vercel env pull` once, then `vercel dev`.

## Controls

- Move: mouse, touch drag, or Left/Right arrows (A/D)
- Launch the ball and fire lasers: click, tap or Space
- Pause: P or Escape
- Full screen: F or the Full screen button

## Power-ups

| Capsule | Effect |
| --- | --- |
| W | Wide paddle |
| N | Small paddle (bad) |
| M | Multi-ball (splits into 3) |
| S | Slow ball |
| F | Fireball, smashes through bricks |
| G | Sticky paddle, catches the ball |
| L | Laser paddle, hold Space or click to shoot |
| + | Extra life |

## Project structure

```
src/
  App.tsx                 screen switching and saved progress
  screens/
    MainMenu.tsx
    LevelSelect.tsx
    GameScreen.tsx        canvas, game loop, overlays (pause, win, game over)
  components/
    HUD.tsx               score, level, lives, active power-ups
    BrickTitle.tsx
  game/
    types.ts              all shared game types
    constants.ts          sizes, speeds, colors, power-up settings
    levels.ts             level layouts as text grids
    engine.ts             game logic: movement, collisions, power-ups
    renderer.ts           draws everything on the canvas
  hooks/
    useGameLoop.ts        requestAnimationFrame loop with delta time
    useInput.ts           keyboard, mouse and touch input
  utils/
    sound.ts              retro sound effects (Web Audio, no files)
    storage.ts            saves progress in localStorage
```

## How it works

React only renders the menus and HUD. The game itself runs on a `<canvas>`:
`useGameLoop` calls `update()` and `draw()` every frame, and all fast-changing
data lives in a `useRef`, so React doesn't re-render 60 times per second.
The HUD updates only when the score, lives or active effects actually change.

## Add your own level

Open `src/game/levels.ts` and add a 12-character-wide grid:

```ts
{
  name: 'My level',
  grid: [
    '3333....3333',
    '2222SSSS2222',
    '111P1111P111',
  ],
},
```

`.` empty, `1` `2` `3` hit points, `S` steel (unbreakable), `P` always drops a power-up.

Bricks are colored by row. Toughness shows in the brick's shape: plain bricks
break in 1 hit, bricks with a light inner frame take 2, and armored bricks with
corner rivets take 3. A white star marks bricks that always drop a power-up.
