import { validarRestricoes } from './restricoes.js';
export const VERSAO_TERMOS = '2026-10-13';
import { escolaValida, turnosDoPerfil } from './escolas.js';
export function emailNormalizado(email) { return String(email || '').trim().toLowerCase(); }
export function emailValido(email) {
  const texto = emailNormalizado(email);
  return texto.length <= 254 && /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(texto);
}
export function erroSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8 || senha.length > 128) return 'Use de 8 a 128 caracteres.';
  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha) || !/[^A-Za-z0-9\s]/.test(senha)) return 'Inclua uma letra, um número e um símbolo, como !, @ ou *.';
  return null;
}
export function validarCadastro(dados) {
  const erros = {};
  if (String(dados.nome || '').trim().length < 3 || String(dados.nome).trim().length > 100) erros.nome = 'Informe seu nome, de 3 a 100 caracteres.';
  if (!/^\d{5}$/.test(String(dados.matricula || '').trim())) erros.matricula = 'Informe uma matrícula com exatamente 5 dígitos.';
  if (!String(dados.turma || '').trim() || String(dados.turma).trim().length > 80) erros.turma = 'Informe sua turma.';
  if (!escolaValida(dados.escola)) erros.escola = 'Selecione sua escola.';
  if (!Array.isArray(dados.turnos) || !dados.turnos.length || dados.turnos.length > 3 || turnosDoPerfil(dados).length !== dados.turnos.length) erros.turnos = 'Selecione um ou mais turnos, sem repetir.';
  if (!emailValido(dados.email)) erros.email = 'Informe um e-mail válido que você consiga acessar.';
  const senha = erroSenha(dados.senha); if (senha) erros.senha = senha;
  if (dados.senha !== dados.confirmarSenha) erros.confirmarSenha = 'As senhas precisam ser iguais.';
  if (dados.aceitouTermos !== true) erros.termos = 'Leia e aceite os documentos para criar sua conta.';
  if (dados.restricoes) { const alimentares = validarRestricoes(dados.restricoes); if (Object.keys(alimentares).length) erros.restricoes = Object.values(alimentares)[0]; }
  return erros;
}
export function mensagemAuth(erro) {
  const mensagens = {
    'auth/invalid-credential': 'E-mail ou senha incorretos.', 'auth/wrong-password': 'E-mail ou senha incorretos.',
    'auth/user-not-found': 'E-mail ou senha incorretos.', 'auth/email-already-in-use': 'Este e-mail já possui uma conta. Entre ou recupere a senha.',
    'auth/invalid-email': 'Confira o endereço de e-mail.', 'auth/weak-password': 'A senha não atende à política da escola. Escolha outra senha.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde e tente novamente.', 'auth/network-request-failed': 'Confira sua conexão e tente novamente.',
    'auth/requires-recent-login': 'Entre novamente ou confirme sua senha atual para fazer esta alteração.',
    'auth/user-disabled': 'Esta conta foi desativada. Procure a equipe.',
    'permission-denied': 'A escola precisa conferir as permissões para concluir esta operação. Informe o código permission-denied à equipe.',
    'failed-precondition': 'A configuração do banco precisa ser concluída pela equipe. Informe o código failed-precondition.',
  };
  if (erro instanceof TypeError || erro instanceof ReferenceError || erro instanceof SyntaxError || /Cannot read properties|undefined is not an object/i.test(erro?.message || '')) return 'Não foi possível acessar sua conta. Tente novamente. Se continuar, procure a equipe.';
  return mensagens[erro?.code] || (erro?.code?.startsWith('auth/') ? 'Não foi possível concluir. Confira os dados e tente novamente.' : erro?.message || 'Não foi possível concluir. Tente novamente.');
}
