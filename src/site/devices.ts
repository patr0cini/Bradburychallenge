// "Literary device of the day": uma figura ou técnica literária por dia, debaixo das leituras.
// As definições e os exemplos foram escritos para este site (data/literary-devices.json); os
// exemplos citados vêm só de obras em domínio público. A lista de nomes partiu de três listas
// públicas (Alan Watt, Grammarly, Nicely Said na Medium), sem copiar o texto delas.
import { join } from 'node:path';
import { DATA_DIR, readJson } from '../lib/catalog.js';

export type DeviceGroup = 'figurative' | 'sound' | 'repetition' | 'narrative' | 'character';

export interface LiteraryDevice {
  name: string;
  group: DeviceGroup;
  definition: string;
  example: string;
  /** Autor e obra do exemplo, quando é uma citação. */
  source?: string;
}

export const DEVICE_GROUPS: Record<DeviceGroup, string> = {
  figurative: 'Figurative language',
  sound: 'Sound and wordplay',
  repetition: 'Repetition and structure',
  narrative: 'Narrative',
  character: 'Character and style',
};

export const DEVICES_FILE = join(DATA_DIR, 'literary-devices.json');
export const DEVICES_PATH = '/literary-devices/';

let cache: LiteraryDevice[] | undefined;
export const loadDevices = () => (cache ??= readJson<LiteraryDevice[]>(DEVICES_FILE, []));

export const deviceSlug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const devicePath = (name: string) => `${DEVICES_PATH}#${deviceSlug(name)}`;

// Gerador pseudoaleatório com semente fixa (mulberry32): a ordem é sempre a mesma em cada build.
function random(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A ordem em que as figuras aparecem, baralhada para não vir um grupo de cada vez. */
export function deviceOrder(devices: LiteraryDevice[], seed = 1000): LiteraryDevice[] {
  const list = [...devices].sort((a, b) => a.name.localeCompare(b.name));
  const next = random(seed);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [list[i], list[j]] = [list[j]!, list[i]!];
  }
  return list;
}

/** Figura do dia N de leituras (1 = o primeiro dia); recomeça quando a lista acaba. */
export function deviceForDay(dayNumber: number, devices: LiteraryDevice[] = loadDevices()): LiteraryDevice | undefined {
  if (!devices.length || dayNumber < 1) return undefined;
  const order = deviceOrder(devices);
  return order[(dayNumber - 1) % order.length];
}
