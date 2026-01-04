// Componente para geração de orçamentos PDF
// Nota: Requer instalação de jspdf - npm install jspdf

interface BudgetData {
  client: {
    full_name: string;
    email?: string;
    cnpj?: string;
    phone?: string;
    address?: string;
  };
  production: {
    id: number;
    title: string;
    status: string;
    created_at: string;
    deadline?: string;
  };
  items: Array<{
    id: number;
    service_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  services?: Array<any>;
  total: number;
  discount: number;
  tax: number;
}

export const generateBudgetPDF = async (data: BudgetData): Promise<void> => {
  try {
    // Import dinâmico para não afetar o bundle principal
    let jsPDF;
    try {
      jsPDF = (await import('jspdf')).default;
    } catch (importError) {
      throw new Error('Biblioteca jspdf não está instalada. Execute: npm install jspdf');
    }

    const doc = new jsPDF();

    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Função auxiliar para formatar valores monetários
    const formatCurrency = (value: number): string => {
      const reais = typeof value === 'number' ? value / 100 : 0;
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(reais);
    };

    // Cabeçalho profissional do orçamento
    doc.setFillColor(34, 197, 94); // green-500
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo/empresa
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SAFE TASKS', margin, 25);

    // Subtítulo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('ORÇAMENTO #FTV-' + data.production.id.toString().padStart(4, '0'), margin, 35);

    yPosition = 55;

    // Data e validade
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    const createdDate = new Date(data.production.created_at).toLocaleDateString('pt-BR');
    doc.text(`Data: ${createdDate}`, margin, yPosition);
    doc.text('Validade: 30 dias a partir da data de emissão', pageWidth - margin - 80, yPosition);
    yPosition += 20;

    // Título do documento
    doc.setFillColor(34, 197, 94);
    doc.rect(margin - 5, yPosition - 8, pageWidth - 2 * margin + 10, 20, 'F');

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO DE PRODUÇÃO AUDIOVISUAL', pageWidth / 2, yPosition + 2, { align: 'center' });
    yPosition += 25;

    // Dados do Cliente
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    // Fundo para seção do cliente
    doc.setFillColor(248, 250, 252);
    doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 35, 'F');

    doc.text(`Nome: ${data.client.full_name}`, margin + 5, yPosition);
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`, margin + 5, yPosition + 8);
    }
    if (data.client.phone) {
      doc.text(`Telefone: ${data.client.phone}`, margin + 5, yPosition + 16);
    }
    if (data.client.cnpj) {
      doc.text(`CNPJ: ${data.client.cnpj}`, margin + 5, yPosition + 24);
    }
    yPosition += 45;

    // Dados da Produção
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DA PRODUÇÃO', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    doc.setFillColor(248, 250, 252);
    doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 20, 'F');

    doc.text(`Título: ${data.production.title}`, margin + 5, yPosition);
    doc.text(`Status: ${data.production.status}`, margin + 5, yPosition + 8);
    if (data.production.deadline) {
      const deadline = new Date(data.production.deadline).toLocaleDateString('pt-BR');
      doc.text(`Prazo: ${deadline}`, margin + 5, yPosition + 16);
    }
    yPosition += 30;

    // Itens/Serviços
    if (data.items && data.items.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'bold');
      doc.text('ITENS E SERVIÇOS', margin, yPosition);
      yPosition += 10;

      // Cabeçalho da tabela
      doc.setFontSize(10);
      doc.setFillColor(30, 41, 59);
      doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Item/Serviço', margin + 5, yPosition);
      doc.text('Qtd', margin + 80, yPosition);
      doc.text('Valor Unit.', margin + 110, yPosition);
      doc.text('Total', margin + 150, yPosition);
      yPosition += 8;

      // Linha separadora
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      // Itens da tabela
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      data.items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        if (isEven) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin - 2, yPosition - 3, pageWidth - 2 * margin + 4, 10, 'F');
        }

        doc.text(item.service_name || 'Serviço', margin + 5, yPosition);
        doc.text(item.quantity.toString(), margin + 80, yPosition);
        doc.text(formatCurrency(item.unit_price), margin + 110, yPosition);
        doc.text(formatCurrency(item.total_price), margin + 150, yPosition);

        yPosition += 10;

        // Quebrar página se necessário
        if (yPosition > 250) {
          doc.addPage();
          yPosition = margin;
        }
      });

      yPosition += 10;
    }

    // Totais
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAIS', margin, yPosition);
    yPosition += 10;

    // Fundo para totais
    doc.setFillColor(34, 197, 94);
    doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 40, 'F');

    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');

    const subtotal = data.total + data.discount; // Reverter desconto para mostrar subtotal
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, margin + 5, yPosition);
    if (data.discount > 0) {
      doc.text(`Desconto: -${formatCurrency(data.discount)}`, margin + 5, yPosition + 8);
    }
    if (data.tax > 0) {
      doc.text(`Imposto: +${formatCurrency(data.tax)}`, margin + 5, yPosition + 16);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL: ${formatCurrency(data.total)}`, margin + 5, yPosition + 28);
    yPosition += 50;

    // Condições e observações
    if (yPosition > 200) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text('CONDIÇÕES E OBSERVAÇÕES', margin, yPosition);
    yPosition += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);

    const conditions = [
      '• Este orçamento tem validade de 30 dias a partir da data de emissão.',
      '• Os valores apresentados não incluem eventuais deslocamentos ou hospedagens.',
      '• O início dos trabalhos está sujeito à confirmação e assinatura do contrato.',
      '• Alterações no escopo podem impactar os valores finais.',
      '• Pagamento: 50% entrada + 50% conclusão.',
      '• Prazo de entrega: conforme especificado no projeto.'
    ];

    conditions.forEach(condition => {
      doc.text(condition, margin, yPosition);
      yPosition += 6;
    });

    // Rodapé
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('SafeTasks V2 - Sistema de Gestão de Produções Audiovisuais', margin, pageHeight - 15);
    doc.text(`Orçamento gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 10);

    // Salvar o PDF
    const fileName = `orcamento-ftv-${data.production.id.toString().padStart(4, '0')}.pdf`;
    doc.save(fileName);

    console.log('✅ Orçamento PDF gerado com sucesso:', fileName);

  } catch (error) {
    console.error('❌ Erro ao gerar orçamento PDF:', error);
    throw new Error('Falha ao gerar orçamento PDF. Verifique se a biblioteca jspdf está instalada.');
  }
};

export default { generateBudgetPDF };
