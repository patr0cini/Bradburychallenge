// Atualiza os catálogos a partir das fontes.
//   npm run collect                       todas as fontes cuja última recolha tem mais de refreshDays
//   npm run collect -- --source lithub    só uma fonte (pode repetir-se)
//   npm run collect -- --force            ignora o intervalo mínimo entre recolhas
//   npm run collect -- --full             recolha completa, em vez de só as novidades
import { parseArgs } from 'node:util';
import { runCollection } from '../src/lib/collector.js';

const { values } = parseArgs({
  options: {
    source: { type: 'string', multiple: true },
    force: { type: 'boolean', default: false },
    full: { type: 'boolean', default: false },
  },
});

await runCollection({ sources: values.source, force: values.force, full: values.full });
