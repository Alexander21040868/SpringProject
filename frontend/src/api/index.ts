import type { Api } from './contract'
import { httpApi } from './http'
import { mockApi } from './mock'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

export const api: Api = USE_MOCK ? mockApi : httpApi
export { USE_MOCK }
export type { Api } from './contract'
