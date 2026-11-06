import { describe, expect, it } from 'vitest';
import { DEVICE_GROUPS, deviceForDay, deviceOrder, deviceSlug, loadDevices } from '../src/site/devices.js';

describe('figura literária do dia', () => {
  const devices = loadDevices();

  it('a lista tem figuras completas, sem nomes repetidos', () => {
    expect(devices.length).toBeGreaterThan(100);
    expect(new Set(devices.map((d) => deviceSlug(d.name))).size).toBe(devices.length);
    for (const d of devices) {
      expect(d.name && d.definition && d.example, d.name).toBeTruthy();
      expect(Object.keys(DEVICE_GROUPS)).toContain(d.group);
    }
  });

  it('a ordem é sempre a mesma e passa por todas antes de repetir', () => {
    expect(deviceOrder(devices).map((d) => d.name)).toEqual(deviceOrder([...devices].reverse()).map((d) => d.name));
    const first = Array.from({ length: devices.length }, (_, i) => deviceForDay(i + 1, devices)!.name);
    expect(new Set(first).size).toBe(devices.length);
    expect(deviceForDay(devices.length + 1, devices)).toBe(deviceForDay(1, devices));
  });

  it('não há figura antes do primeiro dia', () => {
    expect(deviceForDay(0, devices)).toBeUndefined();
  });

  it('cria âncoras simples', () => {
    expect(deviceSlug('Chekhov’s gun')).toBe('chekhovs-gun');
    expect(deviceSlug('In medias res')).toBe('in-medias-res');
  });
});
