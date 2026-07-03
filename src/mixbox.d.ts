declare module "mixbox" {
  export const LATENT_SIZE: number;
  export function rgbToLatent(rgb: [number, number, number] | number[]): number[];
  export function latentToRgb(latent: number[] | Float32Array): [number, number, number];
  export function lerp(color1: string | [number, number, number] | number[], color2: string | [number, number, number] | number[], t: number): string;
  const mixbox: {
    LATENT_SIZE: number;
    rgbToLatent(rgb: [number, number, number] | number[]): number[];
    latentToRgb(latent: number[] | Float32Array): [number, number, number];
    lerp(color1: string | [number, number, number] | number[], color2: string | [number, number, number] | number[], t: number): string;
  };
  export default mixbox;
}
