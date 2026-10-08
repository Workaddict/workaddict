import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkLogin } from '../../storage'
import { useAuth, type NewVault } from './AuthContext'
import { signInAttempt, type LoginFailure, type SignInFrom } from './signInAttempt'

export interface SignInInput {
  token: string
  repo: string
  save: boolean
  from: SignInFrom
  profileId?: string
  reused?: boolean
  newVault?: NewVault
}

/** Flows that always end in a saved profile. */
export const savesProfile = (input: Pick<SignInInput, 'save' | 'from'>) =>
  input.save || input.from === 'add' || input.from === 'profile'

/**
 * The fix page for a failed sign-in. Only non-secret facts go into the URL: the error, the entered
 * repository, where the form was, and what the page cannot know after a reload (owner type, reset
 * time). The token stays in `signInAttempt`.
 */
export function fixPath(input: Pick<SignInInput, 'repo' | 'from'>, failure: LoginFailure): string {
  const repo = encodeURIComponent(input.repo.trim()).replace(/%2F/gi, '/')
  let path = `/fix?e=${failure.error}&repo=${repo}&from=${input.from}`
  if (failure.ownerType === 'User') path += '&kind=user'
  if (failure.resetAt) path += `&at=${failure.resetAt.getTime()}`
  return path
}

/**
 * Checks the token and repository and signs in (or adds the profile, or replaces its token). On
 * failure the attempt is kept in memory and the app moves to the fix page for that error; a
 * signed-in profile stays signed in.
 */
export function useSignIn() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  const submit = useCallback(
    async (input: SignInInput, opts: { replace?: boolean } = {}) => {
      setBusy(true)
      let failure: LoginFailure
      try {
        const res = await checkLogin({ token: input.token, repo: input.repo })
        if (res.ok) {
          await login(
            {
              mode: 'github',
              token: input.token.trim(),
              repo: res.repo.full_name,
              branch: res.repo.default_branch,
              ...(res.scopes ? { scopes: res.scopes } : {}),
              ...(res.ownerType ? { ownerType: res.ownerType } : {}),
            },
            savesProfile(input)
              ? {
                  login: res.user.login,
                  replaceProfileId: input.from === 'profile' ? input.profileId : undefined,
                  newVault: input.newVault,
                }
              : false,
          )
          signInAttempt.clear()
          navigate('/', { replace: true })
          return
        }
        failure = res
      } catch {
        failure = { ok: false, error: 'unknown' }
      } finally {
        setBusy(false)
      }
      signInAttempt.set({ ...input, failure })
      navigate(fixPath(input, failure), { replace: opts.replace })
    },
    [login, navigate],
  )

  return { submit, busy }
}
