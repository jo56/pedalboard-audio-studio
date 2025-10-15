import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface AudioPlayerProps {
  audioFile: File | string;
  title: string;
}

export default function AudioPlayer({ audioFile, title }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    if (!waveformRef.current) return;

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#d1d5db',
      progressColor: '#2563eb',
      cursorColor: '#1d4ed8',
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 60,
      barGap: 1,
    });

    wavesurferRef.current = wavesurfer;

    // Load audio
    if (typeof audioFile === 'string') {
      wavesurfer.load(audioFile);
    } else {
      const objectUrl = URL.createObjectURL(audioFile);
      wavesurfer.load(objectUrl);
    }

    // Event listeners
    wavesurfer.on('ready', () => {
      setDuration(wavesurfer.getDuration());
    });

    wavesurfer.on('audioprocess', () => {
      setCurrentTime(wavesurfer.getCurrentTime());
    });

    wavesurfer.on('play', () => setIsPlaying(true));
    wavesurfer.on('pause', () => setIsPlaying(false));

    return () => {
      wavesurfer.destroy();
    };
  }, [audioFile]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-xs text-gray-500">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div ref={waveformRef} className="mb-3" />

      <button
        onClick={togglePlayPause}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 text-sm font-medium"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
