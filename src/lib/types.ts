export type Category = 'poem' | 'essay' | 'story';

export const CATEGORIES: Category[] = ['poem', 'essay', 'story'];

/** O que um módulo de recolha devolve para cada texto. */
export interface CollectedItem {
  category: Category;
  title: string;
  author: string;
  url: string;
  /** true = só para assinantes; false = acesso livre; null = desconhecido. */
  paywalled: boolean | null;
  translator?: string;
  year?: number;
}

/** Entrada guardada em data/catalog/*.json. */
export interface CatalogItem extends CollectedItem {
  /** Identificador estável: `<fonte>:<url canónico sem domínio>`. */
  id: string;
  source: string;
  firstSeen: string;
  lastSeen: string;
  /** false quando a fonte deixou de listar o texto. Nunca se apaga: o schedule pode referi-lo. */
  active: boolean;
}

export interface SourceContext {
  fetchText(url: string): Promise<string>;
  fetchJson<T = unknown>(url: string): Promise<T>;
  log(message: string): void;
  /** URLs já conhecidos desta fonte (no catálogo ou excluídos), para não repetir pedidos. */
  knownUrls: Set<string>;
  /** Data ISO da última recolha bem-sucedida desta fonte; ausente na primeira recolha. */
  lastRun?: string;
}

/** Interface comum a todos os módulos de recolha. */
export interface Source {
  id: string;
  name: string;
  /** Nome do site mostrado ao leitor. */
  siteName: string;
  categories: Category[];
  collect(ctx: SourceContext): Promise<CollectResult>;
}

export interface CollectResult {
  items: CollectedItem[];
  /**
   * true quando a recolha percorreu a lista completa da fonte. Só nesse caso
   * os textos que deixaram de aparecer são marcados como inativos.
   */
  complete: boolean;
  /** Textos vistos mas deixados de fora (excertos, listas, entrevistas...), com o motivo. */
  excluded?: { url: string; reason: string }[];
  /** URLs já conhecidos que a fonte ainda lista mas que não foram pedidos de novo. */
  stillListed?: string[];
}
