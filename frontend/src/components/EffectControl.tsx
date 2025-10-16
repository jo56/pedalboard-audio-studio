import type { EffectConfig, EffectDefinition, EffectParam } from '../types';
import type { ThemePreset } from '../theme';
import { cn } from '../utils/classnames';
import { getDefaultParamValue } from '../utils/effects';

interface EffectControlProps {
  effect: EffectConfig;
  definition: EffectDefinition;
  onUpdate: (effect: EffectConfig) => void;
  onRemove: () => void;
  className?: string;
  theme: ThemePreset;
}

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'object') {
    return 'custom';
  }
  return String(value);
};

const castSliderValue = (value: string, paramDef: EffectParam) => {
  if (paramDef.type === 'int') {
    return parseInt(value, 10);
  }
  return parseFloat(value);
};

export default function EffectControl({
  effect,
  definition,
  onUpdate,
  onRemove,
  className,
  theme,
}: EffectControlProps) {
  const handleParamChange = (paramName: string, value: any) => {
    onUpdate({
      ...effect,
      params: {
        ...effect.params,
        [paramName]: value,
      },
    });
  };

  const selectClass = cn(
    'w-full px-2 py-1 text-xs rounded transition-colors focus:outline-none',
    theme.selectClass,
  );
  const inputClass = cn(
    'w-full px-2 py-1 text-xs rounded transition-colors focus:outline-none',
    theme.inputClass,
  );
  const checkboxClass = cn('h-3 w-3 rounded focus:ring-1', theme.checkboxClass);
  const helperTextClass = cn('mt-1 text-[10px]', theme.mutedTextClass);

  const renderControl = (paramName: string, paramDef: EffectParam) => {
    const currentValue =
      effect.params[paramName] ?? getDefaultParamValue(paramDef, paramName);

    if (paramDef.type === 'enum' || paramDef.type === 'file') {
      const options = paramDef.options ?? [];
      return (
        <select
          value={currentValue ?? ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className={selectClass}
        >
          {options.length === 0 && <option value="">No options available</option>}
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (paramDef.type === 'bool') {
      return (
        <label className={cn('inline-flex items-center gap-2 text-xs', theme.mutedTextClass)}>
          <input
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => handleParamChange(paramName, e.target.checked)}
            className={checkboxClass}
          />
          Enabled
        </label>
      );
    }

    if (paramDef.type === 'string') {
      return (
        <input
          type="text"
          value={currentValue ?? ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className={inputClass}
        />
      );
    }

    if (paramDef.type === 'dict') {
      const jsonValue = JSON.stringify(currentValue ?? {}, null, 2);
      return (
        <div>
          <textarea
            value={jsonValue}
            readOnly
            className={cn(
              'w-full h-20 px-2 py-1 text-xs font-mono border border-dashed rounded',
              theme.inputClass,
            )}
          />
          <p className={helperTextClass}>Advanced parameter. Edit via presets or manual API requests.</p>
        </div>
      );
    }

    if (paramDef.min !== undefined && paramDef.max !== undefined) {
      const step = (paramDef.max - paramDef.min) / 100 || 0.01;
      return (
        <input
          type="range"
          min={paramDef.min}
          max={paramDef.max}
          step={step}
          value={currentValue}
          onChange={(e) =>
            handleParamChange(paramName, castSliderValue(e.target.value, paramDef))
          }
          className="w-full h-1 rounded appearance-none cursor-pointer"
          style={{ accentColor: theme.accentColor }}
        />
      );
    }

    return (
      <input
        type="number"
        value={currentValue ?? 0}
        onChange={(e) => handleParamChange(paramName, Number(e.target.value))}
        className={inputClass}
      />
    );
  };

  return (
    <div className={cn('p-3 transition-colors duration-200', className)}>
      <div className="flex items-start justify-between mb-2 cursor-move" data-drag-handle="true" draggable="true">
        <div className="flex-1">
          <h4 className={cn('text-xs font-semibold', theme.headingTextClass)}>{definition.name}</h4>
          <p className={cn('text-xs', theme.mutedTextClass)}>{definition.description}</p>
          {definition.tags && definition.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {definition.tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border',
                    theme.tagClass,
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className={cn('ml-2 transition-colors flex-shrink-0', theme.mutedTextClass, 'hover:text-red-400')}
          title="Remove"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {Object.entries(definition.params).map(([paramName, paramDef]) => {
          const currentValue =
            effect.params[paramName] ?? getDefaultParamValue(paramDef, paramName);

          return (
            <div key={paramName}>
              <div className="flex justify-between items-center mb-1">
                <label className={cn('text-xs capitalize', theme.mutedTextClass)}>
                  {paramName.replace(/_/g, ' ')}
                </label>
                <span className={cn('text-xs font-mono', theme.headingTextClass)}>
                  {formatValue(currentValue)}
                </span>
              </div>
              {renderControl(paramName, paramDef)}
              {paramDef.help && <p className={helperTextClass}>{paramDef.help}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
