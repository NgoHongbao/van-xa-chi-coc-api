import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';

const clone = (value) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));

export class JsonRepository {
  constructor(filePath, fallback = []) {
    this.filePath = filePath;
    this.fallback = fallback;
    this.queue = Promise.resolve();
  }

  async read() {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await this.write(this.fallback);
      return clone(this.fallback);
    }
  }

  async write(value) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    await rename(tempPath, this.filePath);
    return clone(value);
  }

  async mutate(mutator) {
    const run = async () => {
      const current = await this.read();
      const draft = clone(current);
      const result = await mutator(draft);
      await this.write(draft);
      return clone(result);
    };
    this.queue = this.queue.then(run, run);
    return this.queue;
  }
}
