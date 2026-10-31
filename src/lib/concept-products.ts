export type Category = 'all' | 'audio' | 'workspace' | 'accessories';
export const conceptProducts = [
  { id: 'headphones', category: 'audio', image: '/images/collection/headphones.webp' },
  { id: 'keyboard', category: 'workspace', image: '/images/collection/keyboard.webp' },
  { id: 'mouse', category: 'accessories', image: '/images/collection/mouse.webp' },
] as const;
export type ConceptProduct = (typeof conceptProducts)[number];
export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && ['all', 'audio', 'workspace', 'accessories'].includes(value);
}
export function getConceptProduct(id: string) {
  return conceptProducts.find((product) => product.id === id);
}
