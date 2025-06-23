export default class XorShift {
  static initSeeds: number[] = [];
  static rngForInitSeeds: XorShift = new XorShift(0x12345678);

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

  static initSeed(index: number): number {
    while (XorShift.initSeeds.length <= index) {
      XorShift.initSeeds.push(XorShift.rngForInitSeeds.next());
    }

    return XorShift.initSeeds[index];
  }
}
