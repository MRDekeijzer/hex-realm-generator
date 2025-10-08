/**
 * @file perlin.ts
 * This file contains a basic implementation of a 2D Perlin noise generator.
 * It's used for creating natural-looking, pseudo-random patterns for terrain generation.
 */

/**
 * A class for generating 2D Perlin noise.
 * This implementation is based on the classic algorithm and can be seeded
 * for deterministic output.
 */
export class PerlinNoise {
  private p: number[] = [];

  /**
   * Initializes the Perlin noise generator with a seed.
   * @param seed - A number used to seed the permutation table, ensuring reproducible noise.
   */
  constructor(seed = 1) {
    // A simple seeded pseudo-random number generator
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const pTable: number[] = Array.from({ length: 256 }, (_, i) => i);
    // Shuffle the permutation table using the seeded PRNG
    for (let i = pTable.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = pTable[i];
      const pTableJ = pTable[j];
      if (temp !== undefined && pTableJ !== undefined) {
        pTable[i] = pTableJ;
        pTable[j] = temp;
      }
    }
    // Double the permutation table to avoid buffer overflows
    this.p = pTable.concat(pTable);
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }
  private grad(hash: number, x: number, y: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * Generates a Perlin noise value for a given 2D coordinate.
   * @param x - The x-coordinate.
   * @param y - The y-coordinate.
   * @returns A noise value between -1 and 1.
   */
  public noise(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = this.fade(x);
    const v = this.fade(y);
    const p = this.p;
    const A = (p[X] ?? 0) + Y,
      B = (p[X + 1] ?? 0) + Y;
    return this.lerp(
      v,
      this.lerp(u, this.grad(p[A] ?? 0, x, y), this.grad(p[B] ?? 0, x - 1, y)),
      this.lerp(u, this.grad(p[A + 1] ?? 0, x, y - 1), this.grad(p[B + 1] ?? 0, x - 1, y - 1))
    );
  }
}
