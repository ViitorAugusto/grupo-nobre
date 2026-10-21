# ADR-001 — Matriz de transições de etapa

**Status:** Aceito

## Contexto

O case fixa três regras: Apresentação de Orçamento exige valor estimado e pelo menos 1 item, Fechamento só a partir de Forecast, e Perdida exige motivo. Ficam em aberto os retornos de etapa, os pulos e a reabertura de estados finais.

## Opções consideradas

1. Funil livre: qualquer etapa para qualquer etapa.
2. Só para frente, sem retornos.
3. Para frente uma etapa por vez, com retornos apenas onde refletem a negociação real.

## Decisão

Opção 3.

| De ↓ / Para → | Prim. Contato | Apres. Orçamento | Follow-up | Forecast | Fechamento | Perdida |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Primeiro Contato** | – | ✅ ¹ | ❌ | ❌ | ❌ | ✅ ² |
| **Apres. Orçamento** | ❌ | – | ✅ | ❌ | ❌ | ✅ ² |
| **Follow-up** | ❌ | ✅ ↩ revisão ¹ | – | ✅ | ❌ | ✅ ² |
| **Forecast** | ❌ | ✅ ↩ revisão ¹ | ✅ ↩ esfriou | – | ✅ | ✅ ² |
| **Fechamento** | ❌ | ❌ | ❌ | ❌ | – | ❌ |
| **Perdida** | ❌ | ❌ | ❌ | ❌ | ❌ | – |

¹ Exige valor estimado e pelo menos 1 item, em qualquer entrada em Apresentação de Orçamento, inclusive nos retornos.

² Exige motivo de perda, escolhido numa lista: Preço, Prazo, Concorrência, Cliente desistiu, Sem resposta, Outro. Se for "Outro", o texto livre é obrigatório.

Mover para a mesma etapa não faz nada e não gera histórico.

## Justificativa

- **Sem pulos para frente:** cada etapa representa um trabalho real. Pular esconde a falta de follow-up, que é justamente o problema do negócio.
- **Retornos só quando refletem a vida real:** o cliente pede revisão da proposta (volta para Apresentação de Orçamento) ou o Forecast esfria (volta para Follow-up). Voltar para Primeiro Contato depois de já existir proposta não faz sentido.
- **Estados finais não reabrem:** protege o histórico e as métricas. Se o cliente voltar, cria-se uma nova oportunidade.

## Consequências

- A venda rápida passa por todas as etapas: mais cliques, histórico fiel.
- O backend é a única autoridade da regra. O front pode mostrar os destinos válidos, mas não decide.
- Toda recusa informa **qual regra** foi violada.
- Reabrir oportunidade e "duplicar oportunidade encerrada" ficam como *Won't* nesta versão.
