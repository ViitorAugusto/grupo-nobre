# Contrato da API — CRM Nobre Brindes

Dono: Tech Lead. Implementa: Back-end. Consomem: Front-end e QA. Mudança neste contrato = combinar com o Tech Lead antes. Regras de negócio: ADRs em [docs/decisoes](../decisoes/README.md) (em conflito, o ADR vence).

- **Base:** `http://localhost:3333/api/v1`
- **Documentação interativa (gerada do código):** `http://localhost:3333/api/v1/docs` (Swagger)
- **Formato:** JSON, UTF-8. Campos em `camelCase` (inglês). Valores de enum e códigos de erro em português, `MAIÚSCULAS_COM_UNDERSCORE`. Mensagens para o usuário em português.
- **Sem autenticação** nesta versão (Won't da Fase 1). Limite de 100 requisições por minuto por IP.

## Convenções

| Tipo | Formato | Exemplo |
| --- | --- | --- |
| Data de negócio (validade, evento, último contato, data de referência) | `AAAA-MM-DD`, sem hora nem fuso | `"2026-10-15"` |
| Instante (quando a mudança aconteceu) | ISO 8601 em UTC | `"2026-10-20T18:45:00.000Z"` |
| Dinheiro | `number` em reais, até 2 casas | `9800` |
| Identificador | UUID | `"5b0c…"` |
| Campo em branco | `null` (nunca omitido) | `"proposalValidUntil": null` |

- **"Hoje" = data de referência** (`REFERENCE_DATE`, padrão `2026-10-15`). Todo cálculo de dias usa essa data, nunca o relógio do servidor. `changedAt` do histórico é o instante real da gravação (auditoria).
- Listas vêm em `{ "data": [...] }`. Sem paginação nesta versão (volume do case: 7 oportunidades).

## Enums

### `Stage`

| Valor | Rótulo | Ordem | Final |
| --- | --- | :---: | :---: |
| `PRIMEIRO_CONTATO` | Primeiro Contato | 1 | não |
| `APRESENTACAO_ORCAMENTO` | Apresentação de Orçamento | 2 | não |
| `FOLLOW_UP` | Follow-up | 3 | não |
| `FORECAST` | Forecast | 4 | não |
| `FECHAMENTO` | Fechamento | 5 | sim |
| `PERDIDA` | Perdida | 6 | sim |

### `LossReason`

| Valor | Rótulo | Exige texto | Aceito na entrada |
| --- | --- | :---: | :---: |
| `PRECO` | Preço | não | sim |
| `PRAZO` | Prazo | não | sim |
| `CONCORRENCIA` | Concorrência | não | sim |
| `CLIENTE_DESISTIU` | Cliente desistiu | não | sim |
| `SEM_RESPOSTA` | Sem resposta | não | sim |
| `OUTRO` | Outro | **sim** | sim |
| `NAO_REGISTRADO` | Não registrado (dado legado) | não | **não** (só o seed, decisão D2) |

### `AttentionReason` (ADR-002)

| `rule` | `code` | `message` | `days` |
| --- | --- | --- | --- |
| `A3` | `EVENTO_PROXIMO` | `"Evento em X dias"`, `"Evento amanhã"`, `"Evento hoje"` ou `"Evento já passou há X dias"` | dias até o evento (negativo se passou) |
| `A1` | `PROPOSTA_VENCIDA` | `"Proposta vencida há X dias"` | dias desde o vencimento |
| `A4` | `VALIDADE_APOS_EVENTO` | `"Validade após o evento"` | `null` |
| `A2` | `SEM_CONTATO` | `"X dias sem contato"` | dias sem contato |

- `reasons` vem **ordenado por prioridade** (A3 → A1 → A4 → A2, a mesma da fila). `reasons[0]` é o motivo principal do card.
- Singular quando X = 1 em **todas** as mensagens: "Proposta vencida há 1 dia", "1 dia sem contato", "Evento já passou há 1 dia". A3 usa "Evento hoje" (0) e "Evento amanhã" (1) (ADR-002). Nos dados do seed só aparecem os plurais.
- Etapas finais: `needsAttention: false` e `reasons: []`, sempre.

## Recursos

### `Opportunity` (resumo, usado na lista)

```json
{
  "id": "0f8c7f0e-…",
  "code": "OPP-2002",
  "company": "Construtora Horizonte",
  "seller": { "id": "a1b2…", "name": "Bruno" },
  "stage": "APRESENTACAO_ORCAMENTO",
  "isFinal": false,
  "estimatedValue": 9800,
  "items": [{ "id": "c3d4…", "product": "Kit escritório", "quantity": 120 }],
  "lastContactDate": "2026-10-06",
  "proposalValidUntil": "2026-10-13",
  "eventDate": "2026-10-25",
  "daysWithoutContact": 9,
  "lossReason": null,
  "lossReasonText": null,
  "attention": {
    "needsAttention": true,
    "reasons": [
      { "rule": "A1", "code": "PROPOSTA_VENCIDA", "message": "Proposta vencida há 2 dias", "days": 2 },
      { "rule": "A2", "code": "SEM_CONTATO", "message": "9 dias sem contato", "days": 9 }
    ]
  },
  "allowedTransitions": ["FOLLOW_UP", "PERDIDA"]
}
```

- `daysWithoutContact`: dias entre `lastContactDate` e hoje (`null` se não houver contato). Mostrado no card mesmo sem alerta.
- `allowedTransitions`: destinos da matriz do ADR-001 a partir da etapa atual (vazio em etapa final). **Não** considera os requisitos (valor, itens, motivo): esses são checados no movimento e a recusa explica o que falta. Gerado pela mesma tabela que valida o movimento.

### `OpportunityDetail` (detalhe e resposta de toda escrita)

`Opportunity` + histórico:

```json
{
  "...": "todos os campos de Opportunity",
  "history": [
    {
      "id": "e5f6…",
      "fromStage": "FORECAST",
      "toStage": "FECHAMENTO",
      "lossReason": null,
      "lossReasonText": null,
      "changedAt": "2026-10-20T18:45:00.000Z"
    }
  ]
}
```

- `history` em ordem cronológica crescente. O seed **não** cria histórico (o case não traz histórico de etapas; não inventamos). A lista começa vazia e cresce com cada mudança real.

## Endpoints — Fase 1

| Método | Caminho | História | Sucesso |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `200 { "status": "ok" }` · `503` sem banco |
| `GET` | `/meta` | H3.2, H4.x | `200` |
| `GET` | `/sellers` | H2.1, H5.2 | `200 { data: Seller[] }` |
| `GET` | `/opportunities` | H2.1, H2.2 | `200 { data: Opportunity[] }` |
| `GET` | `/opportunities/:id` | H1.3, H4.6 | `200 OpportunityDetail` |
| `POST` | `/opportunities/:id/stage-changes` | H1.1, H1.2 | `200 OpportunityDetail` |
| `POST` | `/opportunities/:id/contacts` | H2.3 | `200 OpportunityDetail` |
| `PATCH` | `/opportunities/:id` | H2.4 (Should) | `200 OpportunityDetail` |

### `GET /meta`

Tudo o que o front precisa exibir sem copiar regra.

```json
{
  "referenceDate": "2026-10-15",
  "parameters": { "noContactDays": 5, "eventWindowDays": 7 },
  "stages": [{ "code": "PRIMEIRO_CONTATO", "label": "Primeiro Contato", "order": 1, "isFinal": false }],
  "lossReasons": [{ "code": "PRECO", "label": "Preço", "requiresText": false }]
}
```

`lossReasons` traz só os aceitos na entrada (sem `NAO_REGISTRADO`). O rótulo do legado está na tabela acima.

### `GET /sellers`

```json
{ "data": [{ "id": "…", "name": "Ana" }, { "id": "…", "name": "Bruno" }, { "id": "…", "name": "Carla" }] }
```

Ordem alfabética.

### `GET /opportunities`

| Query | Tipo | Efeito |
| --- | --- | --- |
| `search` | texto (1–100) | Contém, sem diferenciar maiúsculas nem acentos, no `code` **ou** na `company` |
| `sellerId` | UUID | Só desse vendedor |
| `stage` | `Stage` | Só dessa etapa |
| `needsAttention` | `true` \| `false` | Filtra pelo indicador calculado |

- Filtros combinam com **E**. Sem resultado = `200 { "data": [] }`, nunca erro. Isso vale também para `sellerId` com UUID válido de vendedor inexistente (é filtro, não recurso). UUID malformado → `400`.
- **Ordem (definida pela API, o front não reordena):** ordem da etapa → `needsAttention` primeiro → `eventDate` mais próximo (nulos por último) → `code` crescente (ADR-005).
- Exemplo do critério da Fase 2: `?sellerId=<Carla>&needsAttention=true` → só `OPP-2004`.

### `POST /opportunities/:id/stage-changes`

Move de etapa, inclusive para Perdida.

```json
{ "toStage": "PERDIDA", "lossReason": "OUTRO", "lossReasonText": "Cliente fechou com fornecedor interno" }
```

| Campo | Regra de formato (400 se violar) |
| --- | --- |
| `toStage` | obrigatório, `Stage` |
| `lossReason` | opcional, `LossReason` aceito na entrada. Só permitido com `toStage = PERDIDA` (enviado com outro destino → `400 VALIDACAO_INVALIDA`) |
| `lossReasonText` | opcional, texto 1–500 após `trim`. Só permitido com `toStage = PERDIDA` |

**Ordem de validação** (a primeira falha responde):

1. Oportunidade existe → senão `404 NAO_ENCONTRADO`.
2. Etapa atual não é final → senão `422 ESTADO_FINAL`.
3. `toStage` igual à atual → `200` sem mudança e **sem** histórico.
4. Transição está na matriz do ADR-001 → senão `422 TRANSICAO_INVALIDA`.
5. Destino `APRESENTACAO_ORCAMENTO`: valor estimado e ≥ 1 item → senão `422 REQUISITOS_ORCAMENTO`.
6. Destino `PERDIDA`: `lossReason` presente → senão `422 MOTIVO_PERDA_OBRIGATORIO`; `OUTRO` com texto → senão `422 MOTIVO_PERDA_TEXTO_OBRIGATORIO`.
7. Grava etapa (+ motivo, se Perdida) **e** histórico na **mesma transação**. Se o histórico falhar, nada muda. A gravação só acontece se a etapa no banco ainda for a lida no passo 2; se outra requisição mudou a etapa nesse meio-tempo → `409 ETAPA_ALTERADA` (nada é gravado).

### `POST /opportunities/:id/contacts`

Sem corpo. Registra contato na data de referência: `lastContactDate = referenceDate`. A2 some; os outros alertas continuam. Repetir no mesmo dia não muda nada (idempotente). Etapa final → `422 ESTADO_FINAL`.

### `PATCH /opportunities/:id` (Should)

Todos os campos opcionais; só os enviados mudam.

```json
{
  "estimatedValue": 10500,
  "proposalValidUntil": "2026-10-30",
  "eventDate": null,
  "items": [{ "product": "Kit escritório", "quantity": 150 }]
}
```

| Campo | Formato (400 se violar) |
| --- | --- |
| `estimatedValue` | `number > 0` e ≤ 9.999.999.999,99, até 2 casas, ou `null` |
| `proposalValidUntil`, `eventDate` | `AAAA-MM-DD` ou `null` |
| `items` | substitui a lista inteira; cada item `product` (texto 1–120) e `quantity` (inteiro de 1 a 2.147.483.647); máx. 50 itens |

- Etapa final → `422 ESTADO_FINAL`.
- Etapa a partir de Apresentação de Orçamento (não final) e o resultado ficaria sem valor estimado (`estimatedValue: null`) e/ou sem itens (`items: []`) → `422 REQUISITOS_ORCAMENTO` com `details.missing` (mesmo código e formato da entrada na etapa). Em Primeiro Contato, limpar valor ou itens é permitido.
- Datas incoerentes (validade após o evento) **não** bloqueiam: viram alerta A4.

## Erros

Formato único em **toda** resposta de erro. Nunca há stack trace, SQL ou nome de tabela.

```json
{
  "statusCode": 422,
  "error": "TRANSICAO_INVALIDA",
  "message": "Fechamento só pode ser aplicado a partir de Forecast.",
  "details": { "from": "FOLLOW_UP", "to": "FECHAMENTO" }
}
```

| Status | `error` | Quando | `details` |
| --- | --- | --- | --- |
| 400 | `VALIDACAO_INVALIDA` | Formato inválido, campo desconhecido, enum inexistente | `[{ "field": "toStage", "message": "…" }]` |
| 404 | `NAO_ENCONTRADO` | Oportunidade, vendedor ou rota inexistente | — |
| 422 | `ESTADO_FINAL` | Qualquer escrita em Fechamento/Perdida | `{ "stage" }` |
| 422 | `TRANSICAO_INVALIDA` | Fora da matriz do ADR-001 | `{ "from", "to" }` |
| 422 | `REQUISITOS_ORCAMENTO` | Entrar em Apres. Orçamento sem valor e/ou sem item, **ou** PATCH que deixaria sem valor e/ou sem item uma oportunidade a partir de Apres. Orçamento | `{ "missing": ["estimatedValue", "items"] }` (só os que faltam) |
| 422 | `MOTIVO_PERDA_OBRIGATORIO` | Perdida sem motivo | — |
| 422 | `MOTIVO_PERDA_TEXTO_OBRIGATORIO` | "Outro" sem texto | — |
| 409 | `ETAPA_ALTERADA` | A etapa mudou entre a leitura e a gravação (requisições simultâneas) | `{ "expected", "current" }` |
| 429 | `LIMITE_DE_REQUISICOES` | Mais de 100 req/min | — |
| 500 | `ERRO_INTERNO` | Falha inesperada (detalhe só no log) | — |

### Mensagens (o vendedor lê; dizem qual regra foi violada)

| Caso | `message` |
| --- | --- |
| Para Fechamento fora de Forecast | "Fechamento só pode ser aplicado a partir de Forecast." |
| Pulo para frente | "Avance uma etapa por vez: de {origem} o próximo passo é {próxima etapa}." |
| Retorno não permitido | "Não é possível voltar de {origem} para {destino}." |
| Estado final | "Oportunidade em {etapa} é um estado final e não pode ser alterada." |
| Requisitos de orçamento | "Para ir para Apresentação de Orçamento, informe {o valor estimado / pelo menos 1 item / o valor estimado e pelo menos 1 item}." |
| Etapa alterada (409) | "Esta oportunidade foi alterada enquanto você a movia. Recarregue e tente de novo." |
| Sem motivo de perda | "Informe o motivo da perda." |
| "Outro" sem texto | "Descreva o motivo da perda ao escolher \"Outro\"." |
| Requisitos mantidos (PATCH) | "A partir de Apresentação de Orçamento a oportunidade precisa de valor estimado e pelo menos 1 item." |

## Resultado esperado com o seed (hoje = 2026-10-15)

Teste obrigatório (e2e) e base da demonstração. Dados: [dados-do-case.md](../referencias/dados-do-case.md) + D1/D2 de [premissas.md](../decisoes/premissas.md).

| Código | `stage` | `needsAttention` | `reasons` (em ordem) | `allowedTransitions` |
| --- | --- | :---: | --- | --- |
| OPP-2001 | `PRIMEIRO_CONTATO` | false | — | `APRESENTACAO_ORCAMENTO`, `PERDIDA` |
| OPP-2002 | `APRESENTACAO_ORCAMENTO` | true | A1 "Proposta vencida há 2 dias", A2 "9 dias sem contato" | `FOLLOW_UP`, `PERDIDA` |
| OPP-2003 | `FOLLOW_UP` | true | A3 "Evento em 3 dias", A4 "Validade após o evento" | `APRESENTACAO_ORCAMENTO`, `FORECAST`, `PERDIDA` |
| OPP-2004 | `FOLLOW_UP` | true | A1 "Proposta vencida há 5 dias", A2 "13 dias sem contato" | `APRESENTACAO_ORCAMENTO`, `FORECAST`, `PERDIDA` |
| OPP-2005 | `FORECAST` | false | — | `APRESENTACAO_ORCAMENTO`, `FOLLOW_UP`, `FECHAMENTO`, `PERDIDA` |
| OPP-2006 | `FECHAMENTO` | false | — | — |
| OPP-2007 | `PERDIDA` (`lossReason: NAO_REGISTRADO`) | false | — | — |

`allowedTransitions` segue a ordem das etapas.

---

## Endpoints — Fase 3

| Método | Caminho | História | Sucesso |
| --- | --- | --- | --- |
| `POST` | `/follow-up-queue/runs` | H5.1 (disparo manual) | `200 QueueRun` |
| `GET` | `/follow-up-queue?sellerId=&date=` | H5.2 | `200 SellerQueue` |
| `GET` | `/follow-up-queue/summaries?date=&sellerId=` | H5.4 | `200 { data: Summary[] }` |

- `date` opcional em todos; padrão = data de referência.
- `POST /follow-up-queue/runs` com `{ "date": "2026-10-15" }` (opcional). **Idempotente:** rodar de novo para a mesma data substitui o resultado, sem duplicar. A rotina diária (cron `FOLLOW_UP_QUEUE_CRON`) chama o mesmo caso de uso.

```json
// QueueRun
{ "date": "2026-10-15", "generatedAt": "2026-10-20T10:00:00.000Z",
  "sellers": [{ "seller": { "id": "…", "name": "Ana" }, "itemCount": 1 }] }

// SellerQueue
{ "date": "2026-10-15", "seller": { "id": "…", "name": "Bruno" },
  "generatedAt": "2026-10-20T10:00:00.000Z",
  "items": [{
    "position": 1,
    "opportunity": { "id": "…", "code": "OPP-2002", "company": "Construtora Horizonte", "estimatedValue": 9800 },
    "reasons": [ { "rule": "A1", "code": "PROPOSTA_VENCIDA", "message": "Proposta vencida há 2 dias", "days": 2 } ]
  }] }

// Summary (envio simulado)
{ "date": "2026-10-15", "seller": { "id": "…", "name": "Bruno" }, "text": "Bom dia, Bruno! …", "createdAt": "…" }
```

- Ordem: motivo mais prioritário (A3 → A1 → A4 → A2), depois maior `estimatedValue`, depois `code` crescente. Cada oportunidade aparece uma vez, com todos os motivos.
- `GET /follow-up-queue` reflete o estado atual: item com contato registrado na data, que foi para estado final ou cuja causa foi resolvida **não** aparece. `position` é recalculada sem buracos.
- A fila do dia é a **lista gerada pela rotina**: uma oportunidade que passa a precisar de atenção depois da execução só entra quando a rotina roda de novo (próximo dia, ou "Gerar fila de hoje", que regenera a data de forma idempotente).
- Desempate por valor: oportunidade sem valor estimado vai depois das que têm valor. No resumo, aparece como "valor não informado".
- `GET /follow-up-queue/summaries` com `sellerId` válido de vendedor inexistente → `200 { "data": [] }` (é filtro). `GET /follow-up-queue` com vendedor inexistente → `404` (é o recurso pedido).
- Vendedor sem pendências: `items: []` e nenhum resumo.
- `SellerQueue` traz `generatedAt` (instante em que a rotina rodou para a data). **Rotina ainda não rodou para a data:** `200` com `generatedAt: null` e `items: []`. Não é erro, mas também **não** é "sem pendências": o front mostra "A fila de hoje ainda não foi gerada" e a ação "Gerar fila de hoje" (`POST /follow-up-queue/runs`, idempotente). Vendedor inexistente → `404 NAO_ENCONTRADO`.
- Seed: Ana → OPP-2003 · Bruno → OPP-2002 · Carla → OPP-2004.
