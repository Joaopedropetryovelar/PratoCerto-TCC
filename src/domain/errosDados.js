export function codigoDados(erro) { return String(erro?.code || '').replace(/^firestore\//, ''); }
export function mensagemDados(erro) {
  const codigo = codigoDados(erro);
  if (codigo === 'permission-denied') return 'O acesso a estes dados foi recusado. Se seu e-mail já está confirmado, peça à equipe para conferir as permissões da escola. Código: permission-denied.';
  if (codigo === 'unauthenticated') return 'Sua sessão terminou. Entre novamente para carregar os dados.';
  if (codigo === 'failed-precondition') return 'A configuração necessária para esta consulta ainda não está pronta. A equipe precisa conferir os índices do banco. Código: failed-precondition.';
  if (['unavailable', 'deadline-exceeded', 'auth/network-request-failed'].includes(codigo)) return 'Não foi possível conectar ao serviço. Confira sua conexão e tente novamente.';
  if (codigo === 'auth/user-token-expired') return 'Sua sessão expirou. Entre novamente.';
  return 'Não foi possível carregar estes dados. Tente novamente. Se persistir, informe à equipe o código ' + (codigo || 'dados-indisponiveis') + '.';
}
