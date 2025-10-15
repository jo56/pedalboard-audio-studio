import type { EffectConfig, EffectDefinition } from '../types';

interface EffectControlProps {
  effect: EffectConfig;
  definition: EffectDefinition;
  onUpdate: (effect: EffectConfig) => void;
  onRemove: () => void;
}

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

  return (
    <div className="bg-gray-50 border border-gray-200 rounded p-3">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="text-xs font-semibold text-gray-900">{definition.name}</h4>
          <p className="text-xs text-gray-500">{definition.description}</p>
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
        {Object.entries(definition.params).map(([paramName, paramDef]) => (
          <div key={paramName}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-600 capitalize">
                {paramName.replace(/_/g, ' ')}
              </label>
              <span className="text-xs text-gray-900 font-mono">
                {effect.params[paramName] !== undefined
                  ? typeof effect.params[paramName] === 'number'
                    ? effect.params[paramName].toFixed(2)
                    : effect.params[paramName]
                  : paramDef.default}
              </span>
            </div>

            {paramDef.options ? (
              <select
                value={effect.params[paramName] || paramDef.default}
                onChange={(e) => handleParamChange(paramName, e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {paramDef.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="range"
                min={paramDef.min}
                max={paramDef.max}
                step={(paramDef.max! - paramDef.min!) / 100}
                value={effect.params[paramName] ?? paramDef.default}
                onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-200 rounded appearance-none cursor-pointer accent-blue-600"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
