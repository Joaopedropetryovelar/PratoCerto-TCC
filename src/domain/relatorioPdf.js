import * as PdfLib from 'pdf-lib/dist/pdf-lib.min.js';
import { agruparPorDia, kg, registroValido, resumirProducao, TURNOS } from './producao.js';
const { PDFDocument, StandardFonts, rgb } = PdfLib.default || PdfLib;
export async function gerarPdf(registros, { escola, inicio, fim, turno = 'todos', demo = false }) {
  const validos = registros
    .filter(registroValido)
    .filter(
      (registroProducao) =>
        registroProducao.escola === escola &&
        registroProducao.data >= inicio &&
        registroProducao.data <= fim &&
        (turno === 'todos' || registroProducao.turno === turno),
    )
    .sort(
      (primeiroRegistro, segundoRegistro) =>
        primeiroRegistro.data.localeCompare(segundoRegistro.data) ||
        primeiroRegistro.turno.localeCompare(segundoRegistro.turno),
    );
  const documentoPdf = await PDFDocument.create();
  const normal = await documentoPdf.embedFont(StandardFonts.Helvetica),
    forte = await documentoPdf.embedFont(StandardFonts.HelveticaBold);
  const verde = rgb(0.14, 0.38, 0.29),
    cinza = rgb(0.32, 0.38, 0.35),
    linha = rgb(0.86, 0.9, 0.87);
  const larguraPagina = 595.28,
    alturaPagina = 841.89,
    margem = 42,
    largura = larguraPagina - margem * 2;
  let pagina, posicaoVertical;
  function limpar(valor) {
    return [...String(valor ?? '').replace(/[\r\n\t]+/g, ' ')]
      .map((corTexto) => {
        try {
          normal.encodeText(corTexto);
          return corTexto;
        } catch {
          return '?';
        }
      })
      .join('');
  }
  function texto(valor, posicaoHorizontal, posY, tamanho = 10, bold = false, color = cinza) {
    pagina.drawText(limpar(valor), {
      x: posicaoHorizontal,
      y: posY,
      size: tamanho,
      font: bold ? forte : normal,
      color,
    });
  }
  function quebrar(valor, maximo = largura, tamanho = 10, bold = false) {
    const fonte = bold ? forte : normal,
      linhas = [];
    let atual = '';
    for (const palavra of limpar(valor).split(/\s+/)) {
      if (!palavra) continue;
      const candidato = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(candidato, tamanho) <= maximo) {
        atual = candidato;
        continue;
      }
      if (atual) {
        linhas.push(atual);
        atual = '';
      }
      for (const corTexto of palavra) {
        if (atual && fonte.widthOfTextAtSize(atual + corTexto, tamanho) > maximo) {
          linhas.push(atual);
          atual = '';
        }
        atual += corTexto;
      }
    }
    if (atual) linhas.push(atual);
    return linhas;
  }
  function novaPagina() {
    pagina = documentoPdf.addPage([larguraPagina, alturaPagina]);
    posicaoVertical = alturaPagina - margem;
    pagina.drawRectangle({
      x: 0,
      y: alturaPagina - 14,
      width: larguraPagina,
      height: 14,
      color: verde,
    });
    texto('PRATO CERTO', margem, posicaoVertical, 12, true, verde);
    posicaoVertical -= 26;
    texto('Relatório de refeições', margem, posicaoVertical, 23, true, verde);
    posicaoVertical -= 26;
    for (const linhaAtual of quebrar(
      `${escola} | ${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')} | ${TURNOS.find((turnoDaLista) => turnoDaLista.id === turno)?.nome || turno}`,
      largura,
      10,
    )) {
      texto(linhaAtual, margem, posicaoVertical);
      posicaoVertical -= 14;
    }
    if (demo) {
      texto(
        'DEMONSTRAÇÃO - DADOS FICTÍCIOS',
        margem,
        posicaoVertical,
        9,
        true,
        rgb(0.6, 0.36, 0.1),
      );
      posicaoVertical -= 14;
    }
    pagina.drawLine({
      start: {
        x: margem,
        y: posicaoVertical - 4,
      },
      end: {
        x: larguraPagina - margem,
        y: posicaoVertical - 4,
      },
      thickness: 1,
      color: linha,
    });
    posicaoVertical -= 26;
  }
  function espaco(altura) {
    if (posicaoVertical - altura < 55) novaPagina();
  }
  function paragrafo(valor, tamanho = 10, bold = false, maximo = largura) {
    for (const linhaAtual of quebrar(valor, maximo, tamanho, bold)) {
      espaco(tamanho + 6);
      texto(linhaAtual, margem, posicaoVertical, tamanho, bold);
      posicaoVertical -= tamanho + 5;
    }
    posicaoVertical -= 5;
  }
  novaPagina();
  const resumo = resumirProducao(validos);
  const cartoes = [
    ['Refeições servidas', resumo.servidos.toLocaleString('pt-BR')],
    ['Sobra de alimentos', `${kg(resumo.sobrasG, 2)} kg`],
    ['Descarte medido', resumo.medidos ? `${kg(resumo.descarteG, 2)} kg` : 'Não informado'],
  ];
  const larguraCartao = (largura - 20) / 3;
  cartoes.forEach(([rotulo, valor], indice) => {
    const posicaoHorizontal = margem + indice * (larguraCartao + 10);
    pagina.drawRectangle({
      x: posicaoHorizontal,
      y: posicaoVertical - 76,
      width: larguraCartao,
      height: 88,
      color: rgb(0.95, 0.97, 0.95),
    });
    texto(rotulo, posicaoHorizontal + 12, posicaoVertical - 8, 10, true);
    let tamanho = 19;
    while (forte.widthOfTextAtSize(limpar(valor), tamanho) > larguraCartao - 24 && tamanho > 10)
      tamanho -= 1;
    texto(valor, posicaoHorizontal + 12, posicaoVertical - 43, tamanho, true, verde);
  });
  posicaoVertical -= 104;
  paragrafo(
    `${resumo.registros} registros; ${resumo.medidos} com pesagens detalhadas e ${resumo.rapidos} rápidos. Sobra é o alimento que ficou sem servir. Descarte é informado somente quando medido.`,
  );
  if (resumo.percentualDescarte !== null)
    paragrafo(
      `Taxa de descarte nas pesagens detalhadas: ${resumo.percentualDescarte.toFixed(1).replace('.', ',')}%.`,
    );
  const dias = agruparPorDia(validos).slice(-31);
  for (const [campo, titulo, unidade] of [
    ['servidos', 'Refeições servidas por dia', 'ref.'],
    ['sobrasG', 'Sobras por dia', 'kg'],
  ]) {
    const chunks = [];
    for (let indice = 0; indice < dias.length; indice += 10)
      chunks.push(dias.slice(indice, indice + 10));
    for (let indiceColuna = 0; indiceColuna < chunks.length; indiceColuna += 1) {
      espaco(174);
      paragrafo(indiceColuna === 0 ? titulo : `${titulo} (continuação)`, 13, true);
      const itens = chunks[indiceColuna],
        valores = itens.map((registroProducao) =>
          campo === 'servidos' ? registroProducao.servidos : registroProducao.sobrasG / 1000,
        ),
        maior = Math.max(1, ...valores),
        passo = largura / itens.length;
      const base = posicaoVertical - 104;
      pagina.drawLine({
        start: {
          x: margem,
          y: base,
        },
        end: {
          x: larguraPagina - margem,
          y: base,
        },
        thickness: 0.7,
        color: linha,
      });
      itens.forEach((resumoDiario, indice) => {
        const posicaoHorizontal = margem + indice * passo + passo * 0.22,
          altura = (valores[indice] / maior) * 68;
        pagina.drawRectangle({
          x: posicaoHorizontal,
          y: base,
          width: passo * 0.56,
          height: altura,
          color: campo === 'servidos' ? verde : rgb(0.65, 0.46, 0.24),
        });
        texto(
          campo === 'servidos'
            ? String(valores[indice])
            : valores[indice].toFixed(2).replace('.', ','),
          posicaoHorizontal,
          base + altura + 6,
          8,
          true,
        );
        texto(
          `${resumoDiario.data.slice(8)}/${resumoDiario.data.slice(5, 7)}`,
          posicaoHorizontal - 1,
          base - 14,
          8,
        );
      });
      posicaoVertical = base - 33;
      paragrafo(
        `Unidade: ${unidade.replace(/\.$/, '')}. Dias sem registro não entram como zero.`,
        8,
      );
    }
  }
  if (dias.length)
    paragrafo(
      'Os gráficos mostram até os últimos 31 dias com registros. A lista abaixo inclui o período completo.',
      8,
    );
  espaco(90);
  paragrafo('Registros do período', 16, true);
  if (!validos.length) paragrafo('Nenhum registro válido no período selecionado.');
  for (const registroProducao of validos) {
    const nome = quebrar(registroProducao.refeicaoNome || 'Refeição', largura, 11, true);
    const obsLinhas = registroProducao.observacao
      ? quebrar(`Observação: ${registroProducao.observacao}`, largura, 9).length
      : 0;
    espaco(115 + nome.length * 16 + obsLinhas * 14);
    paragrafo(
      `${registroProducao.data.split('-').reverse().join('/')} | ${TURNOS.find((turnoDaLista) => turnoDaLista.id === registroProducao.turno)?.nome || registroProducao.turno}`,
      9,
      true,
    );
    paragrafo(registroProducao.refeicaoNome || 'Refeição', 11, true);
    paragrafo(
      `${registroProducao.servidos} refeições servidas | Sobra: ${kg(registroProducao.schemaVersion === 2 ? registroProducao.sobraTotalG : registroProducao.sobraLimpaG + registroProducao.sobraDescartadaG, 3)} kg`,
    );
    if (registroProducao.schemaVersion === 2)
      paragrafo('Registro rápido. Descarte e quantidade preparada não informados.', 9);
    else {
      paragrafo(
        `Preparado: ${kg(registroProducao.preparadoG)} kg | Sobra limpa: ${kg(registroProducao.sobraLimpaG)} kg`,
        9,
      );
      paragrafo(
        `Sobra descartada: ${kg(registroProducao.sobraDescartadaG)} kg | Restos dos pratos: ${kg(registroProducao.restosG)} kg`,
        9,
      );
    }
    if (registroProducao.observacao) paragrafo(`Observação: ${registroProducao.observacao}`, 9);
    espaco(18);
    pagina.drawLine({
      start: {
        x: margem,
        y: posicaoVertical + 1,
      },
      end: {
        x: larguraPagina - margem,
        y: posicaoVertical + 1,
      },
      thickness: 0.7,
      color: linha,
    });
    posicaoVertical -= 18;
  }
  const paginas = documentoPdf.getPages();
  paginas.forEach((paginaDocumento, indice) =>
    paginaDocumento.drawText(
      `Prato Certo | ${demo ? 'Dados fictícios' : 'Registro da equipe'} | Página ${indice + 1} de ${paginas.length}`,
      {
        x: margem,
        y: 26,
        size: 8,
        font: normal,
        color: cinza,
      },
    ),
  );
  documentoPdf.setTitle('Prato Certo - Relatório de refeições');
  documentoPdf.setAuthor('Prato Certo');
  return documentoPdf.save();
}
