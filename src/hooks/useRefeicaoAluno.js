import { useColecaoEscola, useDocumento, usePerfil } from './useDados';
import { dataDaEscola, erroConfirmacao } from '../domain/refeicoes';
import { moverDia, erroAvaliacao } from '../domain/calendario';
import { podeConsumir, turnosDoPerfil } from '../domain/escolas';
import { useAgora } from './useAgora';
export function useRefeicaoAluno(identificador, modo = 'confirmacao') {
  const agora = useAgora(),
    hoje = dataDaEscola(agora),
    perfil = usePerfil();
  const escolhida = useDocumento('NomePratos', identificador);
  const lista = useColecaoEscola('NomePratos', perfil.perfil, [
    ['data', '>=', moverDia(hoje, modo === 'avaliacao' ? -10 : 0)],
    ['data', '<=', moverDia(hoje, modo === 'avaliacao' ? 0 : 14)],
  ]);
  const refeicoes = lista.dados
    .filter((item) => item.ativo !== false && podeConsumir(item, perfil.perfil))
    .sort((primeiroRegistro, segundoRegistro) =>
      modo === 'avaliacao'
        ? segundoRegistro.data.localeCompare(primeiroRegistro.data)
        : primeiroRegistro.data.localeCompare(segundoRegistro.data),
    );
  const refeicao = identificador
    ? escolhida.dados
    : modo === 'avaliacao'
      ? refeicoes.find((refeicaoDaLista) => !erroAvaliacao(refeicaoDaLista, agora)) ||
        refeicoes[0] ||
        null
      : refeicoes.find(
          (refeicaoDaLista) =>
            !erroConfirmacao(refeicaoDaLista, turnosDoPerfil(perfil.perfil), agora),
        ) || null;
  return {
    perfil: perfil.perfil,
    refeicao,
    refeicoes,
    carregando: perfil.carregando || escolhida.carregando || lista.carregando,
    erro: perfil.erro || escolhida.erro || lista.erro,
    tentarNovamente: () => {
      perfil.tentarNovamente();
      escolhida.tentarNovamente();
      lista.tentarNovamente();
    },
  };
}
