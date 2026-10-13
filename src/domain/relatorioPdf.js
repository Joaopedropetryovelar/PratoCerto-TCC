import * as PdfLib from 'pdf-lib/dist/pdf-lib.min.js';
import { agruparPorDia, kg, registroValido, resumirProducao, TURNOS } from './producao.js';
const { PDFDocument, StandardFonts, rgb } = PdfLib.default || PdfLib;

export async function gerarPdf(registros, { escola, inicio, fim, turno = 'todos', demo = false }) {
  const validos = registros.filter(registroValido).filter(r => r.escola === escola && r.data >= inicio && r.data <= fim && (turno === 'todos' || r.turno === turno)).sort((a,b) => a.data.localeCompare(b.data) || a.turno.localeCompare(b.turno));
  const doc = await PDFDocument.create();
  const normal = await doc.embedFont(StandardFonts.Helvetica), forte = await doc.embedFont(StandardFonts.HelveticaBold);
  const verde = rgb(.14,.38,.29), cinza = rgb(.32,.38,.35), linha = rgb(.86,.9,.87);
  const w = 595.28, h = 841.89, margem = 42, largura = w - margem * 2;
  let pagina, y;
  function limpar(valor) {
    return [...String(valor ?? '').replace(/[\r\n\t]+/g, ' ')].map(c => { try { normal.encodeText(c); return c; } catch { return '?'; } }).join('');
  }
  function texto(valor, x, posY, tamanho = 10, bold = false, color = cinza) { pagina.drawText(limpar(valor), {x,y:posY,size:tamanho,font:bold?forte:normal,color}); }
  function quebrar(valor, maximo = largura, tamanho = 10, bold = false) {
    const fonte = bold ? forte : normal, linhas = [];
    let atual = '';
    for (const palavra of limpar(valor).split(/\s+/)) {
      if (!palavra) continue;
      const candidato = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(candidato,tamanho) <= maximo) { atual = candidato; continue; }
      if (atual) { linhas.push(atual); atual=''; }
      for (const c of palavra) { if (atual && fonte.widthOfTextAtSize(atual+c,tamanho) > maximo) {linhas.push(atual);atual='';} atual += c; }
    }
    if (atual) linhas.push(atual);
    return linhas;
  }
  function novaPagina() {
    pagina = doc.addPage([w,h]); y = h - margem;
    pagina.drawRectangle({x:0,y:h-14,width:w,height:14,color:verde});
    texto('PRATO CERTO',margem,y,12,true,verde); y-=26;
    texto('Relatório de refeições',margem,y,23,true,verde); y-=26;
    for (const l of quebrar(`${escola} | ${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')} | ${TURNOS.find(t=>t.id===turno)?.nome || turno}`,largura,10)) {texto(l,margem,y);y-=14;}
    if (demo) {texto('DEMONSTRAÇÃO - DADOS FICTÍCIOS',margem,y,9,true,rgb(.6,.36,.1));y-=14;}
    pagina.drawLine({start:{x:margem,y:y-4},end:{x:w-margem,y:y-4},thickness:1,color:linha}); y-=26;
  }
  function espaco(altura) { if (y-altura < 55) novaPagina(); }
  function paragrafo(valor, tamanho=10, bold=false, maximo=largura) {
    for (const l of quebrar(valor,maximo,tamanho,bold)) {espaco(tamanho+6);texto(l,margem,y,tamanho,bold);y-=tamanho+5;} y-=5;
  }
  novaPagina();
  const resumo = resumirProducao(validos);
  const cartoes = [['Refeições servidas',resumo.servidos.toLocaleString('pt-BR')],['Sobra de alimentos',`${kg(resumo.sobrasG,2)} kg`],['Descarte medido',resumo.medidos?`${kg(resumo.descarteG,2)} kg`:'Não informado']];
  const cw = (largura-20)/3;
  cartoes.forEach(([rotulo,valor],i) => {
    const x=margem+i*(cw+10);
    pagina.drawRectangle({x,y:y-76,width:cw,height:88,color:rgb(.95,.97,.95)});
    texto(rotulo,x+12,y-8,10,true);
    let tamanho = 19; while (forte.widthOfTextAtSize(limpar(valor),tamanho) > cw-24 && tamanho > 10) tamanho -= 1;
    texto(valor,x+12,y-43,tamanho,true,verde);
  }); y-=104;
  paragrafo(`${resumo.registros} registros; ${resumo.medidos} com pesagens detalhadas e ${resumo.rapidos} rápidos. Sobra é o alimento que ficou sem servir. Descarte é informado somente quando medido.`);
  if (resumo.percentualDescarte !== null) paragrafo(`Taxa de descarte nas pesagens detalhadas: ${resumo.percentualDescarte.toFixed(1).replace('.',',')}%.`);
  const dias=agruparPorDia(validos).slice(-31);
  for (const [campo,titulo,unidade] of [['servidos','Refeições servidas por dia','ref.'],['sobrasG','Sobras por dia','kg']]) {
    const chunks=[];for(let i=0;i<dias.length;i+=10)chunks.push(dias.slice(i,i+10));
    for (let c=0;c<chunks.length;c+=1) {
      espaco(174);paragrafo(c===0?titulo:`${titulo} (continuação)`,13,true);
      const itens=chunks[c],valores=itens.map(d=>campo==='servidos'?d.servidos:d.sobrasG/1000),maior=Math.max(1,...valores),passo=largura/itens.length;
      const base=y-104;
      pagina.drawLine({start:{x:margem,y:base},end:{x:w-margem,y:base},thickness:.7,color:linha});
      itens.forEach((d,i)=>{
        const x=margem+i*passo+passo*.22,altura=valores[i]/maior*68;
        pagina.drawRectangle({x,y:base,width:passo*.56,height:altura,color:campo==='servidos'?verde:rgb(.65,.46,.24)});
        texto(campo==='servidos'?String(valores[i]):valores[i].toFixed(2).replace('.',','),x,base+altura+6,8,true);
        texto(`${d.data.slice(8)}/${d.data.slice(5,7)}`,x-1,base-14,8);
      });y=base-33;paragrafo(`Unidade: ${unidade.replace(/\.$/,'')}. Dias sem registro não entram como zero.`,8);
    }
  }
  if (dias.length) paragrafo('Os gráficos mostram até os últimos 31 dias com registros. A lista abaixo inclui o período completo.',8);
  espaco(90);paragrafo('Registros do período',16,true);
  if (!validos.length) paragrafo('Nenhum registro válido no período selecionado.');
  for (const r of validos) {
    const nome = quebrar(r.refeicaoNome || 'Refeição',largura,11,true);
    const obsLinhas = r.observacao ? quebrar(`Observação: ${r.observacao}`,largura,9).length : 0;
    espaco(115 + nome.length*16 + obsLinhas*14);
    paragrafo(`${r.data.split('-').reverse().join('/')} | ${TURNOS.find(t=>t.id===r.turno)?.nome || r.turno}`,9,true);
    paragrafo(r.refeicaoNome || 'Refeição',11,true);
    paragrafo(`${r.servidos} refeições servidas | Sobra: ${kg(r.schemaVersion===2?r.sobraTotalG:r.sobraLimpaG+r.sobraDescartadaG,3)} kg`);
    if(r.schemaVersion===2) paragrafo('Registro rápido. Descarte e quantidade preparada não informados.',9);
    else {
      paragrafo(`Preparado: ${kg(r.preparadoG)} kg | Sobra limpa: ${kg(r.sobraLimpaG)} kg`,9);
      paragrafo(`Sobra descartada: ${kg(r.sobraDescartadaG)} kg | Restos dos pratos: ${kg(r.restosG)} kg`,9);
    }
    if(r.observacao)paragrafo(`Observação: ${r.observacao}`,9);
    espaco(18);pagina.drawLine({start:{x:margem,y:y+1},end:{x:w-margem,y:y+1},thickness:.7,color:linha});y-=18;
  }
  const paginas=doc.getPages();
  paginas.forEach((p,i)=>p.drawText(`Prato Certo | ${demo?'Dados fictícios':'Registro da equipe'} | Página ${i+1} de ${paginas.length}`,{x:margem,y:26,size:8,font:normal,color:cinza}));
  doc.setTitle('Prato Certo - Relatório de refeições');doc.setAuthor('Prato Certo');
  return doc.save();
}
