import { loadSiteData, type SiteDay } from './data.js';

export interface DayPageProps {
  day: SiteDay;
  previous?: string;
  next?: string;
}

/** Caminhos estáticos das páginas de dia (iguais nas duas línguas, só muda o prefixo). */
export function dayPaths() {
  const { days } = loadSiteData();
  return days.map((day, i) => {
    const [year, month, d] = day.date.split('-');
    return {
      params: { year, month, day: d },
      props: { day, previous: days[i - 1]?.date, next: days[i + 1]?.date } satisfies DayPageProps,
    };
  });
}

export const DAYS_PER_PAGE = 30;

/** Os dias anteriores a hoje, do mais recente para o mais antigo (Arquivo). */
export function pastDays(): SiteDay[] {
  const { days, today } = loadSiteData();
  return days.filter((d) => d.date < today).reverse();
}
