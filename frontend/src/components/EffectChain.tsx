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
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Effect Chain</h3>

      {/* Add Effect Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Effect
        </label>
        <div className="flex gap-2">
          <select
            value={selectedEffectType}
            onChange={(e) => setSelectedEffectType(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Select an effect...</option>
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
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Effect Chain */}
      {effects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No effects added yet. Add an effect to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {effects.map((effect, index) => {
            const definition = availableEffects[effect.type];
            if (!definition) return null;

            return (
              <div key={effect.id} className="relative">
                {/* Reorder buttons */}
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                  <button
                    onClick={() => moveEffect(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveEffect(index, 'down')}
                    disabled={index === effects.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <EffectControl
                  effect={effect}
                  definition={definition}
                  onUpdate={(updated) => updateEffect(index, updated)}
                  onRemove={() => removeEffect(index)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
