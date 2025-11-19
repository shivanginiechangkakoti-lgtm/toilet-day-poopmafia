export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export enum ColorType {
  BLUE = 'blue',
  RED = 'red',
  GREEN = 'green'
}

export interface PoopItem {
  id: string;
  color: ColorType;
  position: Position;
  initialPosition: Position;
  isFlushed: boolean;
  isDragging: boolean;
  rotation: number;
  shake?: boolean; // For error animation
}

export interface ToiletTarget {
  id: string;
  color: ColorType;
  position: Position;
  size: Size;
  isOpen: boolean;
}

export interface EffectItem {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface GameState {
  poops: PoopItem[];
  toilets: ToiletTarget[];
  score: number;
  gameOver: boolean;
  effects: EffectItem[];
}