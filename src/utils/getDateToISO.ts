export function getDateToISO(dateString: string) {
  // 1. Pega o momento exato de "agora" (fuso horário do navegador da pessoa)
  const now = new Date()

  // 2. Separa a data escolhida no input (ex: "2024-05-20")
  const [year, month, day] = dateString.split('-').map(Number)

  // 3. Aplica o Ano, Mês e Dia escolhidos na data de "agora",
  // mas MANTÉM a hora, minuto e segundo atuais.
  // Obs: (month - 1) porque em JS o mês começa em 0 (janeiro)
  now.setFullYear(year, month - 1, day)

  // 4. Retorna a string ISO completa (ex: 2024-05-20T15:43:12.000Z)
  return now.toISOString()
}
