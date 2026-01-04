// Componente para geração de relatórios PDF
// Nota: Requer instalação de jspdf - npm install jspdf

// Interface para dados dinâmicos do relatório
interface ReportData {
  periodoInicio: string;
  periodoFim: string;
  ano: number;
  kpis: {
    receitaTotal: number;
    custosTotais: number;
    lucroLiquido: number;
    margemLucro: number;
    totalProducoes: number;
    taxaConclusao: number;
  };
  statusProducoes: {
    concluido: number;
    emAndamento: number;
    aprovado: number;
    rascunho: number;
  };
  topClientes: Array<{
    nome: string;
    producoes: number;
    valor: number;
  }>;
}

export const generatePDFReport = async (data?: ReportData): Promise<void> => {
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

    // Declarar variável hoje no início para evitar erro de inicialização
    const hoje = new Date();

    // Cabeçalho profissional
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Logo/empresa
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // white
    doc.setFont('helvetica', 'bold');
    doc.text('SAFE TASKS', margin, 20);

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Gestão de Produções Audiovisuais', margin, 28);

    // Data no canto direito
    doc.setFontSize(9);
    doc.text(`Gerado em: ${hoje.toLocaleDateString('pt-BR')}`, pageWidth - margin - 50, 20);

    yPosition = 45;

    // Título do relatório
    doc.setFillColor(59, 130, 246); // blue-600
    doc.rect(margin - 5, yPosition - 8, pageWidth - 2 * margin + 10, 20, 'F');

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255); // white
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO EXECUTIVO', pageWidth / 2, yPosition + 2, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(12);
    doc.text('FVA - Produções Audiovisuais', pageWidth / 2, yPosition + 2, { align: 'center' });
    yPosition += 20;

    // Linha separadora
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Preparar dados dinâmicos ou usar defaults
    const reportData = data || {
      periodoInicio: 'Janeiro',
      periodoFim: hoje.toLocaleDateString('pt-BR', { month: 'long' }),
      ano: hoje.getFullYear(),
      kpis: {
        receitaTotal: 328000,
        custosTotais: 185000,
        lucroLiquido: 143000,
        margemLucro: 28.5,
        totalProducoes: 20,
        taxaConclusao: 85.2
      },
      statusProducoes: {
        concluido: 60,
        emAndamento: 25,
        aprovado: 10,
        rascunho: 5
      },
      topClientes: [
        { nome: 'Cliente A', producoes: 3, valor: 25000 },
        { nome: 'Cliente B', producoes: 2, valor: 22000 },
        { nome: 'Cliente C', producoes: 2, valor: 18000 }
      ]
    };

    // Data e informações do relatório
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Gerado em: ${hoje.toLocaleDateString('pt-BR')}`, margin, yPosition);
    doc.text(`Período: ${reportData.periodoInicio} - ${reportData.periodoFim} ${reportData.ano}`, pageWidth - margin - 80, yPosition);
    yPosition += 20;

    // Indicadores Principais
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('INDICADORES PRINCIPAIS', margin, yPosition);
    yPosition += 15;

    // Função auxiliar para formatar valores monetários
    const formatCurrency = (value: number): string => {
      // Divide por 100 se o valor vier em centavos (consistente com utils.ts)
      const reais = typeof value === 'number' ? value / 100 : 0;

      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(reais);
    };

    // Dados dos KPIs com layout profissional
    const kpis = [
      {
        label: 'Receita Total',
        value: formatCurrency(reportData.kpis.receitaTotal),
        change: '+12.5%',
        color: [59, 130, 246] // blue-600
      },
      {
        label: 'Custos Totais',
        value: formatCurrency(reportData.kpis.custosTotais),
        change: '+8.2%',
        color: [239, 68, 68] // red-500
      },
      {
        label: 'Lucro Líquido',
        value: formatCurrency(reportData.kpis.lucroLiquido),
        change: '+15.8%',
        color: [16, 185, 129] // emerald-600
      },
      {
        label: 'Margem de Lucro',
        value: `${reportData.kpis.margemLucro.toFixed(1)}%`,
        change: 'Meta: 25%',
        color: [245, 158, 11] // amber-500
      },
      {
        label: 'Total de Produções',
        value: reportData.kpis.totalProducoes.toString(),
        change: '+3 este mês',
        color: [139, 92, 246] // violet-500
      },
      {
        label: 'Taxa de Conclusão',
        value: `${reportData.kpis.taxaConclusao.toFixed(1)}%`,
        change: 'Meta: 90%',
        color: [6, 182, 212] // cyan-500
      }
    ];

    // Layout profissional dos KPIs
    doc.setFontSize(11);
    kpis.forEach(kpi => {
      // Fundo colorido sutil para cada linha
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 12, 'F');

      // Label em negrito
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(kpi.label + ':', margin, yPosition);

      // Valor destacado
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
      doc.text(kpi.value, margin + 55, yPosition);

      // Variação
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(kpi.change, margin + 110, yPosition);

      yPosition += 12;
    });

    yPosition += 10;

    // Status das Produções
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('STATUS DAS PRODUÇÕES', margin, yPosition);
    yPosition += 15;

    // Dados dinâmicos do status das produções
    const totalProducoes = reportData.kpis.totalProducoes;
    const statusData = [
      {
        status: 'Concluído',
        percentage: `${reportData.statusProducoes.concluido}%`,
        count: `${Math.round(totalProducoes * reportData.statusProducoes.concluido / 100)} produções`,
        color: [16, 185, 129] // emerald-600
      },
      {
        status: 'Em Andamento',
        percentage: `${reportData.statusProducoes.emAndamento}%`,
        count: `${Math.round(totalProducoes * reportData.statusProducoes.emAndamento / 100)} produções`,
        color: [245, 158, 11] // amber-500
      },
      {
        status: 'Aprovado',
        percentage: `${reportData.statusProducoes.aprovado}%`,
        count: `${Math.round(totalProducoes * reportData.statusProducoes.aprovado / 100)} produções`,
        color: [59, 130, 246] // blue-600
      },
      {
        status: 'Rascunho',
        percentage: `${reportData.statusProducoes.rascunho}%`,
        count: `${Math.round(totalProducoes * reportData.statusProducoes.rascunho / 100)} produções`,
        color: [100, 116, 139] // slate-500
      }
    ];

    // Layout profissional com barras de progresso
    doc.setFontSize(11);
    statusData.forEach(status => {
      // Fundo alternado para melhor leitura
      const isEven = statusData.indexOf(status) % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 12, 'F');
      }

      // Status
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(status.status + ':', margin, yPosition);

      // Barra de progresso visual
      const barWidth = 40;
      const barHeight = 6;
      const progressWidth = (parseInt(status.percentage) / 100) * barWidth;

      doc.setFillColor(229, 231, 235); // slate-200 - fundo da barra
      doc.rect(margin + 45, yPosition - 2, barWidth, barHeight, 'F');

      doc.setFillColor(status.color[0], status.color[1], status.color[2]); // cor da barra
      doc.rect(margin + 45, yPosition - 2, progressWidth, barHeight, 'F');

      // Porcentagem
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(status.color[0], status.color[1], status.color[2]);
      doc.text(status.percentage, margin + 50, yPosition);

      // Contagem
      doc.setTextColor(100, 116, 139);
      doc.text(status.count, margin + 90, yPosition);

      yPosition += 12;
    });

    yPosition += 10;

    // Top Clientes
    if (yPosition > 250) {
      doc.addPage(); // Nova página se necessário
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('TOP CLIENTES', margin, yPosition);
    yPosition += 15;

    // Dados dinâmicos dos top clientes
    const topClients = reportData.topClientes.map((cliente, index) => ({
      rank: index + 1,
      name: cliente.nome,
      productions: cliente.producoes,
      total: formatCurrency(cliente.valor)
    }));

    // Cabeçalho da tabela com estilo profissional
    doc.setFontSize(11);
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin - 2, yPosition - 6, pageWidth - 2 * margin + 4, 14, 'F');

    doc.setTextColor(255, 255, 255); // white
    doc.setFont('helvetica', 'bold');
    doc.text('#', margin, yPosition);
    doc.text('Cliente', margin + 15, yPosition);
    doc.text('Produções', margin + 80, yPosition);
    doc.text('Total', margin + 120, yPosition);
    yPosition += 5;

    // Linha separadora
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    // Renderizar linhas da tabela com layout profissional
    topClients.forEach((client, index) => {
      // Fundo alternado para melhor leitura
      const isEven = index % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin - 2, yPosition - 4, pageWidth - 2 * margin + 4, 12, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      // Ranking com medalha para top 3
      const rankSymbol = client.rank <= 3 ? ['🥇', '🥈', '🥉'][client.rank - 1] : `${client.rank}.`;
      doc.setFontSize(10);
      doc.text(rankSymbol, margin, yPosition);

      // Nome do cliente
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(client.name, margin + 15, yPosition);

      // Número de produções
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 92, 246); // violet-500
      doc.text(client.productions.toString(), margin + 80, yPosition);

      // Valor total
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(client.total, margin + 120, yPosition);

      yPosition += 12;
    });

    // Rodapé profissional
    const pageHeight = doc.internal.pageSize.getHeight();

    // Linha separadora do rodapé
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

    // Informações do rodapé
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('SafeTasks V2 - Sistema de Gestão de Produções Audiovisuais', margin, pageHeight - 20);
    doc.text('Relatório gerado automaticamente em tempo real', margin, pageHeight - 15);

    // Data e versão no lado direito
    const timestamp = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${timestamp}`, pageWidth - margin - 50, pageHeight - 20);
    doc.text('Versão: 2.0.0', pageWidth - margin - 50, pageHeight - 15);

    // Salvar o PDF com nome mais profissional
    const periodoFormatado = `${reportData.periodoInicio}_${reportData.periodoFim}_${reportData.ano}`.toLowerCase();
    const fileName = `relatorio-executivo-fva-${periodoFormatado}.pdf`;
    doc.save(fileName);

    console.log('✅ Relatório PDF gerado com sucesso:', fileName);

  } catch (error) {
    console.error('❌ Erro ao gerar relatório PDF:', error);
    throw new Error('Falha ao gerar relatório PDF. Verifique se a biblioteca jspdf está instalada.');
  }
};

export default { generatePDFReport };
