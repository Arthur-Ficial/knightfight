// Limited retro palette (~32 colours). Dark, torch-lit, high contrast for the
// silhouette + rim-light look. Named for meaning, not just hue. All rendering
// pulls colour from here - no stray hex codes elsewhere.

export const PALETTE = {
  // Background / arena
  night0: '#08070d',
  night1: '#0a0a12',
  night2: '#12121f',
  stone0: '#1b1a2b',
  stone1: '#2a2740',
  stone2: '#3b3757',
  banner: '#5a2036',
  crowd: '#0f0e1a',

  // Torchlight
  torch0: '#ffd27a',
  torch1: '#ff9d3c',
  torch2: '#e5561f',
  ember: '#ff6b2b',

  // Player knight
  hero0: '#dfe7ff',
  hero1: '#7fa8ff',
  heroRim: '#bfe0ff',
  heroSteel: '#9aa6c8',

  // Enemy knight
  foe0: '#ff8a7a',
  foe1: '#b83b3b',
  foeRim: '#ff5a5a',
  foeSteel: '#8a5a5a',

  // Tells
  tellWhite: '#f4f4ff',
  tellGold: '#ffce4a',
  tellRed: '#ff3b3b',

  // FX
  spark: '#fff2b0',
  blood: '#8e1b1b',
  bloodDark: '#4a0f0f',
  dust: '#6a6480',
  parry: '#bfe9ff',
  rage: '#ff4d6d',
  stamina: '#f4d35e',
  hp: '#c9433f',
  hpEnemy: '#b83b3b',

  // Armour materials + two-tone lighting
  steelLight: '#cdd6f0',
  steelMid: '#8a93b5',
  steelDark: '#3b4062',
  ironDark: '#23263c',
  leather: '#5a3d2b',
  warmRim: '#ffb562',
  coolFill: '#20264a',
  contact: 'rgba(0,0,0,0.45)',
  plume: '#d64b5a',
  heraldGold: '#e8c56a',
  plague: '#7bbf6a',
  plagueDark: '#2f4a2a',
  dread: '#7a1420',
  fog: 'rgba(60,64,96,0.10)',
  tower: '#14131f',

  // UI
  ink: '#f4f1e8',
  inkDim: '#b8b2a0',
  gold: '#e8c56a',
  panel: '#141320',
  panelEdge: '#2c2942',
  bloodMoon: '#c22a2a',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Flat array form for palette-quantised post effects. */
export const PALETTE_LIST: readonly string[] = Object.values(PALETTE);
