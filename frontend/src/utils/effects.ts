import type { EffectParam } from '../types';
import { logWarning } from './errorHandler';

/**
 * Generate a unique identifier for an effect instance.
 */
export const createEffectId = (type: string, index?: number): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(16).slice(2);

  if (typeof index === 'number') {
    return `${type}-${timestamp}-${index}-${random}`;
  }

  return `${type}-${timestamp}-${random}`;
};

/**
 * Return the default value for a parameter definition.
 */
export const getDefaultParamValue = (
  paramDef: EffectParam,
  paramKey?: string,
): any => {
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
      if (paramKey) {
        logWarning(`No default value for parameter '${paramKey}'`, 'getDefaultParamValue');
      }
      return null;
  }
};
