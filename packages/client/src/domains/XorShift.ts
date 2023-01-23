export default class XorShift {
  private x: number;
  private y: number;
  private z: number;
  private w: number;

  constructor(seed: number) {
    this.x = 123456789;
    this.y = 362436069;
    this.z = 521288629;
    this.w = seed;
  }

  next(): number {
    const t = this.x ^ (this.x << 11);
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    this.w = this.w ^ (this.w >>> 19) ^ (t ^ (t >>> 8));
    return this.w;
  }

  nextFloat(): number {
    return (this.next() >>> 0) / 4294967296;
  }

  nextStdNormal(): number {
    const u = this.nextFloat();
    const v = this.nextFloat();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  static randomSeed(): number {
    return Math.floor(Math.random() * 0x100000000);
  }
}
