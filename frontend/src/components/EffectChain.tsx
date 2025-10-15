import { useState } from 'react';
import type { EffectConfig, AvailableEffects } from '../types';
import EffectControl from './EffectControl';

interface EffectChainProps {
  effects: EffectConfig[];
  availableEffects: AvailableEffects;
  onEffectsChange: (effects: EffectConfig[]) => void;
}

export default function EffectChain({
  effects,
  availableEffects,
  onEffectsChange,
}: EffectChainProps) {
  const [selectedEffectType, setSelectedEffectType] = useState<string>('');

  const addEffect = () => {
    if (!selectedEffectType) return;

    const effectDef = availableEffects[selectedEffectType];
    if (!effectDef) return;

    // Create params object with default values
    const params: Record<string, any> = {};
    Object.entries(effectDef.params).forEach(([key, paramDef]) => {
      params[key] = paramDef.default;
    });

    const newEffect: EffectConfig = {
      id: `${selectedEffectType}-${Date.now()}`,
      type: selectedEffectType,
      params,
    };

    onEffectsChange([...effects, newEffect]);
    setSelectedEffectType('');
  };

  const updateEffect = (index: number, updatedEffect: EffectConfig) => {
    const newEffects = [...effects];
    newEffects[index] = updatedEffect;
    onEffectsChange(newEffects);
  };

  const removeEffect = (index: number) => {
    onEffectsChange(effects.filter((_, i) => i !== index));
  };

  const moveEffect = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === effects.length - 1)
    ) {
      return;
    }

    const newEffects = [...effects];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newEffects[index], newEffects[targetIndex]] = [
      newEffects[targetIndex],
      newEffects[index],
    ];
    onEffectsChange(newEffects);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Effects</h3>

      {/* Add Effect */}
      <div className="mb-4">
        <select
          value={selectedEffectType}
          onChange={(e) => setSelectedEffectType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select effect...</option>
          {Object.entries(availableEffects)
            .sort(([, a], [, b]) => a.name.localeCompare(b.name))
            .map(([key, effect]) => (
              <option key={key} value={key}>
                {effect.name}
              </option>
            ))}
        </select>
        <button
          onClick={addEffect}
          disabled={!selectedEffectType}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium disabled:cursor-not-allowed"
        >
          Add Effect
        </button>
      </div>

      {/* Effect List */}
      {effects.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No effects added
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {effects.map((effect, index) => {
            const definition = availableEffects[effect.type];
            if (!definition) return null;

            return (
              <div key={effect.id} className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveEffect(index, 'up')}
                    disabled={index === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveEffect(index, 'down')}
                    disabled={index === effects.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed p-0.5"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <EffectControl
                    effect={effect}
                    definition={definition}
                    onUpdate={(updated) => updateEffect(index, updated)}
                    onRemove={() => removeEffect(index)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
