# ADR-003 — Automação escolhida: Fila de retorno do dia

**Status:** Aceito. O detalhamento das histórias fica na Fase 3 do backlog.

## Contexto

O case pede 1 dos 4 problemas implementado, integrado ao CRM e com testes das regras críticas. Os outros 3 são apenas descritos no README.

## Opções consideradas

| Problema | Valor | Aderência ao follow-up | Testável sem serviço externo | Esforço |
| --- | --- | --- | --- | --- |
| 1. Lead esperando o primeiro contato (SLA) | Alto | Média | Sim | Baixo |
| 2. Enriquecer dados da empresa | Médio | Baixa | Não (depende de API externa) | Médio |
| 3. Informações do roteiro da ligação | Médio | Média | Parcial | Alto |
| **4. Vendedor esquecendo de dar retorno** | **Alto** | **Total** | **Sim** | **Baixo** |

## Decisão

Implementar o **problema 4** como "Fila de retorno do dia":

- uma rotina diária, que também pode ser disparada manualmente, gera para cada vendedor a lista de oportunidades que precisam de retorno;
- prioridade: A3 evento próximo → A1 proposta vencida → A4 datas incoerentes → A2 sem contato;
- dentro da mesma regra, a de **maior valor estimado** vem primeiro (depois, código crescente);
- o item sai da fila **do dia** quando o vendedor registra um contato, mesmo que ainda haja outro alerta, ou quando a causa é resolvida. Volta no dia seguinte se ainda precisar de atenção;
- o envio do resumo ao vendedor é **simulado** (o texto gerado fica registrado), sem e-mail real.

### Resultado esperado com os dados do case (hoje = 15/10/2026)

| Vendedor | Fila do dia |
| --- | --- |
| Ana | OPP-2003 (evento em 3 dias) |
| Bruno | OPP-2002 (vencida há 2 dias, 9 dias sem contato) |
| Carla | OPP-2004 (vencida há 5 dias, 13 dias sem contato) |

## Justificativa

Ataca a dor central do case ("proposta esquecida = venda perdida"), usa regras puras de data e etapa (fáceis de testar) e reaproveita a regra do ADR-002 em vez de criar outra.

## Consequências

- Exige a ação "registrar contato" no CRM.
- Os problemas 1, 2 e 3 ficam descritos no README. O problema 1 é a evolução natural, pois usa o mesmo mecanismo.
