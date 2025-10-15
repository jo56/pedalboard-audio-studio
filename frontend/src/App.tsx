import { useState, useEffect } from 'react';
import FileUpload from './components/FileUpload';
import AudioPlayer from './components/AudioPlayer';
import EffectChain from './components/EffectChain';
import { audioAPI } from './api';
import type { AvailableEffects, EffectConfig } from './types';

function App() {
  const [availableEffects, setAvailableEffects] = useState<AvailableEffects>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>('');
  const [effects, setEffects] = useState<EffectConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Load available effects on mount
  useEffect(() => {
    const loadEffects = async () => {
      try {
        const effects = await audioAPI.getEffects();
        setAvailableEffects(effects);
      } catch (err) {
        setError('Failed to load available effects');
        console.error(err);
      }
    };
    loadEffects();
  }, []);

  const handleFileSelected = async (file: File) => {
    setError('');
    setSuccessMessage('');
    setUploadedFile(file);
    setProcessedAudioUrl('');

    try {
      const response = await audioAPI.uploadFile(file);
      setFileId(response.file_id);
      setSuccessMessage('File uploaded successfully!');
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    }
  };

  const handleProcess = async () => {
    if (!fileId) {
      setError('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await audioAPI.processAudio(fileId, effects);
      const downloadUrl = audioAPI.getDownloadUrl(fileId);
      setProcessedAudioUrl(downloadUrl);
      setSuccessMessage('Audio processed successfully!');
    } catch (err) {
      setError('Failed to process audio. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedAudioUrl) {
      window.open(processedAudioUrl, '_blank');
    }
  };

  const handleReset = () => {
    setUploadedFile(null);
    setFileId('');
    setEffects([]);
    setProcessedAudioUrl('');
    setError('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Pedalboard Audio Studio
          </h1>
          <p className="text-violet-100">
            Upload audio files and apply professional effects in real-time
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload & Audio Players */}
          <div className="space-y-6">
            {/* File Upload */}
            {!uploadedFile ? (
              <FileUpload
                onFileSelected={handleFileSelected}
                isProcessing={isProcessing}
              />
            ) : (
              <div className="space-y-4">
                {/* Original Audio */}
                <AudioPlayer audioFile={uploadedFile} title="Original Audio" />

                {/* Processed Audio */}
                {processedAudioUrl && (
                  <AudioPlayer
                    audioFile={processedAudioUrl}
                    title="Processed Audio"
                  />
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || effects.length === 0}
                    className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 px-6 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Process Audio'
                    )}
                  </button>

                  {processedAudioUrl && (
                    <button
                      onClick={handleDownload}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Download
                    </button>
                  )}

                  <button
                    onClick={handleReset}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Effect Chain */}
          <div>
            <EffectChain
              effects={effects}
              availableEffects={availableEffects}
              onEffectsChange={setEffects}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-violet-100 text-sm">
          <p>
            Powered by{' '}
            <a
              href="https://github.com/spotify/pedalboard"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Spotify Pedalboard
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
