# Pedalboard Audio Studio

A fullstack web application that provides a beautiful UI for manipulating audio files using [Spotify's Pedalboard](https://github.com/spotify/pedalboard) library. Upload audio files and apply professional-grade effects like reverb, delay, compression, distortion, and more - all through an intuitive web interface.

## Features

- **Drag & Drop File Upload** - Easy audio file upload with support for MP3, WAV, FLAC, OGG, and M4A formats
- **Visual Waveform Display** - Real-time waveform visualization with playback controls
- **18+ Audio Effects** - Including:
  - Reverb, Delay, Chorus, Phaser
  - Compressor, Limiter, Gain
  - Distortion, Bitcrush, Clipping
  - Filters (Highpass, Lowpass, Ladder, Shelf)
  - Pitch Shift, MP3 Compressor, Resample
- **Effect Chain Builder** - Add, remove, and reorder effects with ease
- **Real-time Parameter Control** - Adjust effect parameters with intuitive sliders
- **A/B Comparison** - Compare original and processed audio side-by-side
- **Download Processed Audio** - Save your processed audio files

## Tech Stack

### Backend
- **Python 3.8+**
- **FastAPI** - Modern, fast web framework
- **Pedalboard** - Spotify's audio effects library
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **WaveSurfer.js** - Waveform visualization
- **Axios** - HTTP client
- **React Dropzone** - File upload

## Project Structure

```
pedalboard-test/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── effects.py           # Effect processing logic
│   ├── requirements.txt     # Python dependencies
│   ├── uploads/             # Uploaded files (created at runtime)
│   └── processed/           # Processed files (created at runtime)
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── EffectChain.tsx
│   │   │   └── EffectControl.tsx
│   │   ├── api.ts           # API client
│   │   ├── types.ts         # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   └── index.css        # Global styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
  ```bash
  venv\Scripts\activate
  ```
- macOS/Linux:
  ```bash
  source venv/bin/activate
  ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the FastAPI server:
```bash
python main.py
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Usage

1. **Upload Audio**: Drag and drop an audio file or click to browse
2. **Add Effects**: Select effects from the dropdown and click "Add"
3. **Adjust Parameters**: Use sliders to fine-tune effect parameters
4. **Reorder Effects**: Use up/down arrows to change the effect chain order
5. **Process Audio**: Click "Process Audio" to apply the effect chain
6. **Listen & Compare**: Play both original and processed audio
7. **Download**: Save the processed audio file

## Available Effects

| Effect | Description | Key Parameters |
|--------|-------------|----------------|
| Reverb | Adds spatial ambience | Room Size, Damping, Wet/Dry Level |
| Delay | Creates echo effect | Delay Time, Feedback, Mix |
| Compressor | Reduces dynamic range | Threshold, Ratio, Attack, Release |
| Limiter | Prevents volume spikes | Threshold, Release |
| Gain | Adjusts volume | Gain (dB) |
| Distortion | Harmonic distortion | Drive |
| Chorus | Modulated delay for thickness | Rate, Depth, Feedback |
| Phaser | Sweeping phase shift | Rate, Depth, Frequency |
| Bitcrush | Lo-fi digital reduction | Bit Depth |
| Highpass | Removes low frequencies | Cutoff Frequency |
| Lowpass | Removes high frequencies | Cutoff Frequency |
| Ladder Filter | Moog-style filter | Mode, Cutoff, Resonance |
| High/Low Shelf | Boost/cut frequencies | Cutoff, Gain, Q |
| Pitch Shift | Changes pitch | Semitones |
| Clipping | Hard distortion | Threshold |
| MP3 Compressor | Adds MP3 artifacts | VBR Quality |
| Resample | Changes sample rate | Target Sample Rate |

## API Endpoints

- `GET /` - Health check
- `GET /effects` - Get available effects and parameters
- `POST /upload` - Upload audio file
- `POST /process` - Process audio with effect chain
- `GET /download/{file_id}` - Download processed audio
- `DELETE /cleanup/{file_id}` - Clean up files

## Development

### Backend Development

The backend uses FastAPI with automatic API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Development

Hot module replacement is enabled. Changes to components will automatically reload.

## Future Enhancements

- [ ] Preset system (save/load effect chains)
- [ ] Real-time audio preview while adjusting parameters
- [ ] Batch processing multiple files
- [ ] VST plugin support
- [ ] Export to multiple formats
- [ ] User authentication
- [ ] Cloud storage integration
- [ ] Collaborative editing

## License

This project uses Spotify's Pedalboard library. Please refer to the [Pedalboard license](https://github.com/spotify/pedalboard/blob/master/LICENSE) for details.

## Acknowledgments

- [Spotify Pedalboard](https://github.com/spotify/pedalboard) - The amazing audio processing library that powers this app
- Built with FastAPI, React, and modern web technologies
