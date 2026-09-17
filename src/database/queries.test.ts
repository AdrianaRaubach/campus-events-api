import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '../config';
import { applyMigrations } from './migrate';
import { getPool } from './pool';
import { Queries, makeQueries } from './queries';

describe('queries', () => {
  const config = getConfig('TEST_');
  let queries: Queries;

  // migrate up and create app before all tests
  beforeAll(async () => {
    await applyMigrations(config.databaseUrl, 'up');
    queries = makeQueries(config.databaseUrl);
  });

  // empty database before each test
  beforeEach(async () => {
    const pool = getPool(config.databaseUrl);
    await pool.query('DELETE FROM people');
  });

  // migrate down and close database connection after all tests
  afterAll(async () => {
    await applyMigrations(config.databaseUrl, 'down');
    await getPool(config.databaseUrl).end();
  });

  describe('.checkConnection', () => {
    it('returns true when database connection is successful', async () => {
      const result = await queries.checkConnection();
      expect(result).toBe(true);
    });

    it('returns false when database query throws an error', async () => {
      vi.spyOn(getPool(config.databaseUrl), 'query').mockImplementationOnce(() => {
        throw new Error();
      });

      const result = await queries.checkConnection();
      expect(result).toBe(false);
    });

    it('returns false when query returns unexpected results', async () => {
      vi.spyOn(getPool(config.databaseUrl), 'query').mockImplementationOnce(() => ({
        rows: [{ conn_test: 2 }],
      }));

      const result = await queries.checkConnection();
      expect(result).toBe(false);
    });

    it('returns false when query returns empty results', async () => {
      vi.spyOn(getPool(config.databaseUrl), 'query').mockImplementationOnce(() => ({
        rows: [],
      }));

      const result = await queries.checkConnection();
      expect(result).toBe(false);
    });
  });

  describe('.getAllPeople and .addPerson', () => {
    it('gets all people and adds to the database', async () => {
      const people1 = await queries.getAllPeople();
      expect(people1).toHaveLength(0);

      const joe = await queries.addPerson({ name: 'Joe', age: 20 });
      const john = await queries.addPerson({ name: 'John', age: 21 });
      expect(joe).toEqual({ id: expect.any(Number), name: 'Joe', age: 20 });
      expect(john).toEqual({ id: expect.any(Number), name: 'John', age: 21 });

      const people2 = await queries.getAllPeople();
      expect(people2).toHaveLength(2);
      expect(people2).toEqual([joe, john]);
    });
  });

  describe('.getPersonById', () => {
    it('returns the matching person', async () => {
      const joe = await queries.addPerson({ name: 'Joe', age: 20 });

      const found = await queries.getPersonById(joe.id);
      expect(found).toEqual(joe);
    });

    it('returns undefined when person does not exist', async () => {
      const found = await queries.getPersonById(999999);
      expect(found).toBeUndefined();
    });
  });
});
