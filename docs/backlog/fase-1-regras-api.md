# Fase 1 — Regras de negócio + API

Referências: [ADR-001](../decisoes/ADR-001-transicoes-de-etapa.md), [ADR-002](../decisoes/ADR-002-precisa-de-atencao.md), [ADR-004](../decisoes/ADR-004-itens-por-oportunidade.md), [premissas](../decisoes/premissas.md).

## Épico E1 — Funil e regras

### H1.1 Mover de etapa (Must)

*Como vendedor, quero mover uma oportunidade de etapa para refletir o andamento da negociação.*

- **Dado** uma oportunidade em Follow-up, **quando** movo para Forecast, **então** a etapa muda e o histórico registra quando, de onde e para onde.
- **Dado** uma oportunidade em Primeiro Contato sem valor estimado ou sem itens, **quando** movo para Apresentação de Orçamento, **então** a API recusa e informa o que falta.
- **Dado** uma oportunidade em Follow-up, **quando** movo para Fechamento, **então** a API recusa ("Fechamento só pode ser aplicado a partir de Forecast.").
- **Dado** uma oportunidade em estado final, **quando** tento movê-la, **então** a API recusa.
- **Dado** qualquer transição fora da matriz do ADR-001, **então** a API recusa com mensagem clara.
- **Dado** que a gravação do histórico falha, **então** a etapa não muda (as duas coisas acontecem juntas ou nenhuma acontece).

### H1.2 Marcar como perdida (Must)

*Como vendedor, quero marcar uma venda como perdida informando o motivo, para a empresa entender por que perde vendas.*

- **Dado** uma etapa não final, **quando** marco como Perdida com motivo da lista, **então** é aceito e o motivo fica no histórico.
- **Quando** não informo motivo, **então** a API recusa.
- **Quando** escolho "Outro" sem texto, **então** a API recusa.

### H1.3 Consultar histórico (Must)

*Como vendedor, quero ver o histórico da oportunidade para entender o caminho da negociação.*

- **Dado** uma oportunidade, **quando** consulto o detalhe, **então** vejo as mudanças em ordem cronológica, com data, origem, destino e motivo (se houver).

## Épico E2 — Consulta e atenção

### H2.1 Listar, buscar e filtrar (Must)

*Como vendedor, quero buscar e filtrar oportunidades para achar rápido a que preciso trabalhar.*

- Busca por código ou empresa. Filtros por vendedor, etapa e "precisa de atenção", combináveis.
- Busca sem resultado retorna lista vazia, não erro.

### H2.2 Calcular "precisa de atenção" (Must)

*Como vendedor, quero ver o motivo do alerta para saber o que fazer.*

- Cada oportunidade retorna o indicador de atenção e a lista de motivos (A1–A4).
- Com os dados do case, o resultado bate exatamente com a tabela do ADR-002.

### H2.3 Registrar contato (Must)

*Como vendedor, quero registrar que falei com o cliente para o sistema parar de me alertar à toa.*

- **Dado** uma oportunidade não final, **quando** registro contato, **então** o último contato passa a ser a data de referência e o alerta A2 some.
- **Dado** uma oportunidade em estado final, **então** a API recusa.

### H2.4 Editar dados comerciais (Should)

*Como vendedor, quero ajustar valor, itens, validade e evento para manter a proposta atualizada.*

- A partir de Apresentação de Orçamento, a oportunidade precisa manter **valor estimado e pelo menos 1 item**. Uma edição que remova qualquer um dos dois é recusada (é a mesma exigência de entrada na etapa, que continua valendo depois).
- Oportunidade em estado final não pode ser editada.
- Datas incoerentes geram alerta (A4), mas não bloqueiam a edição.

### H2.5 Criar oportunidade (Could)

O case não exige. Só entra se sobrar tempo.

## Épico E3 — Dados e base

### H3.1 Seed com os 7 casos (Must)

- Carrega exatamente a tabela do case, aplicando as decisões D1 e D2 de [premissas.md](../decisoes/premissas.md).

### H3.2 Data de referência configurável (Must)

- Padrão de demonstração: 15/10/2026, para os alertas baterem com a documentação.

### H3.3 Segurança básica (Must)

- Nenhuma credencial no repositório (configuração por ambiente, com arquivo de exemplo).
- Toda entrada validada. Erros em formato único.

## Fora de escopo (Won't)

Autenticação (descrita no README), reabrir estado final, preço por item, autor da mudança no histórico (depende de autenticação).

---

## Handoff — Para o Tech Lead e o Backend

**Construir:** H1.1–H1.3, H2.1–H2.4, H3.1–H3.3.

**Regras (o backend é a fonte única):**

- Matriz de transições do ADR-001.
- Apresentação de Orçamento exige valor estimado e pelo menos 1 item.
- Perdida exige motivo da lista ("Outro" exige texto).
- Atenção A1–A4 e parâmetros configuráveis (5 dias, 7 dias, data de referência).

**Necessidades (o como é decisão técnica):**

- Mudança de etapa e histórico atômicos.
- Cálculo de atenção num lugar só, servindo API, Kanban e automação.
- Toda recusa diz qual regra foi violada. Exemplo ilustrativo:

```json
{
  "error": "TRANSICAO_INVALIDA",
  "message": "Fechamento só pode ser aplicado a partir de Forecast.",
  "details": { "from": "FOLLOW_UP", "to": "FECHAMENTO" }
}
```

**Pronto quando:**

- Há testes de cada célula ✅/❌ da matriz.
- Há testes das regras A1–A4.
- Os 7 casos do seed batem com a tabela do ADR-002.

**Não fazer:**

- Autenticação.
- Regra só no front.
- Bloquear o seed pelo dado legado.
- Usar a data real do sistema na demonstração.
- Funcionalidades fora deste backlog.
