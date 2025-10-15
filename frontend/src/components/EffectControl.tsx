import type { EffectConfig, EffectDefinition, EffectParam } from '../types';

interface EffectControlProps {
  effect: EffectConfig;
  definition: EffectDefinition;
  onUpdate: (effect: EffectConfig) => void;
  onRemove: () => void;
}

const formatValue = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2);
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (value === null || value === undefined) {
    return '—';
  }
  if (typeof value === 'object') {
    return 'custom';
  }
  return String(value);
};

const resolveDefaultValue = (paramKey: string, paramDef: EffectParam): any => {
  if (paramDef.default !== null && paramDef.default !== undefined) {
    return paramDef.default;
  }

  switch (paramDef.type) {
    case 'bool':
      return false;
    case 'dict':
      return {};
    case 'float':
    case 'int':
      return paramDef.min ?? 0;
    case 'enum':
    case 'file':
      return paramDef.options?.[0] ?? '';
    case 'string':
      return '';
    default:
      console.warn(`No default value for parameter '${paramKey}'`);
      return null;
  }
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

  const renderControl = (paramName: string, paramDef: EffectParam) => {
    const currentValue =
      effect.params[paramName] ?? resolveDefaultValue(paramName, paramDef);

    if (paramDef.type === 'enum' || paramDef.type === 'file') {
      const options = paramDef.options ?? [];
      return (
        <select
          value={currentValue ?? ''}
          onChange={(e) => handleParamChange(paramName, e.target.value)}
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
        <label className="inline-flex items-center gap-2 text-xs text-gray-700">
          <input
            type="checkbox"
            checked={Boolean(currentValue)}
            onChange={(e) => handleParamChange(paramName, e.target.checked)}
            className="h-3 w-3 text-blue-600 border-gray-300 rounded"
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
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            className="w-full h-20 px-2 py-1 text-xs font-mono border border-dashed border-gray-300 rounded bg-gray-50 text-gray-500"
          />
          <p className="mt-1 text-[10px] text-gray-400">
            Advanced parameter. Edit via presets or manual API requests.
          </p>
        </div>
      );
    }

    // Numeric controls (float/int)
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
          className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
        />
      );
    }

    return (
      <input
        type="number"
        value={currentValue ?? 0}
        onChange={(e) => handleParamChange(paramName, Number(e.target.value))}
        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    );
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-gray-900">{definition.name}</h4>
          <p className="text-xs text-gray-500">{definition.description}</p>
          {definition.tags && definition.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {definition.tags.map((tag) => (
                <span key={tag} className="text-[10px] uppercase tracking-wide text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 ml-2"
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
            effect.params[paramName] ?? resolveDefaultValue(paramName, paramDef);

          return (
            <div key={paramName}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-600 capitalize">
                  {paramName.replace(/_/g, ' ')}
                </label>
                <span className="text-xs text-gray-900 font-mono">
                  {formatValue(currentValue)}
                </span>
              </div>
              {renderControl(paramName, paramDef)}
              {paramDef.help && (
                <p className="mt-1 text-[10px] text-gray-400">{paramDef.help}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
