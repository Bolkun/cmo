export interface Move {
  name: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  effect: string;
  priority?: number | null;  // added priority, optional in case not always present
}
