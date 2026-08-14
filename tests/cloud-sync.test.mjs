import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(new URL("../cloud-sync.js", import.meta.url), "utf8");

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
}

function createClient(remote, updated = null) {
  const calls = [];
  return {
    calls,
    from() {
      let operation = "read";
      let payload;
      const query = {
        select() { return query; },
        eq() { return query; },
        update(value) { operation = "update"; payload = value; calls.push({ operation, payload }); return query; },
        insert(value) { operation = "insert"; payload = value; calls.push({ operation, payload }); return query; },
        maybeSingle() { return Promise.resolve({ data: operation === "read" ? remote : updated, error: null }); },
        single() { return Promise.resolve({ data: updated, error: null }); }
      };
      return query;
    }
  };
}

function loadSync() {
  const context = { window: {}, localStorage: createStorage(), console };
  vm.runInNewContext(source, context);
  return context.window.XiaorichangCloudSync;
}

test("a first-time empty device downloads existing cloud records", async () => {
  const syncApi = loadSync();
  const records = Array.from({ length: 35 }, (_, index) => ({ id: `r-${index}`, updatedAt: "2026-08-14T00:00:00Z" }));
  const client = createClient({ payload: { version: 1, records }, revision: 5, updated_at: "2026-08-14T09:46:12Z" });
  let backupCount = 0;
  let replacement;

  const result = await syncApi.sync({
    client,
    userId: "user-1",
    scope: "mobile",
    localState: { version: 1, records: [] },
    normalizeRemote: value => value,
    backupLocal: () => { backupCount += 1; },
    replaceLocal: value => { replacement = value; }
  });

  assert.equal(result.status, "downloaded");
  assert.equal(replacement.records.length, 35);
  assert.equal(backupCount, 1);
  assert.equal(client.calls.length, 0);
});

test("a first-time device with records uploads when the cloud is empty", async () => {
  const syncApi = loadSync();
  const client = createClient(
    { payload: { version: 1, records: [] }, revision: 5, updated_at: "2026-08-14T09:46:12Z" },
    { revision: 6, updated_at: "2026-08-14T10:00:00Z" }
  );

  const result = await syncApi.sync({
    client,
    userId: "user-1",
    scope: "mobile",
    localState: { version: 1, records: [{ id: "local-1", updatedAt: "2026-08-14T10:00:00Z" }] },
    normalizeRemote: value => value,
    backupLocal: () => {},
    replaceLocal: () => {}
  });

  assert.equal(result.status, "uploaded");
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].payload.payload.records.length, 1);
});
