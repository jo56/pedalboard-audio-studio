import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileSelected, isProcessing }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.ogg', '.m4a'],
    },
    multiple: false,
    disabled: isProcessing,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        bg-white border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
        ${isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        max-w-md mx-auto
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <svg
          className="w-12 h-12 text-gray-400"
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
          <p className="text-base text-blue-600 font-medium">Drop file here</p>
        ) : (
          <div>
            <p className="text-base text-gray-700 font-medium mb-1">Drop audio file or click to browse</p>
            <p className="text-sm text-gray-500">Supports MP3, WAV, FLAC, OGG, M4A</p>
          </div>
        )}
      </div>
    </div>
  );
}
