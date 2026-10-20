import { join } from 'node:path';
import { DATA_DIR, readJson, writeJson } from './catalog.js';
import type { Schedule } from './selection.js';

export const SCHEDULE_FILE = join(DATA_DIR, 'schedule.json');

export function loadSchedule(path = SCHEDULE_FILE): Schedule {
  return readJson<Schedule>(path, {});
}

/** Grava com as datas por ordem, para os diffs no repositório serem legíveis. */
export function saveSchedule(schedule: Schedule, path = SCHEDULE_FILE) {
  const sorted = Object.fromEntries(Object.keys(schedule).sort().map((d) => [d, schedule[d]!]));
  writeJson(path, sorted);
}
