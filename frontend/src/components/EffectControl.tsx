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
    <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-800">{definition.name}</h4>
          <p className="text-xs text-gray-500">{definition.description}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="Remove effect"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(definition.params).map(([paramName, paramDef]) => (
          <div key={paramName}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {paramName.replace(/_/g, ' ')}
              </label>
              <span className="text-xs text-gray-500">
                {effect.params[paramName] !== undefined
                  ? typeof effect.params[paramName] === 'number'
                    ? effect.params[paramName].toFixed(2)
                    : effect.params[paramName]
                  : paramDef.default}
              </span>
            </div>

            {paramDef.options ? (
              // Dropdown for options
              <select
                value={effect.params[paramName] || paramDef.default}
                onChange={(e) => handleParamChange(paramName, e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {paramDef.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              // Slider for numeric values
              <input
                type="range"
                min={paramDef.min}
                max={paramDef.max}
                step={(paramDef.max! - paramDef.min!) / 100}
                value={effect.params[paramName] ?? paramDef.default}
                onChange={(e) => handleParamChange(paramName, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
