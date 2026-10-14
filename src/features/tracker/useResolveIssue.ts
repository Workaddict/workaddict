import { isIssueRef, parseIssueInput, type IssueParse } from '../../domain/issueRef'
import type { Project } from '../../domain/types'
import { useWorkspace } from '../data/hooks'

/** The project an entry's short `#42` resolves through. */
export function useProject(projectId: string | null): Project | undefined {
  const projects = useWorkspace().data?.projects
  return projectId ? projects?.find((p) => p.id === projectId) : undefined
}

/**
 * Resolves what is in a form's issue field when saving: a stored `owner/repo#42` as is,
 * anything else (e.g. `#42` typed before the project was chosen) through the current project.
 */
export function useResolveIssue(
  projectId: string | null,
): (value: string | undefined) => IssueParse {
  const project = useProject(projectId)
  return (value) =>
    value === undefined || isIssueRef(value)
      ? { ok: true, ref: value ?? null }
      : parseIssueInput(value, project)
}
