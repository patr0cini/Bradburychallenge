/**
 * Acesso livre a partir dos dados estruturados da página (schema.org `isAccessibleForFree`,
 * o mesmo que os sites declaram à Google para os paywalls). Aceita booleanos e "True"/"False".
 * - false se a página ou alguma parte dela (`hasPart`) não for de acesso livre;
 * - true se a página se declarar de acesso livre e nenhuma parte o negar;
 * - null se a página não disser nada.
 */
export function accessFromHtml(html: string): boolean | null {
  const values = [...html.matchAll(/"isAccessibleForFree"\s*:\s*"?(true|false)"?/gi)].map((m) => m[1]!.toLowerCase() === 'true');
  if (values.length === 0) return null;
  return values.every(Boolean);
}
