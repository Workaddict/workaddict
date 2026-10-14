import { PROJECT_COLORS, type Workspace } from './types'

/** Next palette color not yet used by an active project (cycles when all are used). */
export function nextProjectColor(ws: Workspace | undefined): string {
  const used = new Set((ws?.projects ?? []).filter((p) => !p.archived).map((p) => p.color))
  return (
    PROJECT_COLORS.find((c) => !used.has(c)) ??
    PROJECT_COLORS[(ws?.projects.length ?? 0) % PROJECT_COLORS.length]!
  )
}
