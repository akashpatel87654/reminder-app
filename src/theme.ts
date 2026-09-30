// Design tokens from the SubTrack design (neo-brutalist: ink borders, hard offset shadows).
export const C = {
  ink: '#141414',
  cream: '#FFF8EC',
  paper: '#EDE6D6',
  white: '#FFFFFF',
  lime: '#C6F432',
  pink: '#FF7AC6',
  purple: '#9B7BFF',
  blue: '#4D7CFF',
  orange: '#FF8A3D',
  yellow: '#FFE14D',
  mint: '#5EE6C8',
  red: '#FF4D4D',
  redInk: '#E02828',
  note: '#FFF3B0',
  scrim: '#14141473',
};

export const PALETTE = [C.pink, C.lime, C.purple, C.blue, C.orange, C.yellow, C.mint];
export const TILT = [-3, 2.5, -1.5, 3, -2, 1.5];

export const F = {
  500: 'BricolageGrotesque_500Medium',
  600: 'BricolageGrotesque_600SemiBold',
  700: 'BricolageGrotesque_700Bold',
  800: 'BricolageGrotesque_800ExtraBold',
  mono: 'DMMono_400Regular',
  mono500: 'DMMono_500Medium',
} as const;

export const shadow = (x = 4, color: string = C.ink) => ({ boxShadow: `${x}px ${x}px 0 ${color}` });
export const border = (w = 2.5) => ({ borderWidth: w, borderColor: C.ink });
