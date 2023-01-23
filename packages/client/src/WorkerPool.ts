const cpuCount = navigator.hardwareConcurrency || 4;

export default class WorkerPool<T> {
  values: {
    instance: T;
    running: number;
  }[];

  constructor(create: () => T, count: number = cpuCount) {
    this.values = Array.from({ length: count }, () => ({
      instance: create(),
      running: 0,
    }));
  }

  async run<R>(fn: (instance: T) => Promise<R>): Promise<R> {
    const value = this.values.reduce(
      (prev, curr) => (prev.running < curr.running ? prev : curr),
      this.values[0]
    );
    value.running++;
    try {
      return await fn(value.instance);
    } finally {
      value.running--;
    }
  }
}
