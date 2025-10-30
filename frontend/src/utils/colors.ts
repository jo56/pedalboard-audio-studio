type RgbColor = { r: number; g: number; b: number };

const clampChannel = (value: number): number => {
  if (Number.isNaN(value)) return 0;
  return Math.min(255, Math.max(0, value));
};

const parseHex = (hex: string): RgbColor | null => {
  let normalized = hex.replace('#', '').trim();

  if (normalized.length === 3) {
    normalized = normalized
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (normalized.length === 8) {
    normalized = normalized.slice(0, 6);
  }

  if (normalized.length !== 6) return null;

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
};

const parseRgbString = (input: string): RgbColor | null => {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const [r, g, b] = match[1]
    .split(',')
    .slice(0, 3)
    .map((value) => Number.parseFloat(value.trim()));

  if ([r, g, b].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return { r, g, b };
};

const parseColor = (color: string): RgbColor | null => {
  const trimmed = color.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('#')) {
    return parseHex(trimmed);
  }

  return parseRgbString(trimmed);
};

const toRgbaString = ({ r, g, b }: RgbColor, alpha: number): string => {
  return `rgba(${Math.round(clampChannel(r))}, ${Math.round(clampChannel(g))}, ${Math.round(clampChannel(b))}, ${alpha})`;
};

const mixRgb = (base: RgbColor, target: RgbColor, amount: number): RgbColor => {
  const weight = Math.min(1, Math.max(0, amount));
  const inverse = 1 - weight;
  return {
    r: base.r * inverse + target.r * weight,
    g: base.g * inverse + target.g * weight,
    b: base.b * inverse + target.b * weight,
  };
};

const relativeLuminance = ({ r, g, b }: RgbColor): number => {
  const transform = (channel: number) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const [rLin, gLin, bLin] = [transform(r), transform(g), transform(b)];

  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};

export const getMutedWaveColor = (color: string): string => {
  const rgb = parseColor(color);
  if (!rgb) return 'rgba(49, 64, 88, 0.45)';

  const luminance = relativeLuminance(rgb);
  const darkNeutral: RgbColor = { r: 28, g: 36, b: 54 };
  const lightNeutral: RgbColor = { r: 226, g: 230, b: 238 };

  if (luminance >= 0.65) {
    const adjusted = mixRgb(rgb, darkNeutral, 0.45);
    return toRgbaString(adjusted, 0.58);
  }

  if (luminance <= 0.25) {
    const adjusted = mixRgb(rgb, lightNeutral, 0.58);
    return toRgbaString(adjusted, 0.36);
  }

  const anchor = luminance > 0.45 ? darkNeutral : lightNeutral;
  const amount = luminance > 0.45 ? 0.42 : 0.48;
  return toRgbaString(mixRgb(rgb, anchor, amount), 0.44);
};
