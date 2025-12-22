import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, protocol } from 'electron'
import { createHandler } from 'next-electron-rsc'

// mata certinho
process.on('SIGTERM', () => process.exit(0))
process.on('SIGINT', () => process.exit(0))

let mainWindow: BrowserWindow | null = null
let stopIntercept: (() => void) | undefined

function ensureSqliteDb() {
  if (!app.isPackaged) {
    console.log('[DB] DEV usando .env DATABASE_URL:', process.env.DATABASE_URL)
    return
  }

  const userData = app.getPath('userData')
  const dbDir = path.join(userData, 'prisma')
  const dbPath = path.join(dbDir, 'dev.db')

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })

  const bundled = path.join(app.getAppPath(), 'prisma', 'dev.db')

  if (!fs.existsSync(dbPath) && fs.existsSync(bundled)) {
    fs.copyFileSync(bundled, dbPath)
  }

  process.env.DATABASE_URL = `file:${dbPath}`
  console.log('[DB] PROD usando:', process.env.DATABASE_URL)
}

// ✅✅ CRÍTICO: createHandler precisa ser avaliado ANTES do app ficar ready
const appPath = app.getAppPath()
const dev = process.env.NODE_ENV === 'development'

// IMPORTANTE: veja a correção 2 (dir)
const dir = dev ? appPath : appPath // em prod vamos usar appPath e empacotar ".next" (abaixo)

const { createInterceptor, localhostUrl } = createHandler({
  dev,
  dir,
  protocol,
  debug: true,
  turbo: true,
})

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      contextIsolation: true,
    },
  })

  stopIntercept = await createInterceptor({
    session: mainWindow.webContents.session,
  })

  mainWindow.on('closed', () => {
    stopIntercept?.()
    stopIntercept = undefined
    mainWindow = null
  })

  await mainWindow.loadURL(localhostUrl + '/')
  console.log('[APP] Loaded', localhostUrl)
}

app.on('ready', async () => {
  ensureSqliteDb()
  await createMainWindow()
})

app.on('window-all-closed', () => app.quit())
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
})
