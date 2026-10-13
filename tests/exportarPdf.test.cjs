const {test}=require('node:test');const assert=require('node:assert/strict');const {criarRuntime}=require('./runtime.cjs');
test('V4 — PDF nativo grava bytes antes de compartilhar o arquivo',async()=>{
 const chamadas=[];class File {constructor(base,nome){this.uri=`${base}/${nome}`;}create(){chamadas.push('criar');}write(bytes){assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');chamadas.push('escrever');}}
 const r=criarRuntime({modulos:{'expo-file-system':{File,Paths:{cache:'file:///cache'}},'expo-sharing':{isAvailableAsync:async()=>true,shareAsync:async(uri,opts)=>{assert.match(uri,/\.pdf$/);assert.equal(opts.mimeType,'application/pdf');chamadas.push('compartilhar');}}}});
 const servico=r.carregar('src/services/exportar.js');const opcoes={escola:'Satc',inicio:'2026-10-01',fim:'2026-10-12',turno:'todos',demo:true};
 await servico.exportarPdf([{schemaVersion:2,escola:'Satc',data:'2026-10-01',turno:'manha',refeicaoId:'r',refeicaoNome:'Arroz',sobraTotalG:30000,servidos:100}],opcoes);
 assert.deepEqual(chamadas,['criar','escrever','compartilhar']);
});
test('V4 — compartilhamento indisponível falha sem anunciar entrega',async()=>{
 const r=criarRuntime({modulos:{'expo-file-system':{},'expo-sharing':{isAvailableAsync:async()=>false}}});
 await assert.rejects(r.carregar('src/services/exportar.js').exportarPdf([],{escola:'Satc',inicio:'2026-10-01',fim:'2026-10-12'}),/indisponível/);
});
