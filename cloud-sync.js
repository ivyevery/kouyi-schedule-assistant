(function () {
  const META_PREFIX = "ivy-interpreter-schedule-cloud-meta-v1";

  const SHARED_RECORD_FIELDS = [
    "id", "recordType", "projectName", "clientName", "industry", "eventDate", "endDate",
    "durationType", "durationDetail", "location", "interpretingType", "status", "notes",
    "hidden", "updatedAt"
  ];

  function unwrapState(input) {
    if (!input) return {};
    if (Array.isArray(input)) return { records: input };
    if (typeof input.payload === "string") {
      try {
        return unwrapState(JSON.parse(input.payload));
      } catch {
        return input;
      }
    }
    if (Array.isArray(input.backups) && input.backups.length) {
      const candidate = input.backups.find(item => item && item.payload);
      if (candidate) return unwrapState(candidate);
    }
    return input;
  }

  function toSharedRecord(record) {
    const shared = {};
    SHARED_RECORD_FIELDS.forEach(field => {
      if (field === "hidden") shared[field] = Boolean(record?.[field]);
      else shared[field] = record?.[field] ?? "";
    });
    shared.recordType = shared.recordType || "meeting";
    shared.durationType = shared.durationType || "全天";
    shared.status = shared.status || "reserved";
    return shared;
  }

  function toSharedState(input) {
    const source = unwrapState(input);
    const records = (Array.isArray(source.records) ? source.records : [])
      .map(toSharedRecord)
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return { version: 1, records };
  }

  function mergeSharedState(localState, remoteState) {
    const local = unwrapState(localState);
    const shared = toSharedState(remoteState);
    const localById = new Map((Array.isArray(local.records) ? local.records : []).map(record => [record.id, record]));
    const records = shared.records.map(record => ({ ...(localById.get(record.id) || {}), ...record }));
    return { ...local, version: 1, records };
  }

  function stableStringify(value) {
    if (value === null || typeof value !== "object") return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    const keys = Object.keys(value).filter(key => key !== "savedAt").sort();
    return `{${keys.map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  function fingerprint(value) {
    const text = stableStringify(value);
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function metaKey(userId, scope) {
    return `${META_PREFIX}:${userId}:${scope}`;
  }

  function readMeta(userId, scope) {
    try {
      return JSON.parse(localStorage.getItem(metaKey(userId, scope)) || "null");
    } catch {
      return null;
    }
  }

  function writeMeta(userId, scope, revision, syncedFingerprint) {
    const meta = {
      revision,
      fingerprint: syncedFingerprint,
      syncedAt: new Date().toISOString()
    };
    localStorage.setItem(metaKey(userId, scope), JSON.stringify(meta));
    return meta;
  }

  async function sync(options) {
    const {
      client,
      userId,
      scope,
      localState,
      normalizeRemote,
      backupLocal,
      replaceLocal
    } = options;
    const normalizedLocal = toSharedState(normalizeRemote(localState));
    const localFingerprint = fingerprint(normalizedLocal);
    const { data: remote, error: readError } = await client
      .from("app_state")
      .select("payload, revision, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (readError) throw readError;

    if (!remote) {
      const { data: created, error: createError } = await client
        .from("app_state")
        .insert({ user_id: userId, payload: normalizedLocal })
        .select("revision, updated_at")
        .single();
      if (createError) throw createError;
      const meta = writeMeta(userId, scope, created.revision, localFingerprint);
      return { status: "uploaded", revision: created.revision, updatedAt: created.updated_at, meta };
    }

    const normalizedRemote = toSharedState(normalizeRemote(remote.payload));
    const remoteFingerprint = fingerprint(normalizedRemote);
    const meta = readMeta(userId, scope);

    if (!meta) {
      const localCount = normalizedLocal.records.length;
      const remoteCount = normalizedRemote.records.length;

      // A new browser/device has no sync metadata yet. An empty side is not a
      // real conflict: bootstrap it from the side that already has records.
      if (localCount === 0 && remoteCount > 0) {
        backupLocal(localState);
        replaceLocal(normalizedRemote);
        const downloadedMeta = writeMeta(userId, scope, remote.revision, remoteFingerprint);
        return { status: "downloaded", revision: remote.revision, updatedAt: remote.updated_at, meta: downloadedMeta };
      }

      if (localCount > 0 && remoteCount === 0) {
        const { data: updated, error: updateError } = await client
          .from("app_state")
          .update({ payload: normalizedLocal })
          .eq("user_id", userId)
          .eq("revision", remote.revision)
          .select("revision, updated_at")
          .maybeSingle();
        if (updateError) throw updateError;
        if (!updated) return { status: "conflict", revision: remote.revision, updatedAt: remote.updated_at };
        const uploadedMeta = writeMeta(userId, scope, updated.revision, localFingerprint);
        return { status: "uploaded", revision: updated.revision, updatedAt: updated.updated_at, meta: uploadedMeta };
      }

      if (localFingerprint !== remoteFingerprint) {
        return { status: "conflict", revision: remote.revision, updatedAt: remote.updated_at };
      }
      const initializedMeta = writeMeta(userId, scope, remote.revision, remoteFingerprint);
      return { status: "current", revision: remote.revision, updatedAt: remote.updated_at, meta: initializedMeta };
    }

    const localChanged = localFingerprint !== meta.fingerprint;
    const cloudChanged = remote.revision !== meta.revision;

    if (!localChanged && !cloudChanged) {
      return { status: "current", revision: remote.revision, updatedAt: remote.updated_at, meta };
    }

    if (localFingerprint === remoteFingerprint) {
      const refreshedMeta = writeMeta(userId, scope, remote.revision, remoteFingerprint);
      return { status: "current", revision: remote.revision, updatedAt: remote.updated_at, meta: refreshedMeta };
    }

    if (!localChanged && cloudChanged) {
      backupLocal(localState);
      replaceLocal(normalizedRemote);
      const downloadedMeta = writeMeta(userId, scope, remote.revision, remoteFingerprint);
      return { status: "downloaded", revision: remote.revision, updatedAt: remote.updated_at, meta: downloadedMeta };
    }

    if (localChanged && !cloudChanged) {
      const { data: updated, error: updateError } = await client
        .from("app_state")
        .update({ payload: normalizedLocal })
        .eq("user_id", userId)
        .eq("revision", meta.revision)
        .select("revision, updated_at")
        .maybeSingle();
      if (updateError) throw updateError;
      if (!updated) return { status: "conflict", revision: remote.revision, updatedAt: remote.updated_at };
      const uploadedMeta = writeMeta(userId, scope, updated.revision, localFingerprint);
      return { status: "uploaded", revision: updated.revision, updatedAt: updated.updated_at, meta: uploadedMeta };
    }

    return { status: "conflict", revision: remote.revision, updatedAt: remote.updated_at };
  }

  window.XiaorichangCloudSync = Object.freeze({ sync, toSharedState, mergeSharedState });
})();
