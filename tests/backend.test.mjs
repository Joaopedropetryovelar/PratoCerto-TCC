import test from 'node:test';
import assert from 'node:assert/strict';
import { criarAmbiente } from './ambienteDemo.mjs';
test('demonstração compartilha registros entre aluno/equipe e isola escolas na consulta',async()=>{
 const {demo,backend:b}=await criarAmbiente();await demo.entrarDemonstracao('aluno','tarde');
 const lista=await b.getDocs(b.query(b.collection(b.database,'NomePratos'),b.where('data','==','2026-10-12'),b.where('escola','==','Satc')));assert.equal(lista.size,3);
 const prato=lista.docs.find(p=>p.data().turno==='tarde');const ref=b.doc(b.database,'confirmacoes',`${prato.id}_demo-aluno-tarde`);await b.setDoc(ref,{vaiConsumir:true});await demo.entrarDemonstracao('admin');assert.equal((await b.getDoc(ref)).data().vaiConsumir,true);
});
test('demonstração impede conta real e encerra apenas usuário fictício',async()=>{const {demo,backend:b}=await criarAmbiente();await demo.entrarDemonstracao('aluno');assert.throws(()=>b.createUserWithEmailAndPassword(b.auth,'x','y'),/Contas reais/);await b.signOut(b.auth);assert.equal(b.auth.currentUser,null);});
test('restauração gera duas escolas, próximos dias úteis e horário simulado de Brasília',async()=>{const {demo,backend:b}=await criarAmbiente();await demo.entrarDemonstracao('admin');const pratos=await b.getDocs(b.collection(b.database,'NomePratos'));assert.ok(pratos.size>=60);assert.equal(new Set(pratos.docs.map(d=>d.data().escola)).size,2);assert.ok(pratos.docs.every(d=>![0,6].includes(new Date(`${d.data().data}T12:00:00`).getDay())));assert.equal(demo.agoraAplicativo().toISOString(),'2026-10-12T11:00:00.000Z');});

test('demonstração no fim de semana simula segunda e permite ciclo completo',async()=>{const {demo}=await criarAmbiente();await demo.entrarDemonstracao('aluno','manha','Satc',new Date('2026-10-11T08:00:00-03:00'));assert.equal(demo.agoraAplicativo().toISOString(),'2026-10-12T11:00:00.000Z');demo.definirHorarioDemo('21:00');assert.equal(demo.agoraAplicativo().toISOString(),'2026-10-13T00:00:00.000Z');});
