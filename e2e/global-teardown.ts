import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function globalTeardown() {
  const stateDir = path.join(__dirname, '.auth')
  if (fs.existsSync(stateDir)) {
    fs.rmSync(stateDir, { recursive: true, force: true })
  }
}

export default globalTeardown