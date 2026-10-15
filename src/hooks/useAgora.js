import { useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { agoraAplicativo } from '../services/relogio';
export function useAgora() {
  const [agora, setAgora] = useState(agoraAplicativo);
  const focada = useIsFocused();
  useEffect(() => {
    if (!focada) return;
    setAgora(agoraAplicativo());
    const timer = setInterval(() => setAgora(agoraAplicativo()), 1000);
    return () => clearInterval(timer);
  }, [focada]);
  return agora;
}
