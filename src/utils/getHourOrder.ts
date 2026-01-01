// ✅ Função auxiliar para formatar a data: DD/MM/YY - HH:MM
export function getHourOrder(date: Date | string | null) {
  if (!date) return ''
  const d = new Date(date)

  // Verifica se a data é válida
  if (isNaN(d.getTime())) return ''

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = String(d.getFullYear()).slice(-2) // Pega só os 2 últimos dígitos do ano
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')

  return `${day}/${month}/${year} - ${hours}:${minutes}`
}
