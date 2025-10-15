export type LayoutVariant =
  | 'split-left'
  | 'split-right'
  | 'stacked'
  | 'stacked-reverse'
  | 'theater'
  | 'columns'
  | 'grid';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  layout: LayoutVariant;
  bodyClass: string;
  headerClass: string;
  headerTitleClass: string;
  layoutWrapperClass: string;
  effectsWrapperClass: string;
  mainWrapperClass: string;
  effectPanelClass: string;
  mainPanelClass: string;
  effectCardClass: string;
  effectCardActiveClass: string;
  effectCardTargetClass: string;
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
  buttonGhostClass: string;
  tagClass: string;
  mutedTextClass: string;
  headingTextClass: string;
  selectClass: string;
  inputClass: string;
  checkboxClass: string;
  dropzoneBaseClass: string;
  dropzoneActiveClass: string;
  dropzoneDisabledClass: string;
  audioPanelClass: string;
  audioPlayButtonClass: string;
  accentColor: string;
  waveColor: string;
  waveProgressColor: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'neonPulse',
    name: 'Neon Pulse',
    description: 'Dark synthwave gradients with neon cyan accents and glass surfaces.',
    layout: 'split-left',
    bodyClass:
      'bg-gradient-to-br from-slate-950 via-purple-900 to-emerald-700 text-slate-100',
    headerClass: 'bg-transparent border-b border-purple-700/40',
    headerTitleClass: 'text-cyan-300',
    layoutWrapperClass: 'flex flex-col xl:flex-row gap-6 xl:items-start',
    effectsWrapperClass: 'xl:w-1/3 order-1',
    mainWrapperClass: 'xl:w-2/3 order-2',
    effectPanelClass:
      'bg-slate-950/60 border border-purple-500/40 shadow-xl shadow-purple-900/40 backdrop-blur',
    mainPanelClass:
      'bg-slate-950/40 border border-emerald-400/30 shadow-lg shadow-emerald-800/30 backdrop-blur',
    effectCardClass: 'bg-slate-900/60 border border-purple-500/40',
    effectCardActiveClass: 'border-cyan-400/80 shadow-lg shadow-cyan-500/30',
    effectCardTargetClass: 'border-emerald-400/60 bg-emerald-400/10',
    buttonPrimaryClass:
      'bg-cyan-400 hover:bg-cyan-300 text-slate-900 shadow-md shadow-cyan-400/40',
    buttonSecondaryClass:
      'bg-purple-700/40 hover:bg-purple-600/60 text-purple-100 border border-purple-400/50',
    buttonGhostClass:
      'bg-transparent border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/10',
    tagClass: 'text-cyan-200 bg-cyan-500/10 border border-cyan-400/30',
    mutedTextClass: 'text-purple-200/70',
    headingTextClass: 'text-cyan-200',
    selectClass:
      'bg-slate-950/70 border border-purple-500/40 text-slate-100 placeholder-purple-200/50 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400',
    inputClass:
      'bg-slate-950/70 border border-purple-500/40 text-slate-100 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 placeholder-purple-100/50',
    checkboxClass: 'text-cyan-400 focus:ring-cyan-300 border-purple-400/70 bg-slate-900',
    dropzoneBaseClass:
      'border-purple-500/40 bg-slate-950/40 text-cyan-100 hover:bg-purple-900/30',
    dropzoneActiveClass: 'border-cyan-400 bg-cyan-500/20 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-50 cursor-not-allowed',
    audioPanelClass: 'bg-slate-900/60 border border-purple-500/40 shadow-lg',
    audioPlayButtonClass: 'bg-cyan-400 hover:bg-cyan-300 text-slate-900',
    accentColor: '#22d3ee',
    waveColor: '#6b21a8',
    waveProgressColor: '#22d3ee',
  },
  {
    id: 'midnightMirage',
    name: 'Midnight Mirage',
    description: 'Deep blues with floating panels and inverted layout.',
    layout: 'split-right',
    bodyClass: 'bg-gradient-to-bl from-blue-950 via-slate-900 to-slate-800 text-slate-100',
    headerClass: 'bg-blue-950/70 border-b border-blue-800/60 shadow-inner shadow-blue-900/40',
    headerTitleClass: 'text-blue-200',
    layoutWrapperClass: 'flex flex-col xl:flex-row gap-8 xl:items-start',
    effectsWrapperClass: 'xl:w-1/3 order-2',
    mainWrapperClass: 'xl:w-2/3 order-1',
    effectPanelClass:
      'bg-blue-950/70 border border-blue-700/60 shadow-lg shadow-blue-900/40 backdrop-blur',
    mainPanelClass:
      'bg-slate-950/50 border border-blue-700/40 shadow-xl shadow-blue-900/50 backdrop-blur',
    effectCardClass: 'bg-blue-950/70 border border-blue-600/40',
    effectCardActiveClass: 'border-sky-300/80 shadow-lg shadow-sky-400/40',
    effectCardTargetClass: 'border-sky-400/70 bg-sky-500/10',
    buttonPrimaryClass:
      'bg-sky-400 hover:bg-sky-300 text-slate-900 shadow shadow-sky-500/40',
    buttonSecondaryClass:
      'bg-blue-800/60 hover:bg-blue-700/70 text-blue-100 border border-blue-500/40',
    buttonGhostClass:
      'bg-transparent border border-sky-300/50 text-sky-200 hover:bg-sky-500/10',
    tagClass: 'text-sky-200 bg-sky-500/10 border border-sky-300/30',
    mutedTextClass: 'text-blue-200/70',
    headingTextClass: 'text-sky-100',
    selectClass:
      'bg-blue-950/80 border border-blue-700/60 text-slate-100 focus:ring-1 focus:ring-sky-400 focus:border-sky-400',
    inputClass:
      'bg-blue-950/80 border border-blue-700/60 text-slate-100 focus:ring-1 focus:ring-sky-400 focus:border-sky-400 placeholder-blue-200/40',
    checkboxClass: 'text-sky-400 focus:ring-sky-300 border-blue-600/70 bg-blue-950',
    dropzoneBaseClass:
      'border-blue-600/50 bg-blue-950/60 text-sky-100 hover:bg-blue-900/50',
    dropzoneActiveClass: 'border-sky-400 bg-sky-400/20 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-50 cursor-not-allowed',
    audioPanelClass: 'bg-blue-950/70 border border-blue-700/60 shadow-lg',
    audioPlayButtonClass: 'bg-sky-400 hover:bg-sky-300 text-slate-900',
    accentColor: '#38bdf8',
    waveColor: '#1e3a8a',
    waveProgressColor: '#38bdf8',
  },
  {
    id: 'sunsetBloom',
    name: 'Sunset Bloom',
    description: 'Warm oranges and pinks with stacked sections.',
    layout: 'stacked',
    bodyClass: 'bg-gradient-to-br from-rose-100 via-orange-100 to-amber-200 text-rose-900',
    headerClass: 'bg-white/80 border-b border-amber-200 backdrop-blur',
    headerTitleClass: 'text-rose-700',
    layoutWrapperClass: 'flex flex-col gap-8',
    effectsWrapperClass: 'order-2',
    mainWrapperClass: 'order-1',
    effectPanelClass:
      'bg-white/90 border border-rose-200 shadow-lg shadow-rose-200/70 backdrop-blur rounded-3xl',
    mainPanelClass:
      'bg-white/90 border border-amber-200 shadow-xl shadow-amber-200/70 backdrop-blur rounded-3xl',
    effectCardClass: 'bg-rose-50/90 border border-rose-200',
    effectCardActiveClass: 'border-amber-400 shadow-lg shadow-amber-300/60',
    effectCardTargetClass: 'border-amber-300 bg-amber-100/50',
    buttonPrimaryClass:
      'bg-rose-500 hover:bg-rose-400 text-white shadow-md shadow-rose-500/50',
    buttonSecondaryClass:
      'bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-300',
    buttonGhostClass:
      'bg-white hover:bg-rose-100 text-rose-600 border border-rose-200',
    tagClass: 'text-rose-600 bg-rose-100 border border-rose-200',
    mutedTextClass: 'text-rose-400',
    headingTextClass: 'text-rose-700',
    selectClass:
      'bg-white border border-rose-200 text-rose-700 focus:ring-1 focus:ring-rose-400 focus:border-rose-400',
    inputClass:
      'bg-white border border-rose-200 text-rose-700 focus:ring-1 focus:ring-rose-400 focus:border-rose-400 placeholder-rose-300',
    checkboxClass: 'text-rose-500 focus:ring-rose-300 border-rose-300',
    dropzoneBaseClass:
      'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100',
    dropzoneActiveClass: 'border-amber-400 bg-amber-100 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-50 cursor-not-allowed',
    audioPanelClass: 'bg-white/90 border border-rose-200 shadow-lg rounded-3xl',
    audioPlayButtonClass: 'bg-rose-500 hover:bg-rose-400 text-white',
    accentColor: '#f472b6',
    waveColor: '#fca5a5',
    waveProgressColor: '#fb7185',
  },
  {
    id: 'arcticDrift',
    name: 'Arctic Drift',
    description: 'Cool glass frosts with floating effect columns.',
    layout: 'columns',
    bodyClass: 'bg-gradient-to-tr from-sky-100 via-slate-200 to-white text-slate-800',
    headerClass: 'bg-white/70 border-b border-slate-200 backdrop-blur',
    headerTitleClass: 'text-sky-700',
    layoutWrapperClass: 'grid gap-6 xl:grid-cols-[360px_1fr]',
    effectsWrapperClass: 'order-1',
    mainWrapperClass: 'order-2',
    effectPanelClass:
      'bg-white/80 border border-sky-200/70 shadow-xl shadow-sky-200/60 backdrop-blur-xl rounded-3xl',
    mainPanelClass:
      'bg-white/70 border border-slate-200/70 shadow-lg shadow-slate-200/50 backdrop-blur-xl rounded-3xl',
    effectCardClass: 'bg-slate-50/80 border border-sky-200/70 rounded-2xl',
    effectCardActiveClass: 'border-sky-400 shadow-lg shadow-sky-300/50',
    effectCardTargetClass: 'border-emerald-300 bg-emerald-100/40',
    buttonPrimaryClass:
      'bg-sky-500 hover:bg-sky-400 text-white shadow shadow-sky-500/40',
    buttonSecondaryClass:
      'bg-white/80 hover:bg-sky-100 text-sky-600 border border-sky-300',
    buttonGhostClass:
      'bg-transparent border border-sky-300 text-sky-600 hover:bg-sky-100/80',
    tagClass: 'text-sky-600 bg-sky-100 border border-sky-200',
    mutedTextClass: 'text-slate-500',
    headingTextClass: 'text-sky-700',
    selectClass:
      'bg-white/90 border border-sky-200 text-slate-700 focus:ring-1 focus:ring-sky-400 focus:border-sky-400 backdrop-blur',
    inputClass:
      'bg-white/90 border border-sky-200 text-slate-700 focus:ring-1 focus:ring-sky-400 focus:border-sky-400',
    checkboxClass: 'text-sky-500 focus:ring-sky-300 border-sky-300',
    dropzoneBaseClass:
      'border-sky-300 bg-white/80 text-sky-600 hover:bg-sky-100/80 rounded-3xl',
    dropzoneActiveClass: 'border-emerald-400 bg-emerald-100/60 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-50 cursor-not-allowed',
    audioPanelClass: 'bg-white/80 border border-sky-200 shadow-lg rounded-3xl',
    audioPlayButtonClass: 'bg-sky-500 hover:bg-sky-400 text-white',
    accentColor: '#0ea5e9',
    waveColor: '#bae6fd',
    waveProgressColor: '#0ea5e9',
  },
  {
    id: 'verdantBloom',
    name: 'Verdant Bloom',
    description: 'Lush greens with organic curves and stacked reverse layout.',
    layout: 'stacked-reverse',
    bodyClass: 'bg-gradient-to-br from-emerald-900 via-emerald-700 to-lime-600 text-emerald-50',
    headerClass: 'bg-emerald-900/80 border-b border-emerald-700/60 backdrop-blur',
    headerTitleClass: 'text-lime-200',
    layoutWrapperClass: 'flex flex-col gap-8',
    effectsWrapperClass: 'order-1',
    mainWrapperClass: 'order-2',
    effectPanelClass:
      'bg-emerald-950/60 border border-lime-500/40 shadow-lg shadow-emerald-900/50 rounded-3xl',
    mainPanelClass:
      'bg-emerald-900/50 border border-lime-500/30 shadow-xl shadow-emerald-900/40 rounded-3xl',
    effectCardClass: 'bg-emerald-900/70 border border-lime-500/30 rounded-2xl',
    effectCardActiveClass: 'border-lime-300 shadow-lg shadow-lime-400/50',
    effectCardTargetClass: 'border-emerald-300 bg-emerald-500/20',
    buttonPrimaryClass:
      'bg-lime-400 hover:bg-lime-300 text-emerald-950 shadow shadow-lime-400/50',
    buttonSecondaryClass:
      'bg-emerald-800/70 hover:bg-emerald-700/80 text-emerald-100 border border-emerald-500/40',
    buttonGhostClass:
      'bg-transparent border border-lime-400/40 text-lime-200 hover:bg-lime-400/10',
    tagClass: 'text-lime-200 bg-lime-500/10 border border-lime-400/30',
    mutedTextClass: 'text-emerald-200/70',
    headingTextClass: 'text-lime-100',
    selectClass:
      'bg-emerald-950/70 border border-lime-500/40 text-emerald-50 focus:ring-1 focus:ring-lime-300 focus:border-lime-300',
    inputClass:
      'bg-emerald-950/70 border border-lime-500/40 text-emerald-50 focus:ring-1 focus:ring-lime-300 focus:border-lime-300 placeholder-emerald-200/60',
    checkboxClass: 'text-lime-300 focus:ring-lime-200 border-emerald-500/60 bg-emerald-900',
    dropzoneBaseClass:
      'border-lime-500/40 bg-emerald-900/60 text-lime-200 hover:bg-emerald-800/60 rounded-3xl',
    dropzoneActiveClass: 'border-lime-300 bg-lime-300/30 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
    audioPanelClass: 'bg-emerald-900/60 border border-lime-400/40 rounded-3xl shadow-lg',
    audioPlayButtonClass: 'bg-lime-400 hover:bg-lime-300 text-emerald-950',
    accentColor: '#a3e635',
    waveColor: '#047857',
    waveProgressColor: '#bef264',
  },
  {
    id: 'retroTerminal',
    name: 'Retro Terminal',
    description: 'Matrix green terminal vibe with monospaced typography.',
    layout: 'split-left',
    bodyClass: 'bg-black text-emerald-300',
    headerClass: 'bg-black border-b border-emerald-500/40',
    headerTitleClass: 'text-emerald-300 font-mono uppercase tracking-[0.4em]',
    layoutWrapperClass: 'flex flex-col xl:flex-row gap-6 xl:items-start',
    effectsWrapperClass: 'xl:w-[320px] order-1',
    mainWrapperClass: 'flex-1 order-2',
    effectPanelClass:
      'bg-black border border-emerald-500/40 shadow-[0_0_25px_rgba(34,197,94,0.15)] rounded-lg',
    mainPanelClass:
      'bg-black border border-emerald-500/40 shadow-[0_0_45px_rgba(34,197,94,0.2)] rounded-lg',
    effectCardClass: 'bg-black border border-emerald-500/40 font-mono',
    effectCardActiveClass: 'border-emerald-300 shadow-[0_0_25px_rgba(34,197,94,0.6)]',
    effectCardTargetClass: 'border-emerald-200 bg-emerald-500/10',
    buttonPrimaryClass:
      'bg-emerald-500 hover:bg-emerald-400 text-black font-mono uppercase tracking-wider',
    buttonSecondaryClass:
      'bg-black border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 font-mono',
    buttonGhostClass:
      'bg-transparent border border-emerald-400 text-emerald-300 hover:bg-emerald-500/10 font-mono',
    tagClass: 'text-black bg-emerald-400 uppercase tracking-wide px-2',
    mutedTextClass: 'text-emerald-200/70 font-mono',
    headingTextClass: 'text-emerald-100 font-mono',
    selectClass:
      'bg-black border border-emerald-500 text-emerald-300 font-mono focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400',
    inputClass:
      'bg-black border border-emerald-500 text-emerald-300 font-mono focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 placeholder-emerald-300/50',
    checkboxClass: 'text-emerald-400 focus:ring-emerald-300 border-emerald-500',
    dropzoneBaseClass:
      'border-emerald-500 border-dashed bg-black text-emerald-300 font-mono hover:bg-emerald-500/10',
    dropzoneActiveClass: 'border-emerald-300 bg-emerald-500/10 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
    audioPanelClass: 'bg-black border border-emerald-500/40 font-mono',
    audioPlayButtonClass: 'bg-emerald-500 hover:bg-emerald-400 text-black font-mono',
    accentColor: '#34d399',
    waveColor: '#064e3b',
    waveProgressColor: '#34d399',
  },
  {
    id: 'studioSlate',
    name: 'Studio Slate',
    description: 'Professional slate gray with accent orange lines.',
    layout: 'split-left',
    bodyClass: 'bg-slate-950 text-slate-100',
    headerClass: 'bg-slate-950 border-b border-orange-500/40',
    headerTitleClass: 'text-orange-400',
    layoutWrapperClass: 'flex flex-col xl:flex-row gap-6 xl:items-start',
    effectsWrapperClass: 'xl:w-[340px] order-1',
    mainWrapperClass: 'flex-1 order-2',
    effectPanelClass:
      'bg-slate-900 border border-slate-700 shadow-lg shadow-slate-900 rounded-2xl',
    mainPanelClass:
      'bg-slate-900 border border-slate-700 shadow-xl shadow-slate-900 rounded-2xl',
    effectCardClass: 'bg-slate-950 border border-slate-700',
    effectCardActiveClass: 'border-orange-400 shadow-lg shadow-orange-500/30',
    effectCardTargetClass: 'border-orange-300 bg-orange-500/10',
    buttonPrimaryClass:
      'bg-orange-500 hover:bg-orange-400 text-slate-900 shadow shadow-orange-500/40',
    buttonSecondaryClass:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600',
    buttonGhostClass:
      'bg-transparent border border-orange-400 text-orange-300 hover:bg-orange-500/10',
    tagClass: 'text-orange-300 bg-orange-500/10 border border-orange-400/30',
    mutedTextClass: 'text-slate-400',
    headingTextClass: 'text-slate-100',
    selectClass:
      'bg-slate-950 border border-slate-700 text-slate-100 focus:ring-1 focus:ring-orange-400 focus:border-orange-400',
    inputClass:
      'bg-slate-950 border border-slate-700 text-slate-100 focus:ring-1 focus:ring-orange-400 focus:border-orange-400 placeholder-slate-500',
    checkboxClass: 'text-orange-400 focus:ring-orange-300 border-slate-600 bg-slate-900',
    dropzoneBaseClass:
      'border-slate-700 border-dashed bg-slate-950 text-slate-200 hover:bg-slate-900',
    dropzoneActiveClass: 'border-orange-400 bg-orange-500/10 scale-[1.01]',
    dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
    audioPanelClass: 'bg-slate-900 border border-slate-700 shadow-lg rounded-2xl',
    audioPlayButtonClass: 'bg-orange-500 hover:bg-orange-400 text-slate-900',
    accentColor: '#f97316',
    waveColor: '#1e293b',
    waveProgressColor: '#f97316',
  },
  {
    id: 'vaporSunrise',
    name: 'Vapor Sunrise',
    description: 'Vaporwave pastels with split columns and frosted edges.',
    layout: 'columns',
    bodyClass: 'bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 text-purple-900',
    headerClass: 'bg-white/70 border-b border-pink-200 backdrop-blur',
    headerTitleClass: 'text-purple-700',
    layoutWrapperClass: 'grid gap-6 xl:grid-cols-[1.2fr_1.8fr]',
    effectsWrapperClass: 'order-1',
    mainWrapperClass: 'order-2',
    effectPanelClass:
      'bg-white/80 border border-purple-200 shadow-xl shadow-purple-200/70 backdrop-blur rounded-3xl',
    mainPanelClass:
      'bg-white/70 border border-blue-200 shadow-xl shadow-blue-200/70 backdrop-blur rounded-3xl',
    effectCardClass: 'bg-white/90 border border-purple-200 rounded-2xl',
    effectCardActiveClass: 'border-pink-400 shadow-lg shadow-pink-300/50',
    effectCardTargetClass: 'border-blue-300 bg-blue-200/40',
    buttonPrimaryClass:
      'bg-purple-500 hover:bg-purple-400 text-white shadow shadow-purple-500/40',
    buttonSecondaryClass:
      'bg-pink-100 hover:bg-pink-200 text-pink-700 border border-pink-300',
    buttonGhostClass:
      'bg-transparent border border-purple-300 text-purple-600 hover:bg-purple-100/60',
    tagClass: 'text-purple-600 bg-purple-100 border border-purple-200',
    mutedTextClass: 'text-purple-400',
    headingTextClass: 'text-purple-700',
    selectClass:
      'bg-white border border-purple-200 text-purple-700 focus:ring-1 focus:ring-purple-400 focus:border-purple-400',
    inputClass:
      'bg-white border border-purple-200 text-purple-700 focus:ring-1 focus:ring-purple-400 focus:border-purple-400 placeholder-purple-300',
    checkboxClass: 'text-purple-500 focus:ring-purple-300 border-purple-300',
    dropzoneBaseClass:
      'border-purple-200 bg-white/90 text-purple-600 hover:bg-purple-100/70 rounded-3xl',
    dropzoneActiveClass: 'border-pink-400 bg-pink-200/40 scale-[1.02]',
    dropzoneDisabledClass: 'opacity-50 cursor-not-allowed',
    audioPanelClass: 'bg-white/80 border border-purple-200 shadow-lg rounded-3xl',
    audioPlayButtonClass: 'bg-purple-500 hover:bg-purple-400 text-white',
    accentColor: '#a855f7',
    waveColor: '#f472b6',
    waveProgressColor: '#a855f7',
  },
  {
    id: 'noirMinimal',
    name: 'Noir Minimal',
    description: 'High-contrast black and white minimal grid layout.',
    layout: 'grid',
    bodyClass: 'bg-zinc-950 text-zinc-100',
    headerClass: 'bg-black border-b border-zinc-800',
    headerTitleClass: 'text-white tracking-[0.3em] uppercase',
    layoutWrapperClass: 'grid gap-6 xl:grid-cols-2',
    effectsWrapperClass: 'order-1 xl:order-1',
    mainWrapperClass: 'order-2 xl:order-2',
    effectPanelClass: 'bg-black border border-zinc-800 rounded-none shadow-2xl shadow-black',
    mainPanelClass: 'bg-black border border-zinc-800 rounded-none shadow-2xl shadow-black',
    effectCardClass: 'bg-zinc-950 border border-zinc-800 rounded-none',
    effectCardActiveClass: 'border-white shadow-[4px_4px_0px_rgba(250,250,250,0.6)]',
    effectCardTargetClass: 'border-zinc-200 bg-zinc-800',
    buttonPrimaryClass: 'bg-white hover:bg-zinc-200 text-black uppercase tracking-wide',
    buttonSecondaryClass: 'bg-black border border-zinc-700 text-white hover:bg-zinc-800',
    buttonGhostClass: 'bg-transparent border border-zinc-700 text-white hover:bg-zinc-800',
    tagClass: 'text-black bg-white uppercase tracking-wide px-2',
    mutedTextClass: 'text-zinc-400 uppercase tracking-wide',
    headingTextClass: 'text-white uppercase tracking-wide',
    selectClass:
      'bg-black border border-zinc-700 text-white focus:ring-1 focus:ring-white focus:border-white uppercase text-xs',
    inputClass:
      'bg-black border border-zinc-700 text-white focus:ring-1 focus:ring-white focus:border-white uppercase text-xs',
    checkboxClass: 'text-white focus:ring-white border-zinc-700 bg-black',
    dropzoneBaseClass:
      'border-zinc-700 border-dashed bg-black text-white hover:bg-zinc-900 uppercase tracking-[0.3em]',
    dropzoneActiveClass: 'border-white bg-zinc-800 scale-[1.01]',
    dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
    audioPanelClass: 'bg-black border border-zinc-800 rounded-none',
    audioPlayButtonClass: 'bg-white hover:bg-zinc-200 text-black uppercase tracking-wide',
    accentColor: '#ffffff',
    waveColor: '#525252',
    waveProgressColor: '#ffffff',
  },
  {
    id: 'blueprintGrid',
    name: 'Blueprint Grid',
    description: 'Engineering blueprint with grid lines and sharp typography.',
    layout: 'split-left',
    bodyClass: 'bg-gradient-to-br from-slate-900 via-blue-900 to-blue-800 text-sky-100',
    headerClass: 'bg-blue-950/80 border-b border-sky-400/40 backdrop-blur',
    headerTitleClass: 'text-sky-200 tracking-[0.2em] uppercase',
    layoutWrapperClass: 'flex flex-col xl:flex-row gap-6 xl:items-start',
    effectsWrapperClass: 'xl:w-1/3 order-1',
    mainWrapperClass: 'flex-1 order-2',
    effectPanelClass:
      'bg-blue-950/80 border border-sky-500/40 shadow-lg shadow-blue-900/40 backdrop-blur-lg',
    mainPanelClass:
      'bg-blue-950/70 border border-sky-500/40 shadow-xl shadow-blue-900/40 backdrop-blur-lg',
    effectCardClass: 'bg-blue-950 border border-sky-500/40 rounded-lg',
    effectCardActiveClass: 'border-sky-300 shadow-lg shadow-sky-400/40',
    effectCardTargetClass: 'border-sky-200 bg-sky-500/10',
    buttonPrimaryClass:
      'bg-sky-400 hover:bg-sky-300 text-blue-950 uppercase tracking-wide shadow shadow-sky-500/30',
    buttonSecondaryClass:
      'bg-blue-900/70 hover:bg-blue-800 text-sky-200 border border-sky-400/40 uppercase tracking-wide',
    buttonGhostClass:
      'bg-transparent border border-sky-400/40 text-sky-200 hover:bg-sky-400/10 uppercase tracking-wide',
    tagClass: 'text-blue-950 bg-sky-300 uppercase tracking-wide px-2',
    mutedTextClass: 'text-sky-200/70 uppercase tracking-wide',
    headingTextClass: 'text-sky-100 uppercase tracking-wide',
    selectClass:
      'bg-blue-950 border border-sky-500/40 text-sky-100 focus:ring-1 focus:ring-sky-300 focus:border-sky-300 uppercase text-xs',
    inputClass:
      'bg-blue-950 border border-sky-500/40 text-sky-100 focus:ring-1 focus:ring-sky-300 focus:border-sky-300 uppercase text-xs',
    checkboxClass: 'text-sky-300 focus:ring-sky-300 border-sky-500 bg-blue-950',
    dropzoneBaseClass:
      'border-sky-500/40 border-dashed bg-blue-950/80 text-sky-200 hover:bg-blue-900/70 uppercase tracking-[0.2em]',
    dropzoneActiveClass: 'border-sky-300 bg-sky-400/10 scale-[1.01]',
    dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
    audioPanelClass: 'bg-blue-950/80 border border-sky-500/40 rounded-lg shadow-lg',
    audioPlayButtonClass: 'bg-sky-400 hover:bg-sky-300 text-blue-950 uppercase tracking-wide',
    accentColor: '#38bdf8',
    waveColor: '#1d4ed8',
    waveProgressColor: '#38bdf8',
  },
];
