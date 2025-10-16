import { useState } from 'react';
import type { DragEvent } from 'react';
import type { EffectConfig, AvailableEffects, EffectParam } from '../types';
import EffectControl from './EffectControl';
import type { ThemePreset } from '../theme-presets';
import { cn } from '../utils/classnames';

interface EffectChainProps {
  effects: EffectConfig[];
  availableEffects: AvailableEffects;
  onEffectsChange: (effects: EffectConfig[]) => void;
  onClearEffects: () => void;
  onExportEffects: () => void;
  onImportEffects: () => void;
  theme: ThemePreset;
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
  onExportEffects,
  onImportEffects,
  theme,
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
      id: `${selectedEffectType}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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

  const handleDragOverCard = (targetId: string, targetIndex: number) => (
    event: DragEvent<HTMLDivElement>,
  ) => {
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

  const panelClass = cn(
    'rounded-3xl p-5 transition-colors duration-300 border backdrop-blur-sm',
    theme.effectPanelClass,
  );
  const baseButtonClass =
    'px-3 py-2 text-sm font-medium rounded transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60';
  const primaryButtonClass = cn(baseButtonClass, theme.buttonPrimaryClass);
  const secondaryButtonClass = cn(baseButtonClass, theme.buttonSecondaryClass);
  const ghostButtonClass = cn(baseButtonClass, theme.buttonGhostClass);
  const selectClass = cn(
    'w-full px-3 py-2 text-sm rounded transition-colors focus:outline-none',
    theme.selectClass,
  );

  return (
    <div className={panelClass}>
      <h3 className={cn('text-sm font-semibold mb-4 uppercase tracking-wide', theme.headingTextClass)}>
        Effects
      </h3>

      <div className="mb-4 space-y-2">
        <select
          value={selectedEffectType}
          onChange={(e) => setSelectedEffectType(e.target.value)}
          className={selectClass}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={addEffect}
            disabled={!selectedEffectType}
            className={cn(primaryButtonClass, 'w-full')}
            type="button"
          >
            Add Effect
          </button>
          <button
            onClick={onClearEffects}
            disabled={effects.length === 0}
            className={cn(secondaryButtonClass, 'w-full')}
            type="button"
          >
            Clear All Effects
          </button>
          <button onClick={onImportEffects} className={cn(ghostButtonClass, 'w-full')} type="button">
            Import Settings
          </button>
          <button
            onClick={onExportEffects}
            disabled={effects.length === 0}
            className={cn(ghostButtonClass, 'w-full')}
            type="button"
          >
            Export Settings
          </button>
        </div>
      </div>

      {effects.length === 0 ? (
        <div className="text-center py-8 text-sm uppercase tracking-wide opacity-70">
          No effects added
        </div>
      ) : (
        <div className="space-y-3">
          {effects.map((effect, index) => {
            const definition = availableEffects[effect.type];
            if (!definition) return null;

            const isDragging = draggingId === effect.id;
            const isTarget = activeHoverId === effect.id && !isDragging;

            const cardClass = cn(
              'rounded-2xl border transition-shadow duration-200',
              theme.effectCardClass,
              isDragging && theme.effectCardActiveClass,
              isTarget && theme.effectCardTargetClass,
            );

            return (
              <div
                key={effect.id}
                draggable
                onDragStart={handleDragStart(effect.id)}
                onDragOver={handleDragOverCard(effect.id, index)}
                onDragEnter={handleDragOverCard(effect.id, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              >
                <EffectControl
                  effect={effect}
                  definition={definition}
                  onUpdate={(updated) => updateEffect(index, updated)}
                  onRemove={() => removeEffect(index)}
                  className={cardClass}
                  theme={theme}
                />
              </div>
            );
          })}
        </div>
      )}

      {effects.length > 0 && (
        <p className={cn('mt-3 text-[11px]', theme.mutedTextClass)}>
          Drag any effect card to change its position. The chain updates as you move.
        </p>
      )}
    </div>
  );
}
