function escapeCsv(value: unknown) {
  const s = String(value ?? '')

  // se tiver ; , " \n \r, envolve em aspas e escapa aspas duplas
  // (a vírgula é importante aqui, pra evitar Excel/Sheets quebrando)
  if (/[;,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function getDownloadCsv(
  filename: string,
  rows: Array<Record<string, unknown>>,
) {
  if (!rows.length) return

  const headers = Object.keys(rows[0])

  // "sep=;" ajuda o Excel a entender o delimitador corretamente
  const csv = [
    'sep=;',
    headers.map(escapeCsv).join(';'),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(';')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  URL.revokeObjectURL(url)
}
