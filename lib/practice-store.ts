"use client";

import { openDB, type DBSchema } from "idb";
import type { Bookmark, LocalAttempt, PracticeSnapshot } from "./practice-types";

interface PracticeDb extends DBSchema {
  attempts: { key: string; value: LocalAttempt; indexes: { "by-updated": string } };
  bookmarks: { key: string; value: Bookmark; indexes: { "by-saved": string } };
}

const dbPromise = typeof window === "undefined" ? null : openDB<PracticeDb>("upscpuraan-pyq", 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const attempts = db.createObjectStore("attempts", { keyPath: "id" });
      attempts.createIndex("by-updated", "updatedAt");
      const bookmarks = db.createObjectStore("bookmarks", { keyPath: "questionId" });
      bookmarks.createIndex("by-saved", "savedAt");
    }
  },
});

async function database() {
  if (!dbPromise) throw new Error("Local practice storage is available in the browser only.");
  return dbPromise;
}

export async function createLocalAttempt(snapshot: PracticeSnapshot) {
  const now = new Date().toISOString();
  const attempt: LocalAttempt = {
    id: snapshot.id,
    snapshot,
    status: "in_progress",
    currentIndex: 0,
    answers: {},
    feedback: {},
    elapsedSeconds: 0,
    startedAt: now,
    updatedAt: now,
  };
  await (await database()).put("attempts", attempt);
  return attempt;
}

export async function putAttempt(attempt: LocalAttempt) {
  attempt.updatedAt = new Date().toISOString();
  await (await database()).put("attempts", attempt);
}

export async function getAttempt(id: string) { return (await database()).get("attempts", id); }
export async function listAttempts() { return (await database()).getAllFromIndex("attempts", "by-updated").then((items) => items.reverse()); }
export async function deleteAttempt(id: string) { await (await database()).delete("attempts", id); }
export async function listBookmarks() { return (await database()).getAllFromIndex("bookmarks", "by-saved").then((items) => items.reverse()); }
export async function getBookmark(id: string) { return (await database()).get("bookmarks", id); }
export async function saveBookmark(bookmark: Bookmark) { await (await database()).put("bookmarks", bookmark); }
export async function deleteBookmark(id: string) { await (await database()).delete("bookmarks", id); }

export async function clearPracticeData() {
  const db = await database();
  await Promise.all([db.clear("attempts"), db.clear("bookmarks")]);
}

export async function exportPracticeData() {
  return JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), attempts: await listAttempts(), bookmarks: await listBookmarks() }, null, 2);
}
