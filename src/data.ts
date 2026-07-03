import mixbox from "mixbox";
import { PaintColor, Level, LevelRecipe } from "./types";

export const BASE_COLORS: PaintColor[] = [
  { id: "red", name: "大红", hex: "#E63329", rgb: [230, 51, 41] },
  { id: "vermilion", name: "朱红", hex: "#F04E23", rgb: [240, 78, 35] },
  { id: "orange", name: "橙色", hex: "#F5821F", rgb: [245, 130, 31] },
  { id: "yellow-orange", name: "橘黄", hex: "#FBB040", rgb: [251, 176, 64] },
  { id: "yellow", name: "柠黄", hex: "#FCE300", rgb: [252, 227, 0] },
  { id: "yellow-green", name: "黄绿", hex: "#A3C61A", rgb: [163, 198, 26] },
  { id: "green", name: "草绿", hex: "#0B8A3C", rgb: [11, 138, 60] },
  { id: "blue-green", name: "青绿", hex: "#009E8E", rgb: [0, 158, 142] },
  { id: "blue", name: "普蓝", hex: "#1B4CA1", rgb: [27, 76, 161] },
  { id: "blue-violet", name: "蓝紫", hex: "#3B2E8C", rgb: [59, 46, 140] },
  { id: "violet", name: "紫罗兰", hex: "#7B2A90", rgb: [123, 42, 144] },
  { id: "magenta", name: "玫红", hex: "#C0186A", rgb: [192, 24, 106] },
  { id: "white", name: "白色", hex: "#FDFCF8", rgb: [253, 252, 248] },
  { id: "black", name: "黑色", hex: "#1E1E1E", rgb: [30, 30, 30] },
];

export const BASE_COLORS_MAP = BASE_COLORS.reduce((acc, color) => {
  acc[color.id] = color;
  return acc;
}, {} as { [id: string]: PaintColor });

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (c: number) => {
    const h = clamp(c).toString(16);
    return h.length === 1 ? "0" + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Subtractive mixing of colors using mixbox latent space
export function mixColors(items: { color: PaintColor; weight: number }[]): [number, number, number] {
  if (items.length === 0) return [253, 251, 245]; // canvas background warm white
  if (items.length === 1) return items[0].color.rgb;

  const zMix = new Array(mixbox.LATENT_SIZE).fill(0);
  let totalWeight = 0;
  for (const item of items) {
    totalWeight += item.weight;
  }
  if (totalWeight === 0) return [253, 251, 245];

  for (const item of items) {
    const z = mixbox.rgbToLatent(item.color.rgb);
    const normalizedWeight = item.weight / totalWeight;
    for (let i = 0; i < mixbox.LATENT_SIZE; i++) {
      zMix[i] += normalizedWeight * z[i];
    }
  }
  return mixbox.latentToRgb(zMix);
}

// Get the actual mixed color from a level recipe
export function getRecipeColor(recipe: LevelRecipe): { rgb: [number, number, number]; hex: string } {
  const items = Object.entries(recipe).map(([colorId, weight]) => ({
    color: BASE_COLORS_MAP[colorId] || BASE_COLORS_MAP["white"],
    weight,
  }));
  const rgb = mixColors(items);
  const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
  return { rgb, hex };
}

// Generate human-friendly description of level recipe
export function getRecipeHint(recipe: LevelRecipe): string {
  return Object.entries(recipe)
    .map(([colorId, weight]) => {
      const color = BASE_COLORS_MAP[colorId];
      const name = color ? color.name : "未知颜色";
      return `${name} × ${weight}`;
    })
    .join(" + ");
}

export const LEVELS: Level[] = [
  // EASY
  {
    id: 1,
    name: "活力橙黄",
    recipe: { red: 1, yellow: 1 },
    description: "【入门第一步】大红与柠黄等量相混。亲眼见证冷暖相交，经典橙色的诞生！",
    allowedColors: ["red", "yellow"],
    maxBalls: 3,
    difficulty: "easy",
  },
  {
    id: 2,
    name: "春意嫩绿",
    recipe: { yellow: 1, green: 1 },
    description: "【黄绿调和】明艳的柠黄与草绿等量相融。调制出嫩芽般的清新黄绿意境。",
    allowedColors: ["yellow", "green"],
    maxBalls: 3,
    difficulty: "easy",
  },
  {
    id: 3,
    name: "清澈草绿",
    recipe: { yellow: 1, blue: 1 },
    description: "【三原色常识】黄色与蓝色碰撞！在减色法中，它们会混合出最纯正充满生气的草绿色。",
    allowedColors: ["yellow", "blue"],
    maxBalls: 3,
    difficulty: "easy",
  },
  {
    id: 4,
    name: "优雅红紫",
    recipe: { red: 1, blue: 1 },
    description: "【冷暖交叠】大红与普蓝等量混合。调制出一抹高贵神秘的深紫色，体会原色交融的魅力。",
    allowedColors: ["red", "blue"],
    maxBalls: 3,
    difficulty: "easy",
  },
  {
    id: 5,
    name: "热情朱红",
    recipe: { red: 1, orange: 1 },
    description: "【邻近色调色】将大红与纯正橙色等量融合，调配出介于两者之间、更加夺目耀眼的朱红色。",
    allowedColors: ["red", "orange"],
    maxBalls: 3,
    difficulty: "easy",
  },

  // MEDIUM
  {
    id: 6,
    name: "娇嫩粉红",
    recipe: { red: 1, white: 2 },
    description: "【明度控制·加白】加白变淡！大红中融入双倍的白色，降低色彩纯度，调出娇嫩甜美的粉色。",
    allowedColors: ["red", "white"],
    maxBalls: 4,
    difficulty: "medium",
  },
  {
    id: 7,
    name: "奶油暖橘",
    recipe: { yellow: 1, red: 1, white: 1 },
    description: "【三色混合基础】先用等比柠黄与大红合成橙色，再混入一份白色，调和出如奶油般的丝滑暖橘色。",
    allowedColors: ["yellow", "red", "white"],
    maxBalls: 4,
    difficulty: "medium",
  },
  {
    id: 8,
    name: "迷雾淡紫",
    recipe: { violet: 1, white: 3 },
    description: "【高雅粉色系】在优雅高饱和的紫罗兰色中混入三倍白色，大幅降低色彩饱和度，呈现宁静幽香的淡紫色。",
    allowedColors: ["violet", "white"],
    maxBalls: 5,
    difficulty: "medium",
  },
  {
    id: 9,
    name: "幽暗松针",
    recipe: { green: 2, black: 1 },
    description: "【明度控制·加黑】加黑压暗！在翠绿的草绿中加入一份黑色，压低整体色彩明度，使其沉稳幽深。",
    allowedColors: ["green", "black"],
    maxBalls: 4,
    difficulty: "medium",
  },
  {
    id: 10,
    name: "玫瑰豆沙",
    recipe: { red: 2, yellow: 1, black: 1 },
    description: "【脏色初学者】大红加柠黄调出红橙色，再加入一份黑色，降低其明度与纯度，调配出知性高雅的玫瑰豆沙色。",
    allowedColors: ["red", "yellow", "black"],
    maxBalls: 5,
    difficulty: "medium",
  },

  // HARD
  {
    id: 11,
    name: "复古铜金",
    recipe: { yellow: 3, orange: 1, black: 1 },
    description: "【大地色意境】以三倍明黄与一倍橙色为底，再引入一分黑色。你会发现明黄在黑色浸染下产生了神奇的古铜金质感。",
    allowedColors: ["yellow", "orange", "black"],
    maxBalls: 6,
    difficulty: "hard",
  },
  {
    id: 12,
    name: "莫兰迪粉",
    recipe: { red: 1, yellow: 1, black: 1, white: 2 },
    description: "【高级灰调】将红、黄、黑调配成沉稳的脏橙色后，再通过两份白色使其“蒙尘”，呈现绝对静谧温柔的莫兰迪高级粉。",
    allowedColors: ["red", "yellow", "black", "white"],
    maxBalls: 6,
    difficulty: "hard",
  },
  {
    id: 13,
    name: "经典橄榄绿",
    recipe: { yellow: 2, black: 1, green: 1 },
    description: "【自然画卷】两份柠黄与一份草绿调配出清新明黄绿，再用一份黑色对其进行冷暖对冲和降调，重现自然林木的橄榄绿。",
    allowedColors: ["yellow", "black", "green"],
    maxBalls: 5,
    difficulty: "hard",
  },
  {
    id: 14,
    name: "互补雾霾蓝",
    recipe: { blue: 2, orange: 1, white: 2 },
    description: "【互补色中和】普蓝与橙色在色轮上完全相对。普蓝偏多并混入橙色中和，再加入双倍白色，即成高质感的经典雾霾蓝。",
    allowedColors: ["blue", "orange", "white"],
    maxBalls: 6,
    difficulty: "hard",
  },
  {
    id: 15,
    name: "波尔多红酒",
    recipe: { red: 3, blue: 1, black: 1 },
    description: "【色彩终极考核】三份浓烈大红，加上一份普蓝使色泽偏冷偏紫，最终以一份黑色进行暗度加持，酿成极其华贵神秘的红酒深红色！",
    allowedColors: ["red", "blue", "black"],
    maxBalls: 6,
    difficulty: "hard",
  },
];

// Dynamic random survival level generator based on seed and score difficulty
export function generateRandomSurvivalLevel(currentScore: number): Level {
  const nonNeutrals = BASE_COLORS.filter((c) => c.id !== "white" && c.id !== "black");
  
  // Complexity scales with score: 2 colors at first, potentially 3 colors as score goes high
  const numBaseColors = currentScore >= 3 ? (Math.random() < 0.5 ? 3 : 2) : 2;
  const pickedColors: PaintColor[] = [];
  
  // Shuffle nonNeutrals randomly
  const shuffled = [...nonNeutrals].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numBaseColors; i++) {
    pickedColors.push(shuffled[i]);
  }
  
  const recipe: LevelRecipe = {};
  pickedColors.forEach((color) => {
    // 1 to 3 parts
    recipe[color.id] = Math.floor(Math.random() * 3) + 1;
  });
  
  // Maybe add white or black
  const rand = Math.random();
  if (rand < 0.4) {
    recipe["white"] = Math.floor(Math.random() * 3) + 1;
  } else if (rand < 0.55 && currentScore >= 2) {
    recipe["black"] = 1;
  }
  
  // Allowed colors: base picked colors + black/white + some distractors
  const allowedColorsSet = new Set<string>();
  pickedColors.forEach((c) => allowedColorsSet.add(c.id));
  allowedColorsSet.add("white");
  allowedColorsSet.add("black");
  
  // Ensure we have at least 5 options, up to 7
  while (allowedColorsSet.size < 6) {
    const randomColor = BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)];
    allowedColorsSet.add(randomColor.id);
  }
  
  const adjectives = [
    "摩登", "迷幻", "温柔", "野性", "复古", "梦幻", "太空", "极光", "晨曦", "黄昏",
    "幽谷", "波希", "深渊", "流金", "珊瑚", "琥珀", "翡翠", "霓虹", "微醺", "香槟"
  ];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const mainName = pickedColors[0].name;
  const name = `${adjective}${mainName}`;
  
  return {
    id: currentScore + 1,
    name,
    recipe,
    description: `这是随机生存挑战的第 ${currentScore + 1} 关！调配出匹配度大于等于 80% 的色彩。`,
    allowedColors: Array.from(allowedColorsSet),
    maxBalls: 6,
  };
}

// Perceptual similarity: Weighted Euclidean distance in RGB space
// Weights: R: 0.299, G: 0.587, B: 0.114
export function calculateSimilarity(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const dr = rgb1[0] - rgb2[0];
  const dg = rgb1[1] - rgb2[1];
  const db = rgb1[2] - rgb2[2];

  // Weighted Euclidean distance
  const distance = Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);

  // Maximum possible distance is 255 (e.g. [0,0,0] vs [255,255,255] which yields exactly 255)
  // Let's scale it so that score feels rewarding and matches the prompt requirements:
  // d = 0 -> 100%
  // We can map score = Math.max(0, 100 - (distance / 255) * 100)
  // But wait, perceptual differences: even a small difference is visible, so standard Euclidean distance is fine.
  // Let's calculate score:
  let score = Math.round(Math.max(0, 100 - (distance / 255) * 100));

  // Let's give a small boost if it's really close to help user get 100% or 3 stars
  if (score > 98) score = 100;
  return score;
}

export function getStarsForScore(score: number): number {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 55) return 1;
  return 0;
}
