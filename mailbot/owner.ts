export function isOwner(id: number | undefined, owners: number[]): boolean {
  return typeof id === 'number' && owners.includes(id);
}
