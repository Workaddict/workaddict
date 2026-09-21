export function newId(): string {
  return crypto.randomUUID()
}

/** Case-insensitive, whitespace-trimmed name uniqueness check. */
export function isNameTaken(
  items: readonly { id: string; name: string }[],
  name: string,
  exceptId?: string,
): boolean {
  const n = name.trim().toLocaleLowerCase()
  return items.some((i) => i.id !== exceptId && i.name.trim().toLocaleLowerCase() === n)
}
