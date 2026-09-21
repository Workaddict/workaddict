import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import { can, type Action } from '../../domain/permissions'
import type {
  Access,
  DateRange,
  Member,
  Project,
  Role,
  RunningTimer,
  Tag,
  TimeEntry,
  Workspace,
} from '../../domain/types'
import type { StorageAdapter, TimerFields, TimerPatch } from '../../storage'

type StartTimerResult = Awaited<ReturnType<StorageAdapter['startTimer']>>
import { useSessionData } from '../auth/AuthContext'

export const keys = {
  workspace: ['workspace'] as const,
  members: ['members'] as const,
  entries: ['entries'] as const,
  entriesRange: (r: DateRange) => ['entries', r.from.toISOString(), r.to.toISOString()] as const,
  entriesAll: ['entries', 'all'] as const,
  timers: ['timers'] as const,
  access: ['access'] as const,
  roles: ['roles'] as const,
}

export const TIMER_POLL_MS = 30_000

// ---- queries ---------------------------------------------------------------

export function useWorkspace() {
  const { adapter } = useSessionData()
  return useQuery({ queryKey: keys.workspace, queryFn: () => adapter.getWorkspace() })
}

export function useMembers() {
  const { adapter } = useSessionData()
  return useQuery({
    queryKey: keys.members,
    queryFn: () => adapter.listMembers(),
    staleTime: 5 * 60_000,
  })
}

export function useEntries(range: DateRange) {
  const { adapter } = useSessionData()
  return useQuery({
    queryKey: keys.entriesRange(range),
    queryFn: () => adapter.listEntries(range),
    placeholderData: (prev) => prev,
    // Pick up entries created on other devices (e.g. a timer stopped elsewhere). Cheap: one tree
    // request; unchanged files are served from the blob-SHA cache.
    refetchInterval: TIMER_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  })
}

export function useAllEntries() {
  const { adapter } = useSessionData()
  return useQuery({ queryKey: keys.entriesAll, queryFn: () => adapter.listAllEntries() })
}

/** All running timers; polled while the page is visible and refreshed on focus. */
export function useTimers() {
  const { adapter } = useSessionData()
  return useQuery({
    queryKey: keys.timers,
    queryFn: () => adapter.listTimers(),
    refetchInterval: TIMER_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  })
}

export function useMyTimer(): RunningTimer | null {
  const { user } = useSessionData()
  const { data } = useTimers()
  return data?.find((t) => t.login === user.login) ?? null
}

/** Id → object lookups; unknown ids (deleted items) resolve to undefined. */
export function useLookups() {
  const ws = useWorkspace().data
  const members = useMembers().data
  return useMemo(() => {
    const projects = new Map<string, Project>((ws?.projects ?? []).map((p) => [p.id, p]))
    const tags = new Map<string, Tag>((ws?.tags ?? []).map((t) => [t.id, t]))
    const memberMap = new Map<string, Member>((members ?? []).map((m) => [m.login, m]))
    return {
      workspace: ws,
      members: members ?? [],
      project: (id: string | null) => (id ? projects.get(id) : undefined),
      tag: (id: string) => tags.get(id),
      member: (login: string): Member => memberMap.get(login) ?? { login, avatarUrl: null },
    }
  }, [ws, members])
}

// ---- optimistic cache helpers ---------------------------------------------

type Snapshot = [QueryKey, unknown][]

async function snapshot(qc: QueryClient, key: QueryKey): Promise<Snapshot> {
  await qc.cancelQueries({ queryKey: key })
  return qc.getQueriesData({ queryKey: key })
}

function restore(qc: QueryClient, snap: Snapshot | undefined) {
  snap?.forEach(([k, v]) => qc.setQueryData(k, v))
}

function patchEntries(qc: QueryClient, fn: (list: TimeEntry[]) => TimeEntry[]) {
  qc.setQueriesData<TimeEntry[]>({ queryKey: keys.entries }, (old) => (old ? fn(old) : old))
}

const upsert = (e: TimeEntry) => (list: TimeEntry[]) => [...list.filter((x) => x.id !== e.id), e]

// ---- mutations -------------------------------------------------------------

/**
 * Feedback for mutations whose calling component may unmount mid-flight (the optimistic timer
 * update swaps the timer bar's idle/running views). Hook-level callbacks still run after unmount;
 * per-call `mutate(…, { onError })` callbacks would be dropped.
 */
export interface MutationFeedback<T> {
  onSuccess?: (result: T) => void
  onError?: (error: unknown) => void
}

export function useSaveEntry() {
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entry, previousStart }: { entry: TimeEntry; previousStart?: string }) =>
      adapter.saveEntry(entry, previousStart),
    onMutate: async ({ entry }) => {
      const snap = await snapshot(qc, keys.entries)
      patchEntries(qc, upsert(entry))
      return snap
    },
    onError: (_e, _v, snap) => restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.entries }),
  })
}

export function useDeleteEntry(feedback?: MutationFeedback<void>) {
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (entry: TimeEntry) => adapter.deleteEntry(entry),
    onMutate: async (entry) => {
      const snap = await snapshot(qc, keys.entries)
      patchEntries(qc, (list) => list.filter((x) => x.id !== entry.id))
      return snap
    },
    onSuccess: () => feedback?.onSuccess?.(),
    onError: (e, _v, snap) => {
      restore(qc, snap)
      feedback?.onError?.(e)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.entries }),
  })
}

function replaceMyTimer(qc: QueryClient, login: string, timer: RunningTimer | null) {
  qc.setQueryData<RunningTimer[]>(keys.timers, (old) => [
    ...(old ?? []).filter((t) => t.login !== login),
    ...(timer ? [timer] : []),
  ])
}

export function useStartTimer(feedback?: MutationFeedback<StartTimerResult>) {
  const { adapter, user } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fields: TimerFields) => adapter.startTimer(fields),
    onMutate: async (fields) => {
      const snap = await snapshot(qc, keys.timers)
      replaceMyTimer(qc, user.login, {
        id: 'pending',
        login: user.login,
        start: new Date().toISOString(),
        ...fields,
      })
      return snap
    },
    onSuccess: (res) => {
      replaceMyTimer(qc, user.login, res.timer)
      if (res.stopped) patchEntries(qc, upsert(res.stopped))
      feedback?.onSuccess?.(res)
    },
    onError: (e, _v, snap) => {
      restore(qc, snap)
      feedback?.onError?.(e)
    },
    onSettled: (res) => {
      void qc.invalidateQueries({ queryKey: keys.timers })
      if (res?.stopped) void qc.invalidateQueries({ queryKey: keys.entries })
    },
  })
}

export function useStopTimer(feedback?: MutationFeedback<TimeEntry | null>) {
  const { adapter, user } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adapter.stopTimer(new Date()),
    onMutate: async () => {
      const snap = await snapshot(qc, keys.timers)
      replaceMyTimer(qc, user.login, null)
      return snap
    },
    onSuccess: (entry) => {
      if (entry) patchEntries(qc, upsert(entry))
      feedback?.onSuccess?.(entry)
    },
    onError: (e, _v, snap) => {
      restore(qc, snap)
      feedback?.onError?.(e)
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.timers })
      void qc.invalidateQueries({ queryKey: keys.entries })
    },
  })
}

export function useUpdateTimer() {
  const { adapter, user } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (patch: TimerPatch) => adapter.updateTimer(patch),
    onMutate: async (patch) => {
      const snap = await snapshot(qc, keys.timers)
      qc.setQueryData<RunningTimer[]>(keys.timers, (old) =>
        old?.map((t) => (t.login === user.login ? { ...t, ...patch } : t)),
      )
      return snap
    },
    onError: (_e, _v, snap) => restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.timers }),
  })
}

export function useDiscardTimer(feedback?: MutationFeedback<void>) {
  const { adapter, user } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adapter.discardTimer(),
    onMutate: async () => {
      const snap = await snapshot(qc, keys.timers)
      replaceMyTimer(qc, user.login, null)
      return snap
    },
    onError: (e, _v, snap) => {
      restore(qc, snap)
      feedback?.onError?.(e)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.timers }),
  })
}

export function useUpdateWorkspace() {
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ fn, summary }: { fn: (ws: Workspace) => Workspace; summary: string }) =>
      adapter.updateWorkspace(fn, summary),
    onMutate: async ({ fn }) => {
      const snap = await snapshot(qc, keys.workspace)
      qc.setQueryData<Workspace>(keys.workspace, (old) => (old ? fn(old) : old))
      return snap
    },
    onSuccess: (ws) => qc.setQueryData(keys.workspace, ws),
    onError: (_e, _v, snap) => restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: keys.workspace }),
  })
}

// ---- roles -----------------------------------------------------------------

/**
 * The current user's role and permissions. Until it is loaded, the user is treated as a worker
 * (least privilege); the storage layer enforces the same checks on every write.
 */
export function useAccess() {
  const { adapter, user } = useSessionData()
  const { data } = useQuery({
    queryKey: keys.access,
    queryFn: () => adapter.getAccess(),
    refetchInterval: TIMER_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: 'always',
  })
  return useMemo(() => {
    const access: Access = data ?? { login: user.login, role: 'worker', owner: false }
    return { ...access, can: (action: Action) => can(access, action) }
  }, [data, user.login])
}

export function useTeamRoles(opts?: { enabled?: boolean }) {
  const { adapter } = useSessionData()
  return useQuery({
    queryKey: keys.roles,
    queryFn: () => adapter.listRoles(),
    enabled: opts?.enabled ?? true,
  })
}

export function useSetRole(feedback?: MutationFeedback<void>) {
  const { adapter } = useSessionData()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ login, role }: { login: string; role: Role }) => adapter.setRole(login, role),
    onSuccess: () => feedback?.onSuccess?.(undefined),
    onError: (e) => feedback?.onError?.(e),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.roles })
      void qc.invalidateQueries({ queryKey: keys.access })
    },
  })
}
