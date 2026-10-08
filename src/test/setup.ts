import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'
import { resetVaultForTests } from '../features/profiles/vaultStore'

// Each test starts with a fresh vault store of this "tab".
afterEach(() => resetVaultForTests())
