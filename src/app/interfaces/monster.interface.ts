export interface Move {
  [level: string]: string;
}

export interface BaseStats {
  hp: number;
  a: number;
  d: number;
  s: number;
  sa: number;
  sd: number;
}

export interface Evolutions {
  [level: string]: number;
}

export interface Monster {
  id: number;
  name: string;
  strength_category: number;
  types: string[];
  baseStats: BaseStats;
  evolutions: Evolutions;
  moves: Move[];
}
