import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { agoraAplicativo, estaEmDemo, observarRelogio } from '../services/demo';
export function useAgora() {
  const [agora, setAgora] = useState(agoraAplicativo);
  const focada = useIsFocused();
  useEffect(() => {
    if (!focada) return;
    setAgora(agoraAplicativo());
    if (estaEmDemo()) return observarRelogio(() => setAgora(agoraAplicativo()));
    const timer = setInterval(() => setAgora(agoraAplicativo()), 1000);
    return () => clearInterval(timer);
  }, [focada]);
  return agora;
}
