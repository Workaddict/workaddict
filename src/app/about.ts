// Project and author links, shared by the start page footer and Settings → About.
export const REPO_URL = 'https://github.com/Workaddict/workaddict'
export const REPO_NAME = 'Workaddict/workaddict'
export const ISSUES_URL = `${REPO_URL}/issues`
export const DISCUSSIONS_URL = `${REPO_URL}/discussions`
export const SECURITY_URL = `${REPO_URL}/blob/main/SECURITY.md`
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`
export const LICENSE_NAME = 'AGPL-3.0'
export const AUTHOR_NAME = 'Benedikt Lehner'
export const AUTHOR_URL = 'https://github.com/BenediktLehner'
export const APP_VERSION = __APP_VERSION__

/** A new question in the project's Q&A discussions, titled after a help topic. */
export function helpQuestionUrl(topic: string): string {
  return `${DISCUSSIONS_URL}/new?${new URLSearchParams({ category: 'q-a', title: `Help: ${topic}` })}`
}
