import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import type { ThemePreset } from '../theme';
import { cn } from '../utils/classnames';
import { getMutedWaveColor } from '../utils/colors';

interface AudioPlayerProps {
  audioFile: File | string;
  title: string;
  theme: ThemePreset;
}

export default function AudioPlayer({ audioFile, title, theme }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const accentColor = theme.accentColor ?? theme.waveProgressColor;
  const waveColor = useMemo(
    () => getMutedWaveColor(theme.waveColor ?? accentColor),
    [theme.waveColor, accentColor],
  );
  const waveProgressColor = useMemo(() => accentColor, [accentColor]);

  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor,
      progressColor: waveProgressColor,
      cursorColor: waveProgressColor,
      barWidth: 2,
      barRadius: 2,
      cursorWidth: 1,
      height: 60,
      barGap: 1,
    });

    wavesurferRef.current = wavesurfer;

    let objectUrl: string | undefined;

    if (typeof audioFile === 'string') {
      wavesurfer.load(audioFile);
    } else {
      objectUrl = URL.createObjectURL(audioFile);
      wavesurfer.load(objectUrl);
    }

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
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [audioFile, waveColor, waveProgressColor]);

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
    <div className={cn('rounded-3xl p-5 transition-colors duration-300 border', theme.audioPanelClass)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={cn('text-sm font-semibold uppercase tracking-wide', theme.headingTextClass)}>
          {title}
        </h3>
        <span className={cn('text-xs font-mono', theme.mutedTextClass)}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div ref={waveformRef} className="mb-3" />

      <button
        onClick={togglePlayPause}
        className={cn(
          'px-4 py-2 text-sm font-semibold rounded transition-colors duration-200',
          theme.audioPlayButtonClass,
        )}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
