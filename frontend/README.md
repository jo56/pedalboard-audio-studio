# Pedalboard Audio Studio - Frontend

React + TypeScript client that pairs with the FastAPI backend to provide an audio-focused workspace. The UI lets you assemble and tweak pedalboard chains, audition results, and export presets.

## Requirements

- Node.js 18 or newer
- Backend API running locally on `http://localhost:8000` (or configure `VITE_API_URL`)

## Available Scripts

- `npm run dev` - start Vite with hot module reloading
- `npm run build` - type-check with `tsc -b` and produce a production build
- `npm run lint` - lint the project with ESLint
- `npm run preview` - preview the production build locally

Install dependencies once before running scripts:

```bash
npm install
```

## Configuration

The frontend expects a `.env` file or environment variable named `VITE_API_URL` when the backend is not on the default `http://localhost:8000`.

```bash
echo "VITE_API_URL=https://your-backend.example.com" > .env
```

WaveSurfer and file uploads require the backend to serve audio files with CORS enabled (already configured in `backend/main.py`).

## Project Layout

- `src/App.tsx` - main application shell and orchestration
- `src/api.ts` - axios client for backend endpoints
- `src/components/` - UI building blocks (file upload, effect chain, audio player)
- `src/utils/` - utility helpers for classnames, color handling, and effect defaults
- `src/theme.ts` - single source of truth for the clay-inspired design system

Static assets live in `public/` and are copied verbatim to the build output.

## Design Notes

- Reordering effects is handled via native drag-and-drop; grab any effect header to move it.
- Waveform rendering uses [WaveSurfer.js](https://wavesurfer-js.org/). The color palette derives from the accent colors defined in `src/theme.ts`.
- The theme file exports a `DEFAULT_THEME`. Adjust class strings there if you want to reskin the interface.

## Testing Changes

Run `npm run lint` to surface TypeScript and lint issues during development. For a production confidence check, build the project:

```bash
npm run build
```

This mirrors the command used in CI/CD pipelines and ensures type safety plus optimized assets.
