// Converte "YYYY-MM-DD" para ISO (colocando meio-dia pra evitar problemas de fuso/DST)
export function getDateToISO(date: string) {
  return new Date(`${date}T12:00:00`).toISOString()
}
