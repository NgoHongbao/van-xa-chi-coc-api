import { getDatabase, startMongoSession } from '../database/mongodb.js';

const clone = (value) => value === undefined ? undefined : structuredClone(value);

export class MongoRepository {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.queue = Promise.resolve();
  }

  collection() {
    return getDatabase().collection(this.collectionName);
  }

  async read(options = {}) {
    return this.collection().find({}, { projection: { _id: 0 }, session: options.session }).toArray();
  }

  async write(value) {
    if (!Array.isArray(value)) throw new TypeError(`${this.collectionName} phải là một array.`);
    return this.mutate((draft) => {
      draft.splice(0, draft.length, ...clone(value));
      return draft;
    });
  }

  async mutate(mutator) {
    const run = async () => {
      const session = startMongoSession();
      let result;
      try {
        await session.withTransaction(async () => {
          const current = await this.read({ session });
          const draft = clone(current);
          result = await mutator(draft);
          const collection = this.collection();
          await collection.deleteMany({}, { session });
          if (draft.length > 0) await collection.insertMany(draft, { session, ordered: true });
        });
        return clone(result);
      } finally {
        await session.endSession();
      }
    };
    this.queue = this.queue.then(run, run);
    return this.queue;
  }
}

export class MongoGlobalNotesRepository {
  collection() {
    return getDatabase().collection('globalNotes');
  }

  async read() {
    const document = await this.collection().findOne({ id: 'global-notes' }, { projection: { _id: 0 } });
    return Array.isArray(document?.notes) ? document.notes : [];
  }

  async write(value) {
    const notes = Array.isArray(value) ? clone(value) : [];
    await this.collection().updateOne(
      { id: 'global-notes' },
      { $set: { notes, updatedAt: new Date() }, $setOnInsert: { id: 'global-notes' } },
      { upsert: true }
    );
    return notes;
  }

  async mutate(mutator) {
    const draft = await this.read();
    const result = await mutator(draft);
    await this.write(draft);
    return clone(result);
  }
}
