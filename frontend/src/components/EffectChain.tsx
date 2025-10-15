import { useState } from 'react';
import type { DragEvent } from 'react';
import type { EffectConfig, AvailableEffects, EffectParam } from '../types';
import EffectControl from './EffectControl';

interface EffectChainProps {
  effects: EffectConfig[];
  availableEffects: AvailableEffects;
  onEffectsChange: (effects: EffectConfig[]) => void;
  onClearEffects: () => void;
}

const defaultValueForParam = (paramDef: EffectParam): any => {
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
      return null;
  }
};

const isInteractiveElement = (element: HTMLElement | null): boolean => {
  if (!element) return false;
  return Boolean(
    element.closest('input, select, textarea, button, [role="slider"], [contenteditable="true"]'),
  );
};

export default function EffectChain({
  effects,
  availableEffects,
  onEffectsChange,
  onClearEffects,
}: EffectChainProps) {
  const [selectedEffectType, setSelectedEffectType] = useState<string>('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);

  const addEffect = () => {
    if (!selectedEffectType) return;

    const effectDef = availableEffects[selectedEffectType];
    if (!effectDef) return;

    const params: Record<string, any> = {};
    Object.entries(effectDef.params).forEach(([key, paramDef]) => {
      params[key] = defaultValueForParam(paramDef);
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

  const handleDragStart = (id: string) => (event: DragEvent<HTMLDivElement>) => {
    if (isInteractiveElement(event.target as HTMLElement)) {
      event.preventDefault();
      return;
    }

    setDraggingId(id);
    setActiveHoverId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);

    const ghost = document.createElement('div');
    ghost.style.width = '0px';
    ghost.style.height = '0px';
    event.dataTransfer.setDragImage(ghost, 0, 0);
  };

  const handleDragOverCard = (targetId: string, targetIndex: number) => (event: DragEvent<HTMLDivElement>) => {
    if (!draggingId) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    if (draggingId === targetId) {
      setActiveHoverId(targetId);
      return;
    }

    const sourceIndex = effects.findIndex((effect) => effect.id === draggingId);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setActiveHoverId(targetId);
      return;
    }

    const updated = [...effects];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    onEffectsChange(updated);
    setDraggingId(moved.id);
    setActiveHoverId(targetId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setActiveHoverId(null);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDraggingId(null);
    setActiveHoverId(null);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Effects</h3>

      <div className="mb-4 space-y-2">
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
        <div className="flex gap-2">
          <button
            onClick={addEffect}
            disabled={!selectedEffectType}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded text-sm font-medium disabled:cursor-not-allowed"
          >
            Add Effect
          </button>
          <button
            onClick={onClearEffects}
            disabled={effects.length === 0}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 px-3 py-2 rounded text-sm font-medium border border-gray-200 disabled:cursor-not-allowed"
          >
            Clear All Effects
          </button>
        </div>
      </div>

      {effects.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No effects added
        </div>
      ) : (
        <div className="space-y-2">
          {effects.map((effect, index) => {
            const definition = availableEffects[effect.type];
            if (!definition) return null;

            const isDragging = draggingId === effect.id;
            const isTarget = activeHoverId === effect.id && !isDragging;

            return (
              <div
                key={effect.id}
                draggable
                onDragStart={handleDragStart(effect.id)}
                onDragOver={handleDragOverCard(effect.id, index)}
                onDragEnter={handleDragOverCard(effect.id, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className={`rounded border transition-shadow ${
                  isDragging
                    ? 'border-blue-400 bg-blue-50 shadow-md'
                    : isTarget
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-transparent bg-white'
                }`}
              >
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

      {effects.length > 0 && (
        <p className="mt-2 text-[11px] text-gray-400">
          Drag any effect card to change its position. The chain updates as you move.
        </p>
      )}
    </div>
  );
}
