import { useCallback } from 'react'
import { isNameTaken, newId } from '../../domain/ids'
import { MAX_PROJECT_REPOS } from '../../domain/issueRef'
import type { Project, Tag } from '../../domain/types'
import { useUpdateWorkspace } from './hooks'

export { nextProjectColor } from '../../domain/projectColor'

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

  /** Adds or removes a linked repository, based on the latest workspace (no lost updates). */
  const setProjectRepo = useCallback(
    (project: Project, repo: string, linked: boolean) =>
      mutate({
        fn: (ws) => ({
          ...ws,
          projects: ws.projects.map((p) => {
            if (p.id !== project.id) return p
            const others = (p.repos ?? []).filter((r) => r.toLowerCase() !== repo.toLowerCase())
            const repos = linked ? [...others, repo].slice(0, MAX_PROJECT_REPOS) : others
            return { ...p, repos }
          }),
        }),
        summary: `${linked ? 'link' : 'unlink'} ${repo} ${linked ? 'to' : 'from'} project "${project.name}"`,
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
    setProjectRepo,
    deleteProject,
    createTag,
    updateTag,
    deleteTag,
    isPending: update.isPending,
  }
}
