import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Botao, ui } from './Interface';
export default function ListaPaginada({
  itens,
  renderItem,
  chave = '',
  tamanho = 5,
  prefixo = 'lista',
}) {
  const [pagina, setPagina] = useState(1);
  useEffect(() => setPagina(1), [chave]);
  const paginas = Math.max(1, Math.ceil(itens.length / tamanho));
  const atual = Math.min(pagina, paginas);
  useEffect(() => {
    if (pagina > paginas) setPagina(paginas);
  }, [pagina, paginas]);
  const inicio = (atual - 1) * tamanho;
  const controles = (
    <View style={estilosLocais.grupo}>
      <Text
        accessibilityLiveRegion="polite"
        style={ui.pequeno}
      >{`${itens.length ? `${inicio + 1}–${Math.min(inicio + tamanho, itens.length)} de ${itens.length}` : 'Nenhum resultado'} · Página ${atual} de ${paginas}`}</Text>
      {paginas > 1 ? (
        <View style={ui.linha}>
          <Botao
            secundario
            testID={`${prefixo}-anterior`}
            disabled={atual === 1}
            onPress={() => setPagina(atual - 1)}
          >
            Anterior
          </Botao>
          <Botao
            secundario
            testID={`${prefixo}-seguinte`}
            disabled={atual === paginas}
            onPress={() => setPagina(atual + 1)}
          >
            Próxima
          </Botao>
        </View>
      ) : null}
    </View>
  );
  return (
    <View style={estilosLocais.grupo2}>
      {controles}
      {itens.slice(inicio, inicio + tamanho).map(renderItem)}
      {paginas > 1 ? controles : null}
    </View>
  );
}
const estilosLocais = StyleSheet.create({
  grupo: {
    gap: 12,
  },
  grupo2: {
    gap: 14,
  },
});
