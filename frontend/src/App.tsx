import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import FileUpload from './components/FileUpload';
import AudioPlayer from './components/AudioPlayer';
import EffectChain from './components/EffectChain';
import { audioAPI } from './api';
import type { AvailableEffects, EffectConfig } from './types';
import { DEFAULT_THEME, type ThemePreset } from './theme';
import { cn } from './utils/classnames';
import { createEffectId } from './utils/effects';
import { ANIMATION_DURATION } from './constants';
import { handleError, getErrorMessage } from './utils/errorHandler';


function App() {
  const [availableEffects, setAvailableEffects] = useState<AvailableEffects>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isWaitingForVisibleAudio, setIsWaitingForVisibleAudio] = useState(false);
  const [fileId, setFileId] = useState<string>('');
  const [effects, setEffects] = useState<EffectConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string>('');
  const [isProcessedAudioReady, setIsProcessedAudioReady] = useState(false);
  const [pendingSuccessMessage, setPendingSuccessMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [pendingUploadSuccessMessage, setPendingUploadSuccessMessage] = useState<string>('');
  const [uploadAnimationIndex, setUploadAnimationIndex] = useState(0);
  const [processingAnimationIndex, setProcessingAnimationIndex] = useState(0);
  const [errorFading, setErrorFading] = useState(false);
  const [successFading, setSuccessFading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<string>('original');
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const uploadAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingAnimationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const theme: ThemePreset = DEFAULT_THEME;

  useEffect(() => {
    const loadEffects = async () => {
      try {
        const effectsResponse = await audioAPI.getEffects();
        setAvailableEffects(effectsResponse);
      } catch (err) {
        setError('Failed to load available effects');
        handleError(err, 'loadEffects');
      }
    };
    loadEffects();
  }, []);

  useEffect(() => {
    if (error) {
      setErrorFading(false);
      const fadeTimer = setTimeout(() => {
        setErrorFading(true);
      }, ANIMATION_DURATION.MEDIUM);
      const clearTimer = setTimeout(() => {
        setError('');
        setErrorFading(false);
      }, ANIMATION_DURATION.SLOW);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      setSuccessFading(false);
      const fadeTimer = setTimeout(() => {
        setSuccessFading(true);
      }, ANIMATION_DURATION.MEDIUM);
      const clearTimer = setTimeout(() => {
        setSuccessMessage('');
        setSuccessFading(false);
      }, ANIMATION_DURATION.SLOW);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(clearTimer);
      };
    }
  }, [successMessage]);

  useEffect(() => {
    const isLoadingUpload = isUploadingFile || pendingFile !== null || isWaitingForVisibleAudio;

    if (!isLoadingUpload) {
      if (uploadAnimationRef.current) {
        clearInterval(uploadAnimationRef.current);
        uploadAnimationRef.current = null;
      }
      setUploadAnimationIndex(0);
      return;
    }

    if (uploadAnimationRef.current) {
      clearInterval(uploadAnimationRef.current);
    }

    const intervalId = window.setInterval(() => {
      setUploadAnimationIndex((prev) => (prev + 1) % 3);
    }, ANIMATION_DURATION.FAST);
    uploadAnimationRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      uploadAnimationRef.current = null;
    };
  }, [isUploadingFile, pendingFile, isWaitingForVisibleAudio]);

  useEffect(() => {
    const isLoadingAudio = isProcessing || (processedAudioUrl && !isProcessedAudioReady);

    if (!isLoadingAudio) {
      if (processingAnimationRef.current) {
        clearInterval(processingAnimationRef.current);
        processingAnimationRef.current = null;
      }
      setProcessingAnimationIndex(0);
      return;
    }

    if (processingAnimationRef.current) {
      clearInterval(processingAnimationRef.current);
    }

    const intervalId = window.setInterval(() => {
      setProcessingAnimationIndex((prev) => (prev + 1) % 3);
    }, ANIMATION_DURATION.FAST);
    processingAnimationRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
      processingAnimationRef.current = null;
    };
  }, [isProcessing, processedAudioUrl, isProcessedAudioReady]);

  const invalidateProcessedAudio = () => {
    if (processedAudioUrl) {
      setProcessedAudioUrl('');
      setIsProcessedAudioReady(false);
      setPendingSuccessMessage('');
    }
  };

  const handleEffectsChange = (nextEffects: EffectConfig[]) => {
    setEffects(nextEffects);
    if (successMessage) {
      setSuccessMessage('');
    }
    invalidateProcessedAudio();
  };

  const handleFileSelected = async (file: File) => {
    setError('');
    setSuccessMessage('');
    setUploadedFile(null);
    setPendingFile(null);
    setPendingUploadSuccessMessage('');
    setProcessedAudioUrl('');
    setFileId('');
    setIsUploadingFile(true);

    try {
      const response = await audioAPI.uploadFile(file);
      setFileId(response.file_id);
      setPendingUploadSuccessMessage('File uploaded successfully');
      setPendingFile(file);
    } catch (err: any) {
      setError(getErrorMessage(err));
      handleError(err, 'handleFileSelected');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleUploadedAudioReady = () => {
    if (pendingFile) {
      setUploadedFile(pendingFile);
      setPendingFile(null);
      setIsWaitingForVisibleAudio(true);
    }
  };

  const handleVisibleUploadedAudioReady = () => {
    setIsWaitingForVisibleAudio(false);
    if (pendingUploadSuccessMessage) {
      setSuccessMessage(pendingUploadSuccessMessage);
      setPendingUploadSuccessMessage('');
    }
  };

  const handleProcess = async () => {
    if (!fileId) {
      setError('Please upload a file first');
      return;
    }

    setIsProcessing(true);
    setIsProcessedAudioReady(false);
    setError('');
    setSuccessMessage('');
    setPendingSuccessMessage('');

    try {
      const response = await audioAPI.processAudio(fileId, effects);
      const cacheBustedUrl = `${audioAPI.getDownloadUrl(fileId)}?t=${Date.now()}`;
      setProcessedAudioUrl(cacheBustedUrl);
      setPendingSuccessMessage(response.message || 'Audio processed successfully!');
    } catch (err: any) {
      setError(getErrorMessage(err));
      handleError(err, 'handleProcess');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessedAudioReady = () => {
    setIsProcessedAudioReady(true);
    if (pendingSuccessMessage) {
      setSuccessMessage(pendingSuccessMessage);
      setPendingSuccessMessage('');
    }
  };

  const handleClearEffects = async () => {
    handleEffectsChange([]);
    setError('');

    if (!fileId) {
      setSuccessMessage('Effects cleared');
      return;
    }

    try {
      await audioAPI.clearProcessed(fileId);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(getErrorMessage(err));
        return;
      }
    }

    setSuccessMessage('Effects cleared. Processed audio removed');
  };

  const handleExportEffects = () => {
    if (effects.length === 0) {
      setError('Add at least one effect before exporting settings.');
      return;
    }

    const payload = effects.map(({ type, params }) => ({ type, params }));

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `pedalboard-effects-${timestamp}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setSuccessMessage('Effect settings exported successfully');
      setError('');
    } catch (err) {
      handleError(err, 'handleExportEffects');
      setError('Failed to export effect settings.');
    }
  };

  const handleImportClick = () => {
    setError('');
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const importedEffectsRaw = Array.isArray(data)
        ? data
        : Array.isArray(data?.effects)
        ? data.effects
        : null;

      if (!importedEffectsRaw || importedEffectsRaw.length === 0) {
        throw new Error('No effects found in file.');
      }

      const normalized: EffectConfig[] = [];
      importedEffectsRaw.forEach((entry: any, index: number) => {
        if (!entry || typeof entry !== 'object' || !entry.type) {
          throw new Error('Invalid effect entry detected.');
        }
        const typeRaw = String(entry.type);
        const type = typeRaw.toLowerCase();
        const params = entry.params && typeof entry.params === 'object' ? entry.params : {};

        if (!availableEffects[type]) {
          throw new Error(`Unknown effect type: ${typeRaw}`);
        }

        normalized.push({
          id: createEffectId(type, index),
          type,
          params,
        });
      });

      setEffects(normalized);
      invalidateProcessedAudio();
      setSuccessMessage('Effect settings imported successfully.');
      setError('');
    } catch (err: any) {
      handleError(err, 'handleImportFile');
      setError(getErrorMessage(err));
    } finally {
      event.target.value = '';
    }
  };

  const handleDownload = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    if (!fileId) {
      return;
    }

    void (async () => {
      try {
        // Build download URL with format parameter
        const format = downloadFormat === 'original' ? '' : downloadFormat;
        const downloadUrl = format
          ? `${audioAPI.getDownloadUrl(fileId)}?format=${format}`
          : audioAPI.getDownloadUrl(fileId);

        const response = await fetch(downloadUrl);

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;

        if (uploadedFile) {
          const extensionIndex = uploadedFile.name.lastIndexOf('.');
          const hasExtension = extensionIndex > -1;
          const baseName = hasExtension ? uploadedFile.name.slice(0, extensionIndex) : uploadedFile.name;
          const extension = downloadFormat === 'original'
            ? (hasExtension ? uploadedFile.name.slice(extensionIndex) : '.wav')
            : `.${downloadFormat}`;
          anchor.download = `${baseName}-processed${extension}`;
        } else {
          const extension = downloadFormat === 'original' ? '.wav' : `.${downloadFormat}`;
          anchor.download = `processed-audio${extension}`;
        }

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch (err) {
        handleError(err, 'handleDownload');
        setError('Failed to download processed audio. Please try again.');
      }
    })();
  };

  const handleReset = () => {
    setUploadedFile(null);
    setPendingFile(null);
    setIsWaitingForVisibleAudio(false);
    setPendingUploadSuccessMessage('');
    setFileId('');
    setProcessedAudioUrl('');
    setIsProcessedAudioReady(false);
    setPendingSuccessMessage('');
    setError('');
    setSuccessMessage('Audio cleared');
  };

  const baseButtonClass =
    'px-4 py-2 text-sm font-semibold rounded transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';
  const primaryButtonClass = cn(baseButtonClass, theme.buttonPrimaryClass);
  const secondaryButtonClass = cn(baseButtonClass, theme.buttonSecondaryClass);
  const ghostButtonClass = cn(baseButtonClass, theme.buttonGhostClass);
  const headerUsesLightText = theme.headerTitleClass.includes('text-white');
  const isLoadingUploadedAudio = isUploadingFile || pendingFile !== null || isWaitingForVisibleAudio;
  const uploadingMessage = isLoadingUploadedAudio ? `Uploading file${'.'.repeat((uploadAnimationIndex % 3) + 1)}` : '';
  const isLoadingProcessedAudio = isProcessing || (processedAudioUrl && !isProcessedAudioReady);
  const processingMessage = isLoadingProcessedAudio ? `Processing audio${'.'.repeat((processingAnimationIndex % 3) + 1)}` : '';

  return (
    <div className={cn('min-h-screen transition-colors duration-500', theme.bodyClass)}>
      <header
        className={cn(
          'transition-colors duration-500 border-b',
          theme.headerClass,
          headerUsesLightText && 'text-white/90',
        )}
      >
        <div className="max-w-6xl mx-auto px-6 py-6">
          <h1 className={cn('text-2xl font-semibold', theme.headerTitleClass)}>Pedalboard Audio Studio</h1>
        </div>
      </header>

      <main className={cn('max-w-6xl mx-auto px-6 py-6 space-y-6')}>
        {error && (
          <div
            className={cn(
              'group rounded-2xl px-4 py-4 transition-all duration-500 border shadow-lg border-[#b45309]',
              theme.audioPanelClass,
              errorFading && 'opacity-0',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs leading-snug flex-1 font-medium text-[#7c2d12]">{error}</p>
              <button
                type="button"
                className="flex-shrink-0 text-[#b45309] hover:text-[#7c2d12] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label="Dismiss error message"
                onClick={() => setError('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {isLoadingUploadedAudio && (
          <div
            className={cn(
              'group rounded-2xl px-4 py-4 transition-all duration-500 border',
              theme.audioPanelClass,
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className={cn('text-xs leading-snug flex-1', theme.mutedTextClass)}>{uploadingMessage}</p>
              <span
                className="flex-shrink-0 text-slate-500 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-hidden="true"
              >
                ...
              </span>
            </div>
          </div>
        )}
        {isLoadingProcessedAudio && (
          <div
            className={cn(
              'group rounded-2xl px-4 py-4 transition-all duration-500 border',
              theme.audioPanelClass,
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <p className={cn('text-xs leading-snug flex-1', theme.mutedTextClass)}>{processingMessage}</p>
              <span
                className="flex-shrink-0 text-slate-500 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-hidden="true"
              >
                ...
              </span>
            </div>
          </div>
        )}
        {successMessage && (
          <div className={cn(
            'group rounded-2xl px-4 py-4 transition-all duration-500 border',
            theme.audioPanelClass,
            successFading && 'opacity-0'
          )}>
            <div className="flex items-center justify-between gap-3">
              <p className={cn('text-xs leading-snug flex-1', theme.mutedTextClass)}>{successMessage}</p>
              <button
                type="button"
                className="flex-shrink-0 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                aria-label="Dismiss message"
                onClick={() => setSuccessMessage('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className={cn(theme.layoutWrapperClass, 'gap-6')}>
          <div className={theme.effectsWrapperClass}>
            <EffectChain
              effects={effects}
              availableEffects={availableEffects}
              onEffectsChange={handleEffectsChange}
              onClearEffects={handleClearEffects}
              onExportEffects={handleExportEffects}
              onImportEffects={handleImportClick}
              theme={theme}
            />
          </div>

          <div className={theme.mainWrapperClass}>
            <div className={cn('rounded-3xl p-6 space-y-4 transition-colors duration-300 border', theme.mainPanelClass)}>
              {!uploadedFile ? (
                <>
                  <FileUpload onFileSelected={handleFileSelected} isProcessing={isProcessing} theme={theme} />
                  {pendingFile && (
                    <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                      <AudioPlayer
                        audioFile={pendingFile}
                        title="Original"
                        theme={theme}
                        onReady={handleUploadedAudioReady}
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <AudioPlayer
                    audioFile={uploadedFile}
                    title="Original"
                    theme={theme}
                    onReady={handleVisibleUploadedAudioReady}
                  />
                  {processedAudioUrl && (
                    <AudioPlayer
                      audioFile={processedAudioUrl}
                      title="Processed"
                      theme={theme}
                      onReady={handleProcessedAudioReady}
                    />
                  )}

                  <div className="space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleProcess}
                        disabled={isProcessing || effects.length === 0}
                        className={primaryButtonClass}
                      >
                        {isProcessing ? 'Processing…' : 'Process Audio'}
                      </button>
                      {processedAudioUrl && (
                        <>
                          <select
                            value={downloadFormat}
                            onChange={(e) => setDownloadFormat(e.target.value)}
                            className={cn(
                              'px-3 py-2 text-sm font-semibold rounded transition-colors duration-200 border',
                              theme.inputClass || 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                            )}
                          >
                            <option value="original">Original Format</option>
                            <option value="wav">WAV</option>
                            <option value="mp3">MP3</option>
                            <option value="flac">FLAC</option>
                            <option value="ogg">OGG</option>
                          </select>
                          <button onClick={handleDownload} className={secondaryButtonClass}>
                            Download
                          </button>
                        </>
                      )}
                      <button onClick={handleReset} className={ghostButtonClass}>
                        Reset
                      </button>
                    </div>
                    <p className={cn('text-xs leading-snug', theme.mutedTextClass)}>
                      Process renders the current chain against the uploaded audio. Export your chain to
                      reuse settings across sessions or in code.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />
    </div>
  );
}

export default App;
