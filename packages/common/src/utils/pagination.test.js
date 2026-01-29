'use strict';

const {
  encodeCursor,
  decodeCursor,
  createCursor,
  paginate,
  parsePaginationParams,
  buildCursorQuery,
} = require('./pagination');

describe('pagination utils', () => {
  it('encodes and decodes cursors (round-trip)', () => {
    const data = { _id: 'abc', createdAt: '2024-01-01T00:00:00.000Z' };
    const cursor = encodeCursor(data);
    expect(typeof cursor).toBe('string');
    expect(decodeCursor(cursor)).toEqual(data);
  });

  it('returns null for invalid cursor decode', () => {
    expect(decodeCursor('not-a-base64url')).toBe(null);
  });

  it('creates cursor from item with Date fields', () => {
    const createdAt = new Date('2024-01-01T00:00:00.000Z');
    const cursor = createCursor({ _id: 'id1', createdAt });
    expect(decodeCursor(cursor)).toEqual({ _id: 'id1', createdAt: createdAt.toISOString() });
  });

  it('paginates and generates nextCursor only when hasMore', () => {
    const items = [
      { _id: '1', createdAt: new Date('2024-01-01T00:00:00.000Z') },
      { _id: '2', createdAt: new Date('2024-01-02T00:00:00.000Z') },
      { _id: '3', createdAt: new Date('2024-01-03T00:00:00.000Z') },
    ];

    const page1 = paginate({ items, limit: 2 });
    expect(page1.pagination.hasMore).toBe(true);
    expect(page1.data).toHaveLength(2);
    expect(typeof page1.pagination.nextCursor).toBe('string');

    const page2 = paginate({ items: items.slice(0, 2), limit: 2 });
    expect(page2.pagination.hasMore).toBe(false);
    expect(page2.pagination.nextCursor).toBe(null);
  });

  it('parses pagination params with clamped limit and offset fallback', () => {
    const p = parsePaginationParams({ limit: '500', page: '3' }, { defaultLimit: 20, maxLimit: 100 });
    expect(p.limit).toBe(100);
    expect(p.page).toBe(3);
    expect(p.skip).toBe(200);
  });

  it('builds cursor query based on sort order', () => {
    expect(buildCursorQuery({ createdAt: 'x' }, 'createdAt', -1)).toEqual({ createdAt: { $lt: 'x' } });
    expect(buildCursorQuery({ createdAt: 'x' }, 'createdAt', 1)).toEqual({ createdAt: { $gt: 'x' } });
    expect(buildCursorQuery(null)).toEqual({});
  });
});

