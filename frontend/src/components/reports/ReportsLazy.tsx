// Re-export report generators with dynamic imports for smaller initial bundles
export const generatePDFReport = async (data: any) => {
  const { generatePDFReport: lazyGeneratePDFReport } = await import('./ReportsGenerator');
  return lazyGeneratePDFReport(data);
};

export const generateBudgetPDF = async (data: any) => {
  const { generateBudgetPDF: lazyGenerateBudgetPDF } = await import('./BudgetGenerator');
  return lazyGenerateBudgetPDF(data);
};
