export type ScreenType = "select" | "game" | "complete";

export interface PaintColor {
  id: string;
  name: string;
  hex: string;
  rgb: [number, number, number];
}

export interface PaintBall {
  id: string;
  colorId: string;
  color: PaintColor;
  x: number;
  y: number;
  r: number;
}

export interface LevelRecipe {
  [colorId: string]: number; // weight or parts
}

export interface Level {
  id: number;
  name: string;
  recipe: LevelRecipe;
  description: string;
  allowedColors: string[]; // list of paint color IDs in the palette for this level
  maxBalls: number;
  difficulty?: "easy" | "medium" | "hard";
}

export interface LevelProgress {
  levelId: number;
  stars: number; // 0 to 3
  completed: boolean;
}
