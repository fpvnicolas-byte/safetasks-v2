import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor monetário em Reais (BRL)
 * @param value - Valor em centavos (ex: 150000 = R$ 1.500,00)
 * @returns String formatada em BRL
 */
export function formatCurrency(value: number): string {
  // Divide por 100 se o valor vier em centavos
  const reais = typeof value === 'number' ? value / 100 : 0;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}
