import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { auth } from '../services/backend';

export default function useRetornoInicio(navegacao) {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let anterior = AppState.currentState;
    const assinatura = AppState.addEventListener('change', atual => {
      const voltou = anterior === 'background' && atual === 'active';
      anterior = atual;
      if (!voltou || !auth.currentUser?.emailVerified || !navegacao.isReady()) return;
      const estado = navegacao.getRootState();
      const rota = estado?.routes?.[estado.index ?? 0]?.name;
      // Fluxos públicos, verificação de e-mail e cadastro mantêm sua etapa.
      if (!['HomeAluno', 'HomeAdmin', 'Confirmacao', 'Feedback'].includes(rota)) return;
      const admin = rota === 'HomeAdmin';
      navegacao.resetRoot({ index: 0, routes: [{
        name: admin ? 'HomeAdmin' : 'HomeAluno',
        state: { index: 0, routes: [{ name: admin ? 'DashboardAdmin' : 'InicioAluno' }] },
      }] });
    });
    return () => assinatura.remove();
  }, [navegacao]);
}