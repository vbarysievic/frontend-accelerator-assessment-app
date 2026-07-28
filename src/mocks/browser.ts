import { setupWorker } from 'msw/browser'
import { createHandlers } from './handlers.ts'
import { readScenario } from './scenarios.ts'

export async function enableMocking() {
  const worker = setupWorker(...createHandlers(readScenario()))
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
