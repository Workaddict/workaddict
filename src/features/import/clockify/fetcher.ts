import {
  fetchAllPages,
  isClockifyError,
  newPagedList,
  type ClockifyClient,
  type ClockifyProject,
  type ClockifyTag,
  type ClockifyTimeEntry,
  type ClockifyUser,
  type PagedList,
} from './client'

export type UserFetchStatus = 'pending' | 'done' | 'noAccess'

export interface UserProgress {
  userId: string
  status: UserFetchStatus
  entries: PagedList<ClockifyTimeEntry>
}

/** Everything fetched from one Clockify workspace, input for convertClockify(). */
export interface ClockifyRaw {
  users: ClockifyUser[]
  projects: ClockifyProject[]
  tags: ClockifyTag[]
  /** Time entries per Clockify user id (only fetched users). */
  entries: Record<string, ClockifyTimeEntry[]>
  /** Users whose entries the key may not read. */
  noAccess: string[]
}

/**
 * Sequential, resumable fetch queue: metadata lists first, then the entries of each selected
 * user. Results stay in memory. When a request fails (e.g. Clockify's rate limit), the error is
 * thrown and the next run() continues with the request that failed; nothing is re-fetched.
 */
export class ClockifyFetcher {
  readonly users = newPagedList<ClockifyUser>()
  readonly projects = newPagedList<ClockifyProject>()
  readonly tags = newPagedList<ClockifyTag>()
  readonly progress = new Map<string, UserProgress>()

  constructor(
    private readonly client: ClockifyClient,
    private readonly workspaceId: string,
  ) {}

  get metaDone(): boolean {
    return this.users.done && this.projects.done && this.tags.done
  }

  get entriesDone(): boolean {
    return [...this.progress.values()].every((p) => p.status !== 'pending')
  }

  /** Sets the users whose entries are fetched; already fetched users are kept. */
  selectUsers(userIds: string[]) {
    for (const id of [...this.progress.keys()]) {
      if (!userIds.includes(id)) this.progress.delete(id)
    }
    for (const id of userIds) {
      if (!this.progress.has(id)) {
        this.progress.set(id, { userId: id, status: 'pending', entries: newPagedList() })
      }
    }
  }

  /** Fetches metadata, then all pending users; `onProgress` fires after every request. */
  async run(onProgress?: () => void): Promise<void> {
    const ws = this.workspaceId
    await fetchAllPages(this.users, (p) => this.client.listUsers(ws, p), onProgress)
    await fetchAllPages(this.projects, (p) => this.client.listProjects(ws, p), onProgress)
    await fetchAllPages(this.tags, (p) => this.client.listTags(ws, p), onProgress)
    for (const user of this.progress.values()) {
      if (user.status !== 'pending') continue
      try {
        await fetchAllPages(
          user.entries,
          (p) => this.client.listTimeEntries(ws, user.userId, p),
          onProgress,
        )
        user.status = 'done'
      } catch (e) {
        if (!isClockifyError(e, 'forbidden')) throw e
        user.status = 'noAccess'
      }
      onProgress?.()
    }
  }

  result(): ClockifyRaw {
    const entries: Record<string, ClockifyTimeEntry[]> = {}
    const noAccess: string[] = []
    for (const p of this.progress.values()) {
      if (p.status === 'done') entries[p.userId] = p.entries.items
      if (p.status === 'noAccess') noAccess.push(p.userId)
    }
    return {
      users: this.users.items,
      projects: this.projects.items,
      tags: this.tags.items,
      entries,
      noAccess,
    }
  }
}
