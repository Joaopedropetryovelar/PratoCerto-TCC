import { Platform, Share } from 'react-native';
import { gerarCsv } from '../domain/producao';

export async function exportarProducao(registros, inicio, fim) {
  const texto = gerarCsv(registros);
  const nome = `PratoCerto_${inicio}_${fim}.csv`;
  if (Platform.OS !== 'web') {
    return Share.share({ title: nome, message: texto });
  }
  const blob = new Blob([texto], { type: 'text/csv;charset=utf-8' });
  const endereco = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nome;
  document.body.appendChild(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(endereco), 1000);
  }
}

export async function exportarPdf(registros, opcoes) {
  const { gerarPdf } = require('../domain/relatorioPdf');
  const bytes = await gerarPdf(registros, opcoes);
  const nome = `PratoCerto_${opcoes.inicio}_${opcoes.fim}.pdf`;
  if (Platform.OS === 'web') {
    const endereco = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = endereco; link.download = nome; document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(endereco), 1000); }
    return;
  }
  const { File, Paths } = require('expo-file-system');
  const Sharing = require('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  const arquivo = new File(Paths.cache, `${Date.now()}_${nome}`);
  await arquivo.create({ overwrite: true });
  await arquivo.write(bytes);
  await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Relatório Prato Certo' });
  return arquivo.uri;
}
