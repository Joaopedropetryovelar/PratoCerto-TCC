import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {criarRuntime}=require('./runtime.cjs');
export async function criarAmbiente(){const runtime=criarRuntime();return {demo:runtime.demo(),backend:runtime.backend(),producao:runtime.carregar('src/services/producao.js'),sdk:{chamadas:[]}};}
