import { assert } from '@japa/assert'
import type { Config } from '@japa/runner/types'
export const plugins: Config['plugins'] = [assert()]
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = { setup: [], teardown: [] }
export const configureSuite: Config['configureSuite'] = () => {}
