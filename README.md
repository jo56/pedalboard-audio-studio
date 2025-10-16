# Pedalboard Audio Studio

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A fullstack web application that provides a beautiful UI for manipulating audio files using [Spotify's Pedalboard](https://github.com/spotify/pedalboard) library. Upload audio files, design complex pedal chains, host VST3 plugins, and save reusable presets.

## Features

- **Drag & Drop File Upload** – MP3, WAV, FLAC, OGG, and M4A support
- **Visual Waveform Display** – Real-time waveform visualization with playback controls
- **Comprehensive Pedalboard Coverage** – 24 native effects including dynamics, filters, modulation, convolution IRs, GSM codec emulation, and more
- **External VST3 Hosting** – Drop compatible plugins in `backend/plugins` and use them in any chain
- **Effect Chain Builder** – Add, remove, and reorder effects with ease
- **Typed Parameter Controls** – Sliders, toggles, selects, and text inputs adjust parameters with live feedback
- **Preset Management** – Save, list, download, and reuse effect chains through the API
- **Download Processed Audio** – Export processed audio with a single click

## Tech Stack

### Backend
- **Python 3.11+**
- **FastAPI** – Modern, fast web framework
- **Pedalboard 0.9.8** – Spotify's audio effects library
- **Uvicorn** – ASGI server

### Frontend
- **React 18** with **TypeScript**
- **Vite** build tooling
- **Tailwind CSS** styling
- **WaveSurfer.js** for waveform rendering
- **Axios** HTTP client

## Project Structure

```
pedalboard-test/
|-- backend/
|   |-- main.py             # FastAPI server
|   |-- effects.py          # Effect registry and processing
|   |-- presets.py          # Preset persistence helpers
|   |-- pyproject.toml      # Python dependencies managed by uv
|   |-- uploads/            # Uploaded audio (runtime)
|   |-- processed/          # Processed audio (runtime)
|   |-- impulses/           # Impulse responses for convolution effects
|   `-- plugins/            # Optional VST3 binaries
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- utils/
|   |   |-- api.ts
|   |   |-- theme.ts
|   |   |-- types.ts
|   |   `-- App.tsx
|   |-- package.json
|   `-- vite.config.ts
|-- README.md
`-- DEPLOYMENT.md
```

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- [uv](https://github.com/astral-sh/uv) (for Python environment and dependency management)
- Node.js 16 or higher
- npm (or yarn/pnpm)

### Backend Setup

```bash
cd backend
uv python install 3.11
uv sync
uv run uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Usage

1. **Upload Audio** – Drag and drop an audio file or click to browse
2. **Add Effects** – Choose effects from the dropdown and click “Add”
3. **Adjust Parameters** – Use sliders, inputs, or selectors per parameter type
4. **Reorder Effects** - Drag any effect header to reposition the chain order
5. **Process Audio** – Click “Process Audio” to render the effect chain
6. **Compare & Download** – Audition original vs processed audio and export
7. **Save Presets (API)** – POST to `/presets` with the current chain to reuse later

### Working with Impulse Responses & VST3 Plugins

- Place impulse responses (WAV/AIFF) in `backend/impulses`. They will appear as options for the Convolution effect.
- Place platform-specific `.vst3` bundles inside `backend/plugins` (or provide absolute paths) to host third-party effects.

## Available Effects

| Effect | Description | Key Parameters |
|--------|-------------|----------------|
| Reverb | Adds spatial ambience | room_size, damping, wet_level |
| Delay | Creates echoes | delay_seconds, feedback, mix |
| Compressor | Controls dynamic range | threshold_db, ratio, attack_ms, release_ms |
| Limiter | Prevents peaks | threshold_db, release_ms |
| Gain | Adjusts level | gain_db |
| Distortion | Harmonic saturation | drive_db |
| Chorus | Modulated thickening | rate_hz, depth, mix |
| Phaser | Sweeping phase cancellations | rate_hz, depth, centre_frequency_hz |
| Bitcrush | Lo-fi bit reduction | bit_depth |
| Highpass | Removes lows | cutoff_frequency_hz |
| Lowpass | Removes highs | cutoff_frequency_hz |
| Ladder Filter | Moog-style filter | mode, cutoff_hz, resonance, drive |
| High/Low Shelf | Tone shaping | cutoff_frequency_hz, gain_db, q |
| Peak Filter | EQ boost/cut | cutoff_frequency_hz, gain_db, q |
| Pitch Shift | Alters pitch | semitones |
| Clipping | Hard clipping | threshold_db |
| MP3 Compressor | Codec artifacts | vbr_quality |
| Resample | Aliasing via resampling | target_sample_rate, quality |
| Noise Gate | Suppresses noise | threshold_db, ratio, attack_ms, release_ms |
| GSM Full Rate | 2G cellular compression | quality |
| Convolution | IR-based filtering | impulse_response, mix |
| Invert | Flips polarity | — |
| VST3 Plugin | Host external plugin | plugin_path, plugin_name, initialization_timeout, parameter_values |

## Preset API

Effect presets are stored as JSON in `backend/presets`. Endpoints:

- `GET /presets` – List stored presets
- `POST /presets` – Create a preset from an effect chain
- `GET /presets/{preset_id}` – Retrieve full preset payload
- `GET /presets/{preset_id}/download` – Download preset JSON
- `DELETE /presets/{preset_id}` – Remove a preset
- `POST /process` – Accepts either an `effects` array or a `preset_id`

Example preset creation payload:

```json
{
  "name": "Bright Guitar",
  "description": "Sparkly chorus and delay",
  "effects": [
    { "type": "chorus", "params": { "depth": 0.35, "mix": 0.5 } },
    { "type": "delay", "params": { "delay_seconds": 0.42, "feedback": 0.3, "mix": 0.4 } }
  ]
}
```

## API Endpoints

- `GET /` – Health check
- `GET /effects` – Available effects with metadata and parameter types
- `GET /presets` – List presets
- `POST /presets` – Save effect preset
- `GET /presets/{preset_id}` – Fetch preset details
- `GET /presets/{preset_id}/download` – Download preset JSON
- `DELETE /presets/{preset_id}` – Delete preset
- `POST /upload` – Upload audio file
- `POST /process` – Process audio with inline `effects` or `preset_id`
- `GET /download/{file_id}` – Download processed audio
- `DELETE /cleanup/{file_id}` – Remove uploaded/processed files

## Deployment

For production deployment instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)** which covers:

- Railway (fullstack deployment - recommended)
- Cloudflare Pages + Railway
- Vercel + Railway
- Render and other alternatives

## Development Notes

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Frontend uses Vite HMR for instant feedback

### Testing / Validation

- Frontend production build: `npm run build`
- Backend modules compile via `python -m compileall backend/*.py`

## Future Enhancements

- [ ] UI for managing presets from the web app
- [ ] Real-time audio preview while editing parameters
- [ ] Batch processing for multiple files
- [ ] Expanded plugin metadata introspection for VST3 hosts
- [ ] Export to multiple audio formats
- [ ] Optional user authentication and cloud storage

## License

MIT License - Copyright (c) 2025 John O'Farrell

This project uses Spotify's Pedalboard library. Refer to the [Pedalboard license](https://github.com/spotify/pedalboard/blob/master/LICENSE) for details on that dependency.

## Acknowledgments

- [Spotify Pedalboard](https://github.com/spotify/pedalboard) — core DSP engine
- Thanks to the FastAPI and React communities for great tooling

