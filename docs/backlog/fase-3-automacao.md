# Fase 3 — Automação: Fila de retorno do dia

Objetivo: **nenhuma proposta esquecida.** Todo dia, cada vendedor sabe quem precisa receber retorno, em que ordem e por quê.

Referências: [ADR-003](../decisoes/ADR-003-automacao-escolhida.md), [ADR-002](../decisoes/ADR-002-precisa-de-atencao.md) (inclui os casos de borda), [premissas](../decisoes/premissas.md).

## Conceito: atenção × fila do dia

- **Precisa de atenção** (ADR-002) é um **estado** da oportunidade. Aparece no Kanban enquanto a causa existir.
- **Fila de retorno do dia** é a **lista de tarefas** do vendedor para a data de referência.

Decidimos que, ao registrar contato, a oportunidade **sai da fila do dia**, mesmo que ainda tenha outro alerta (por exemplo, proposta vencida). Ela volta na fila do dia seguinte se ainda precisar de atenção. Justificativa: o vendedor já deu retorno hoje. Cobrar de novo no mesmo dia é ruído e faz a pessoa ignorar a fila.

## Épico E5 — Fila de retorno do dia

### H5.1 Gerar a fila do dia (Must)

*Como vendedor, quero receber todo dia a lista de quem preciso retornar, para não esquecer nenhuma proposta.*

- **Dado** a data de referência, **quando** a rotina roda, **então** cada vendedor recebe uma fila com as oportunidades não finais que precisam de atenção, exceto as que tiveram contato registrado nessa data.
- A ordem segue a regra de maior prioridade de cada oportunidade: A3 → A1 → A4 → A2.
- Empate na mesma regra: maior valor estimado primeiro. Persistindo o empate: código em ordem crescente.
- **Quando** a rotina roda duas vezes para a mesma data, **então** o resultado é o mesmo e não há itens duplicados.
- A rotina roda automaticamente uma vez por dia e também pode ser **disparada manualmente** (necessário para a demonstração).
- **Dado** o seed (hoje = 15/10/2026), **então** a fila é: Ana → OPP-2003. Bruno → OPP-2002. Carla → OPP-2004.

### H5.2 Ver minha fila no CRM (Must)

*Como vendedor, quero ver minha fila do dia dentro do CRM, para começar o dia pelo que é mais urgente.*

- Há uma visão "Retornos de hoje" com seletor de vendedor (não há login nesta versão).
- Cada item mostra posição, código, empresa, valor, todos os motivos e a ação "Registrar contato".
- Clicar no item abre o detalhe da oportunidade (H4.6).
- **Dado** um vendedor sem pendências, **então** vejo "Nenhum retorno pendente hoje".
- **Dado** que a fila da data ainda não foi gerada, **então** vejo "A fila de hoje ainda não foi gerada" e o botão "Gerar fila de hoje" (o disparo manual da H5.1). Isso é diferente de "fila vazia" e não é erro.
- Estados de carregamento e erro seguem o padrão da H4.7.

### H5.3 Dar baixa no retorno (Must)

*Como vendedor, quero que o item saia da minha fila quando eu der retorno, para ver só o que falta.*

- **Dado** a OPP-2002 na fila do Bruno, **quando** ele registra contato, **então** ela sai da fila de hoje e, no Kanban, o alerta A2 some e o A1 (proposta vencida) continua.
- **Dado** uma oportunidade movida para Fechamento ou Perdida, **então** ela sai da fila.
- **Dado** uma oportunidade cuja causa foi resolvida (por exemplo, validade renovada e contato em dia), **então** ela sai da fila.
- **Dado** o dia seguinte, **quando** a rotina roda, **então** a OPP-2002 volta para a fila se ainda tiver a proposta vencida.

### H5.4 Resumo do dia simulado (Should)

*Como vendedor, quero receber um resumo dos retornos do dia, para saber o tamanho do meu dia antes de abrir o quadro.*

- Para cada vendedor com pelo menos 1 item, a rotina gera um texto de resumo: quantidade de retornos e a lista ordenada com **todos os motivos** de cada oportunidade (como no exemplo).
- O envio é **simulado**: o texto fica registrado e consultável. Nenhum e-mail ou mensagem real é enviado.
- Vendedor sem pendências não recebe resumo.
- A fila é a lista gerada pela rotina: uma oportunidade que passa a precisar de atenção depois da execução entra na próxima rodada (ou ao clicar em "Gerar fila de hoje"). Quem resolve (contato, estado final, causa resolvida) sai na hora.

Exemplo ilustrativo para Bruno:

```text
Bom dia, Bruno! Você tem 1 retorno hoje (15/10/2026):
1. OPP-2002 · Construtora Horizonte · R$ 9.800 — Proposta vencida há 2 dias; 9 dias sem contato
```

### H5.5 Histórico de execuções (Could)

Registro de quando a rotina rodou, para qual data e quantos itens gerou por vendedor.

## Fora de escopo (Won't)

- E-mail, WhatsApp ou notificação real.
- Agendar o "próximo retorno" com data prometida ao cliente (boa evolução, registrada no README).
- Escalonar para o gestor quando o vendedor não dá retorno.
- Redistribuir oportunidades entre vendedores.

## Regras críticas que precisam de testes

Todos os testes usam **data de referência fixa**, nunca a data real do sistema.

| # | Regra | Casos mínimos |
| --- | --- | --- |
| T1 | Prioridade | A3 antes de A1, A1 antes de A4, A4 antes de A2 |
| T2 | Desempate | Mesma regra: maior valor primeiro. Mesmo valor: código crescente |
| T3 | Vários motivos | A oportunidade entra uma vez só, na posição do seu motivo mais prioritário, e lista todos os motivos |
| T4 | Estados finais | Fechamento e Perdida nunca entram na fila |
| T5 | Idempotência | Rodar duas vezes na mesma data gera o mesmo resultado, sem duplicar |
| T6 | Baixa por contato | Contato registrado na data sai da fila do dia. No dia seguinte volta se ainda precisar de atenção |
| T7 | Bordas de A2 | 5 dias sem contato: não dispara. 6 dias: dispara |
| T8 | Bordas de A3 | 8 dias até o evento: não dispara. 7 dias: dispara. Evento já passou (etapa não final): dispara |
| T9 | Bordas de A1 | Validade igual a hoje: não está vencida. Validade ontem: vencida há 1 dia |
| T10 | Campos em branco | Sem validade: A1 e A4 não se aplicam. Sem evento: A3 e A4 não se aplicam. Sem último contato: A2 não se aplica |
| T11 | Fila vazia | Vendedor sem pendências: fila vazia e nenhum resumo |
| T12 | Seed | Resultado exato: Ana → OPP-2003, Bruno → OPP-2002, Carla → OPP-2004 |

---

## Handoff — Para o QA/Automação (com apoio do Backend)

**Construir:** H5.1, H5.3 e H5.4 (rotina, baixa e resumo), integradas à API do CRM.

**Regras:**

- Reaproveitar o cálculo de atenção da Fase 1. **Não** criar um segundo cálculo.
- Prioridade, desempate e baixa conforme este documento.
- Data de referência configurável e injetável nos testes.
- Envio sempre simulado.

**Necessidades (o como é decisão técnica):**

- Disparo automático diário e disparo manual.
- Execução idempotente por data.
- Resultado da fila consultável pela API, por vendedor.

**Pronto quando:**

- Os testes T1–T12 existem e passam.
- A fila do seed bate com a H5.1.
- O README explica como rodar a rotina manualmente e como rodar os testes.

**Não fazer:**

- Integrar e-mail ou mensageria real.
- Duplicar regra de atenção.
- Usar a data real do sistema nos testes.
- Implementar os outros 3 problemas.

## Handoff — Para o Frontend

**Construir:** H5.2.

**Regras:** visão "Retornos de hoje" com seletor de vendedor. Cada item mostra todos os motivos e a ação "Registrar contato". A ordem vem da API (o front não reordena). Estados vazio, carregando e erro no padrão da H4.7.

**Não fazer:** recalcular prioridade ou atenção no front, criar login.

---

## Os 3 problemas não implementados (para o README)

### Problema 1 — Lead esperando o primeiro contato (SLA)

- **Solução:** todo lead novo tem um prazo para o primeiro contato. Perto de estourar, o vendedor é avisado. Se estourar, o gestor é avisado.
- **Ideia de implementação:** registrar quando o lead entrou e quando houve o primeiro contato. Uma nova regra de atenção ("lead sem contato há X horas", em horário comercial) entra no mesmo motor da Fila de retorno, com prioridade máxima. A rotina passa a rodar em intervalos curtos. O valor do SLA é premissa a validar com o negócio.
- **Por que não agora:** o case foca no follow-up, e o mecanismo da Fila já é a base para essa evolução.

### Problema 2 — Enriquecer informações da empresa do lead

- **Solução:** ao informar o CNPJ, o CRM completa sozinho razão social, porte, atividade principal e endereço.
- **Ideia de implementação:** consulta assíncrona a uma fonte pública de dados de CNPJ, isolada atrás de uma interface própria (para trocar o fornecedor sem mexer no CRM), com cache, tolerância a falha e preenchimento manual como alternativa. Testes com fornecedor simulado.
- **Por que não agora:** depende de serviço externo, o que torna a validação e a demonstração frágeis. Também agrega pouco ao follow-up.

### Problema 3 — Informações do roteiro da ligação acessíveis

- **Solução:** o que o vendedor descobre na ligação (ocasião, data do evento, quantidade, orçamento, quem decide, logo) vira dado estruturado na oportunidade, e não anotação perdida.
- **Ideia de implementação:** primeira etapa, um roteiro em formulário dentro do detalhe da oportunidade, que preenche os campos estruturados. Segunda etapa, transcrição da ligação com extração automática por IA e **revisão humana** antes de salvar.
- **Por que não agora:** maior esforço, e a parte de maior valor (IA sobre áudio) depende de serviços externos e de cuidados com privacidade (LGPD).
