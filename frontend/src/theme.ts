export interface ThemePreset {
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

/**
 * Clay-inspired earth tone theme that defines the app's visual system.
 */
export const DEFAULT_THEME: ThemePreset = {
  bodyClass: 'bg-gradient-to-br from-stone-100 via-stone-200 to-stone-100 text-stone-950',
  headerClass: 'bg-stone-50 border-b border-[#b45309]',
  headerTitleClass: 'text-amber-900 uppercase tracking-[0.3em]',
  layoutWrapperClass: 'flex flex-col xl:flex-row gap-10',
  effectsWrapperClass: 'xl:w-[20rem] order-1',
  mainWrapperClass: 'flex-1 order-2',
  effectPanelClass:
    'bg-stone-100 border border-stone-300 rounded-none shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-6 py-8',
  mainPanelClass:
    'bg-stone-50 border border-stone-200 rounded-none shadow-[0_20px_40px_rgba(0,0,0,0.06)] px-8 py-10',
  effectCardClass: 'bg-white border border-stone-300 rounded-none shadow-sm',
  effectCardActiveClass: 'border-stone-200 bg-[#b45309] shadow-[0_0_20px_rgba(180,83,9,0.15)]',
  effectCardTargetClass: 'border-stone-200 bg-[#b45309]',
  buttonPrimaryClass:
    'bg-amber-700 hover:bg-amber-800 text-white uppercase tracking-[0.15em] px-6 py-2.5 rounded-none shadow-sm hover:shadow-md transition-shadow',
  buttonSecondaryClass:
    'bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 uppercase tracking-[0.15em] px-6 py-2.5 rounded-none shadow-sm hover:shadow transition-shadow',
  buttonGhostClass:
    'bg-transparent border border-stone-300 text-stone-600 hover:bg-stone-50 uppercase tracking-[0.15em] px-6 py-2.5 rounded-none hover:border-stone-400 transition-colors',
  tagClass: 'text-stone-700 bg-stone-100 border border-stone-200 uppercase tracking-wide px-2',
  mutedTextClass: 'text-stone-500 uppercase tracking-[0.2em]',
  headingTextClass: 'text-stone-700 uppercase tracking-[0.25em]',
  selectClass:
    'bg-white border border-stone-300 text-stone-700 rounded-none uppercase tracking-[0.15em] focus:ring-1 focus:ring-amber-600 focus:border-amber-600',
  inputClass:
    'bg-white border border-stone-300 text-stone-700 rounded-none uppercase tracking-[0.15em] focus:ring-1 focus:ring-amber-600 focus:border-amber-600 placeholder-stone-400',
  checkboxClass: 'text-amber-700 focus:ring-amber-600 border-stone-300 rounded-none',
  dropzoneBaseClass:
    'border-stone-300 border-dashed bg-white text-stone-600 hover:bg-stone-50 rounded-none uppercase tracking-[0.25em] px-8 py-10',
  dropzoneActiveClass: 'border-amber-400 bg-amber-50 scale-[1.01]',
  dropzoneDisabledClass: 'opacity-40 cursor-not-allowed',
  audioPanelClass: 'bg-white border border-stone-200 rounded-none shadow-lg',
  audioPlayButtonClass:
    'bg-amber-700 hover:bg-amber-800 text-white uppercase tracking-[0.15em] px-6 py-2.5 rounded-none shadow-sm hover:shadow-md transition-shadow',
  accentColor: '#b45309',
  waveColor: '#b45309',
  waveProgressColor: '#b45309',
};
