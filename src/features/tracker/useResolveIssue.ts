import { useQueryClient } from '@tanstack/react-query'
import { isIssueRef, parseIssueInput, reposOf, type IssueParse } from '../../domain/issueRef'
import type { Project, RunningTimer, TimeEntry } from '../../domain/types'
import { keys, useWorkspace } from '../data/hooks'

/** The project an entry's short `#42` resolves through. */
export function useProject(projectId: string | null): Project | undefined {
  const projects = useWorkspace().data?.projects
  return projectId ? projects?.find((p) => p.id === projectId) : undefined
}

/**
 * Repositories of the issue links already used in a project, newest first, from the entries and
 * timers loaded so far. They let `#42` work for a board's repository without linking it.
 */
export function useUsedRepos(projectId: string | null): () => string[] {
  const qc = useQueryClient()
  return () => {
    if (!projectId) return []
    const items: { start: string; issueRef?: string }[] = []
    for (const [, entries] of qc.getQueriesData<TimeEntry[]>({ queryKey: keys.entries })) {
      for (const e of entries ?? []) if (e.projectId === projectId && e.issueRef) items.push(e)
    }
    for (const t of qc.getQueryData<RunningTimer[]>(keys.timers) ?? []) {
      if (t.projectId === projectId && t.issueRef) items.push(t)
    }
    items.sort((a, b) => b.start.localeCompare(a.start))
    return reposOf(items.map((i) => i.issueRef))
  }
}

/** Parses issue input like {@link parseIssueInput}, with the project and its used repositories. */
export function useParseIssue(projectId: string | null): (text: string) => IssueParse {
  const project = useProject(projectId)
  const usedRepos = useUsedRepos(projectId)
  return (text) => parseIssueInput(text, project, usedRepos())
}

/**
 * Resolves what is in a form's issue field when saving: a stored `owner/repo#42` as is,
 * anything else (e.g. `#42` typed before the project was chosen) through the current project.
 */
export function useResolveIssue(
  projectId: string | null,
): (value: string | undefined) => IssueParse {
  const parse = useParseIssue(projectId)
  return (value) =>
    value === undefined || isIssueRef(value) ? { ok: true, ref: value ?? null } : parse(value)
}
