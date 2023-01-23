import XorShift from "./XorShift";

export default function shuffle<T>(array: T[], rng: XorShift) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.abs(rng.next()) % (i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}
