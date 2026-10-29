import { Platform } from 'react-native';
import { gerarCsv } from '../domain/producao';

export async function exportarProducao(registros, inicio, fim) {
  const texto = gerarCsv(registros);
  const nome = `PratoCerto_${inicio}_${fim}.csv`;
  if (Platform.OS !== 'web') {
    return compartilharArquivo(nome, texto, 'text/csv', 'public.comma-separated-values-text');
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
  return compartilharArquivo(nome, bytes, 'application/pdf', 'com.adobe.pdf');
}

async function compartilharArquivo(nome, conteudo, mimeType, UTI) {
  const { File, Paths } = require('expo-file-system');
  const Sharing = require('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível neste aparelho.');
  const arquivo = new File(Paths.cache, `${Date.now()}_${nome}`);
  try {
    arquivo.create({ overwrite: true });
    arquivo.write(conteudo);
    await Sharing.shareAsync(arquivo.uri, { mimeType, UTI, dialogTitle: 'Relatório Prato Certo' });
    return arquivo.uri;
  } catch (erro) {
    try { if (arquivo.exists) arquivo.delete(); } catch {}
    throw erro;
  }
}

export async function exportarDadosPessoais(dados) {
  const texto = JSON.stringify(dados, null, 2), nome = 'Meus-dados-PratoCerto.json';
  if (Platform.OS === 'web') {
    const endereco = URL.createObjectURL(new Blob([texto], {type:'application/json'}));
    const link = document.createElement('a'); link.href = endereco; link.download = nome;
    document.body.appendChild(link);
    try { link.click(); } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(endereco), 1000); }
    return;
  }
  const { File, Paths } = require('expo-file-system'), Sharing = require('expo-sharing');
  if (!(await Sharing.isAvailableAsync())) throw new Error('Compartilhamento indisponível. Solicite a cópia à direção.');
  const arquivo = new File(Paths.cache, `${Date.now()}_${nome}`);
  try { arquivo.create({overwrite:true}); arquivo.write(texto); await Sharing.shareAsync(arquivo.uri,{mimeType:'application/json',UTI:'public.json'}); }
  finally { if (arquivo.exists) arquivo.delete(); }
}