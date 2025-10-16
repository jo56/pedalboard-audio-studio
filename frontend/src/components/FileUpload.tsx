import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ThemePreset } from '../theme';
import { cn } from '../utils/classnames';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
  theme: ThemePreset;
}

export default function FileUpload({ onFileSelected, isProcessing, theme }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.ogg', '.m4a'],
    },
    multiple: false,
    disabled: isProcessing,
  });

  const dropzoneClass = cn(
    'border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all max-w-xl mx-auto',
    theme.dropzoneBaseClass,
    isDragActive && theme.dropzoneActiveClass,
    isProcessing && theme.dropzoneDisabledClass,
  );

  return (
    <div {...getRootProps()} className={dropzoneClass}>
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        {isDragActive ? (
          <p className={cn('text-base font-medium uppercase tracking-wide', theme.headingTextClass)}>
            Drop file here
          </p>
        ) : (
          <div className="space-y-1">
            <p className={cn('text-base font-medium', theme.headingTextClass)}>
              Drop audio file or click to browse
            </p>
            <p className={cn('text-sm', theme.mutedTextClass)}>Supports MP3, WAV, FLAC, OGG, M4A</p>
          </div>
        )}
      </div>
    </div>
  );
}
