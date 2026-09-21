import { useCallback } from 'react'
import { isNameTaken, newId } from '../../domain/ids'
import { PROJECT_COLORS, type Project, type Tag, type Workspace } from '../../domain/types'
import { useUpdateWorkspace } from './hooks'

/** Next palette color not yet used by an active project (cycles when all are used). */
export function nextProjectColor(ws: Workspace | undefined): string {
  const used = new Set((ws?.projects ?? []).filter((p) => !p.archived).map((p) => p.color))
  return (
    PROJECT_COLORS.find((c) => !used.has(c)) ??
    PROJECT_COLORS[(ws?.projects.length ?? 0) % PROJECT_COLORS.length]!
  )
}

/**
 * Workspace edits as pure functions. Ids are generated up front so callers can use a new
 * project/tag immediately (the update is applied optimistically).
 */
export function useWorkspaceActions() {
  const update = useUpdateWorkspace()
  const mutate = update.mutateAsync

  const createProject = useCallback(
    async (name: string, color: string): Promise<string> => {
      const project: Project = { id: newId(), name: name.trim(), color, archived: false }
      await mutate({
        fn: (ws) =>
          isNameTaken(ws.projects, project.name) ? ws : { ...ws, projects: [...ws.projects, project] },
        summary: `add project "${project.name}"`,
      })
      return project.id
    },
    [mutate],
  )

  const updateProject = useCallback(
    (id: string, patch: Partial<Omit<Project, 'id'>>, summary: string) =>
      mutate({
        fn: (ws) => ({
          ...ws,
          projects: ws.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
        summary,
      }),
    [mutate],
  )

  const deleteProject = useCallback(
    (p: Project) =>
      mutate({
        fn: (ws) => ({ ...ws, projects: ws.projects.filter((x) => x.id !== p.id) }),
        summary: `delete project "${p.name}"`,
      }),
    [mutate],
  )

  const createTag = useCallback(
    async (name: string): Promise<string> => {
      const tag: Tag = { id: newId(), name: name.trim(), archived: false }
      await mutate({
        fn: (ws) => (isNameTaken(ws.tags, tag.name) ? ws : { ...ws, tags: [...ws.tags, tag] }),
        summary: `add tag "${tag.name}"`,
      })
      return tag.id
    },
    [mutate],
  )

  const updateTag = useCallback(
    (id: string, patch: Partial<Omit<Tag, 'id'>>, summary: string) =>
      mutate({
        fn: (ws) => ({ ...ws, tags: ws.tags.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
        summary,
      }),
    [mutate],
  )

  const deleteTag = useCallback(
    (tag: Tag) =>
      mutate({
        fn: (ws) => ({ ...ws, tags: ws.tags.filter((x) => x.id !== tag.id) }),
        summary: `delete tag "${tag.name}"`,
      }),
    [mutate],
  )

  return {
    createProject,
    updateProject,
    deleteProject,
    createTag,
    updateTag,
    deleteTag,
    isPending: update.isPending,
  }
}
