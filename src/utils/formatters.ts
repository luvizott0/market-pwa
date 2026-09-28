export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'R$ 0,00'
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numericValue)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatFullDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00`)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatRelativeDays(days: number | null | undefined): { text: string; isUrgent: boolean } {
  if (days === null || days === undefined) return { text: '', isUrgent: false }
  if (days < 0) {
    const absDays = Math.abs(days)
    return { text: `Venceu há ${absDays} ${absDays === 1 ? 'dia' : 'dias'}`, isUrgent: true }
  }
  if (days === 0) {
    return { text: 'Vence hoje!', isUrgent: true }
  }
  if (days === 1) {
    return { text: 'Vence amanhã', isUrgent: true }
  }
  if (days <= 7) {
    return { text: `Vence em ${days} dias`, isUrgent: true }
  }
  return { text: `Vence em ${days} dias`, isUrgent: false }
}
