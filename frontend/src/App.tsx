import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import FileUpload from './components/FileUpload';
import AudioPlayer from './components/AudioPlayer';
import EffectChain from './components/EffectChain';
import { audioAPI } from './api';
import type { AvailableEffects, EffectConfig } from './types';
import { THEME_PRESETS } from './theme-presets';
import type { ThemePreset } from './theme-presets';
import { cn } from './utils/classnames';


const createEffectId = (type: string, index: number) =>
  `${type}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`;

const TOAST_AUTO_HIDE_MS = 4000;
const TOAST_FADE_MS = 300;

type ToastTimers = {
  hide?: ReturnType<typeof setTimeout>;
  clear?: ReturnType<typeof setTimeout>;
};

const clearToastTimers = (timers: ToastTimers) => {
  if (timers.hide !== undefined) {
    clearTimeout(timers.hide);
    timers.hide = undefined;
  }
  if (timers.clear !== undefined) {
    clearTimeout(timers.clear);
    timers.clear = undefined;
  }
};

function App() {
  const [availableEffects, setAvailableEffects] = useState<AvailableEffects>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string>('');
  const [effects, setEffects] = useState<EffectConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAudioUrl, setProcessedAudioUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const defaultTheme =
    THEME_PRESETS.find((preset) => preset.id === 'clay') ?? THEME_PRESETS[0];
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const errorToastTimers = useRef<ToastTimers>({});
  const successToastTimers = useRef<ToastTimers>({});

  const theme: ThemePreset = defaultTheme;

  useEffect(() => {
    const loadEffects = async () => {
      try {
        const effectsResponse = await audioAPI.getEffects();
        setAvailableEffects(effectsResponse);
      } catch (err) {
        setError('Failed to load available effects');
        console.error(err);
      }
    };
    loadEffects();
  }, []);

  useEffect(() => {
    clearToastTimers(errorToastTimers.current);

    if (!error) {
      setShowErrorToast(false);
      return;
    }

    setShowErrorToast(true);

    errorToastTimers.current.hide = setTimeout(() => {
      setShowErrorToast(false);
    }, TOAST_AUTO_HIDE_MS);

    errorToastTimers.current.clear = setTimeout(() => {
      setError('');
      clearToastTimers(errorToastTimers.current);
    }, TOAST_AUTO_HIDE_MS + TOAST_FADE_MS);

    return () => {
      clearToastTimers(errorToastTimers.current);
    };
  }, [error]);

  useEffect(() => {
    clearToastTimers(successToastTimers.current);

    if (!successMessage) {
      setShowSuccessToast(false);
      return;
    }

    setShowSuccessToast(true);

    successToastTimers.current.hide = setTimeout(() => {
      setShowSuccessToast(false);
    }, TOAST_AUTO_HIDE_MS);

    successToastTimers.current.clear = setTimeout(() => {
      setSuccessMessage('');
      clearToastTimers(successToastTimers.current);
    }, TOAST_AUTO_HIDE_MS + TOAST_FADE_MS);

    return () => {
      clearToastTimers(successToastTimers.current);
    };
  }, [successMessage]);

  useEffect(() => {
    return () => {
      clearToastTimers(errorToastTimers.current);
      clearToastTimers(successToastTimers.current);
    };
  }, []);

  const dismissErrorToast = () => {
    if (!error) {
      return;
    }

    clearToastTimers(errorToastTimers.current);
    setShowErrorToast(false);

    errorToastTimers.current.clear = setTimeout(() => {
      setError('');
      clearToastTimers(errorToastTimers.current);
    }, TOAST_FADE_MS);
  };

  const dismissSuccessToast = () => {
    if (!successMessage) {
      return;
    }

    clearToastTimers(successToastTimers.current);
    setShowSuccessToast(false);

    successToastTimers.current.clear = setTimeout(() => {
      setSuccessMessage('');
      clearToastTimers(successToastTimers.current);
    }, TOAST_FADE_MS);
  };

  const invalidateProcessedAudio = () => {
    if (processedAudioUrl) {
      setProcessedAudioUrl('');
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
    setUploadedFile(file);
    setProcessedAudioUrl('');

    try {
      const response = await audioAPI.uploadFile(file);
      setFileId(response.file_id);
      setSuccessMessage('File uploaded successfully');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload file';
      setError(`Upload failed: ${errorMessage}`);
      console.error('Upload error:', err);
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
      const cacheBustedUrl = `${audioAPI.getDownloadUrl(fileId)}?t=${Date.now()}`;
      setProcessedAudioUrl(cacheBustedUrl);
      setSuccessMessage(response.message || 'Audio processed successfully!');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to process audio';
      setError(`Processing failed: ${errorMessage}`);
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
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
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to clear processed audio';
        setError(errorMessage);
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
      console.error('Export failed:', err);
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
        const type = String(entry.type);
        const params = entry.params && typeof entry.params === 'object' ? entry.params : {};

        if (!availableEffects[type]) {
          throw new Error(`Unknown effect type: ${type}`);
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
      console.error('Import failed:', err);
      setError(`Failed to import effect settings: ${err.message || err}`);
    } finally {
      event.target.value = '';
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
    setProcessedAudioUrl('');
    setError('');
    setSuccessMessage('');
  };

  const baseButtonClass =
    'px-4 py-2 text-sm font-semibold rounded transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';
  const primaryButtonClass = cn(baseButtonClass, theme.buttonPrimaryClass);
  const secondaryButtonClass = cn(baseButtonClass, theme.buttonSecondaryClass);
  const ghostButtonClass = cn(baseButtonClass, theme.buttonGhostClass);
  const headerUsesLightText = theme.headerTitleClass.includes('text-white');

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
                <FileUpload onFileSelected={handleFileSelected} isProcessing={isProcessing} theme={theme} />
              ) : (
                <>
                  <AudioPlayer audioFile={uploadedFile} title="Original" theme={theme} />
                  {processedAudioUrl && (
                    <AudioPlayer audioFile={processedAudioUrl} title="Processed" theme={theme} />
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
                        <button onClick={handleDownload} className={secondaryButtonClass}>
                          Download
                        </button>
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

      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2">
        {error && (
          <div
            className={cn(
              'pointer-events-auto w-72 rounded-lg border border-red-500/70 bg-red-600/95 text-red-50 shadow-xl transition-all duration-300 transform',
              showErrorToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            )}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <p className="text-xs leading-snug flex-1">{error}</p>
              <button
                type="button"
                className="text-red-100/80 hover:text-red-50"
                onClick={dismissErrorToast}
                aria-label="Dismiss error message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div
            className={cn(
              'pointer-events-auto w-72 rounded-lg border border-slate-200 bg-white/95 text-slate-900 shadow-xl transition-all duration-300 transform dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100',
              showSuccessToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <p className={cn('text-xs leading-snug flex-1', theme.mutedTextClass)}>{successMessage}</p>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                onClick={dismissSuccessToast}
                aria-label="Dismiss message"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>

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



