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
      await audioAPI.processAudio(fileId, effects);
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
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Pedalboard Audio Studio</h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded text-sm">
            {successMessage}
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex gap-6">
          {/* Left Side - Audio */}
          <div className="w-2/3 space-y-4">
            {!uploadedFile ? (
              <FileUpload onFileSelected={handleFileSelected} isProcessing={isProcessing} />
            ) : (
              <>
                <AudioPlayer audioFile={uploadedFile} title="Original" />
                {processedAudioUrl && (
                  <AudioPlayer audioFile={processedAudioUrl} title="Processed" />
                )}

                {/* Action Buttons */}
                <div className="bg-white border border-gray-200 rounded p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleProcess}
                      disabled={isProcessing || effects.length === 0}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : 'Process Audio'}
                    </button>
                    {processedAudioUrl && (
                      <button
                        onClick={handleDownload}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side - Effects */}
          <div className="w-1/3">
            <EffectChain
              effects={effects}
              availableEffects={availableEffects}
              onEffectsChange={setEffects}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
