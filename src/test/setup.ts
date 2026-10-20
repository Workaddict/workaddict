import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach, beforeEach } from 'vitest'
import { resetChecklistForTests } from '../features/help/checklistState'
import { resetTourForTests } from '../features/help/tourStore'
import { resetVaultForTests } from '../features/profiles/vaultStore'

// The welcome dialog would cover every page test; tests of the dialog set their own state.
beforeEach(() => {
  try {
    localStorage.setItem('workaddict.tour', JSON.stringify({ status: 'declined', laterCount: 0 }))
  } catch {
    // storage mocked to fail in this test
  }
  resetTourForTests()
  resetChecklistForTests()
})

// Each test starts with a fresh vault store of this "tab".
afterEach(() => resetVaultForTests())
