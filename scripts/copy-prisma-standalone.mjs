// scripts/copy-prisma-standalone.mjs
import fs from 'fs'
import path from 'path'

const appName = 'flow-sync'
const root = process.cwd()
const target = path.join(root, '.next', 'standalone', appName, 'node_modules')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dest, { recursive: true })
  fs.cpSync(src, dest, { recursive: true })
  console.log('[copy]', src, '->', dest)
}

// ✅ engines/binaries
copyDir(
  path.join(root, 'node_modules', '.prisma'),
  path.join(target, '.prisma'),
)

// ✅ runtime do prisma
copyDir(
  path.join(root, 'node_modules', '@prisma'),
  path.join(target, '@prisma'),
)
copyDir(
  path.join(root, 'node_modules', '@prisma', 'client'),
  path.join(target, '@prisma', 'client'),
)
