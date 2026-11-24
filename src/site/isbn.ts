// ISBN: validação do ISBN-13 e conversão para ISBN-10, que a Amazon usa como código do produto (ASIN) nos livros impressos.

const digits = (s: string) => s.replace(/[-\s]/g, '');

export function isbn13Valid(isbn: string): boolean {
  const d = digits(isbn);
  if (!/^\d{13}$/.test(d)) return false;
  const sum = [...d.slice(0, 12)].reduce((n, c, i) => n + Number(c) * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === Number(d[12]);
}

/** ISBN-10 de um ISBN-13 que começa por 978; os que começam por 979 não têm ISBN-10. */
export function isbn13To10(isbn: string): string | undefined {
  const d = digits(isbn);
  if (!isbn13Valid(d) || !d.startsWith('978')) return undefined;
  const core = d.slice(3, 12);
  const sum = [...core].reduce((n, c, i) => n + Number(c) * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}
