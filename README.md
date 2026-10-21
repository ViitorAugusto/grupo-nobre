# CRM Nobre Brindes

CRM interno para a equipe comercial da **Nobre Brindes** (Grupo Nobre), que vende brindes personalizados para empresas (B2B consultivo). Case técnico para a vaga de Desenvolvedor(a) Full Stack Pleno.

**O problema:** na venda consultiva de brindes, o que decide a venda é o follow-up. Proposta esquecida é venda perdida.

**A pergunta que guiou o produto:** *o vendedor encontra rápido a negociação que precisa trabalhar hoje?*

**O que foi entregue:**

- **API REST** com as regras do funil validadas no backend e histórico de cada mudança de etapa.
- **Kanban** com busca, filtros e destaque de "precisa de atenção", sempre com o motivo.
- **Automação "Fila de retorno do dia":** todo dia, cada vendedor recebe a lista de quem precisa retornar, em ordem de urgência.

> **Data de referência:** os dados do case consideram "hoje" = **15/10/2026**. A demonstração usa essa data (configurável), para que os alertas batam com esta documentação independentemente do dia em que o projeto for executado.

---

## Sumário

1. [Como executar](#como-executar)
2. [Stack e arquitetura](#stack-e-arquitetura)
3. [Regras do funil](#regras-do-funil)
4. [Decisões de produto](#decisões-de-produto)
5. [Premissas](#premissas)
6. [Automação](#automação)
7. [Segurança](#segurança)
8. [Qualidade e padrões](#qualidade-e-padrões)
9. [Limitações e próximos passos](#limitações-e-próximos-passos)
10. [Uso de IA](#uso-de-ia)

---

## Como executar

**Pré-requisitos:** Node.js 22 (`.nvmrc`), npm 10 ou superior e Docker (só para o PostgreSQL).

```bash
npm ci          # instala os dois apps e ativa os git hooks
npm run setup   # cria apps/api/.env e apps/web/.env.local a partir dos .env.example
npm run demo    # sobe o PostgreSQL, aplica as migrações, carrega o seed e inicia API + web
```

| O quê                          | Endereço                                           |
| ------------------------------- | --------------------------------------------------- |
| CRM (Kanban)                    | http://localhost:3000                               |
| API                             | http://localhost:3333/api/v1                        |
| Documentação da API (Swagger) | http://localhost:3333/api/v1/docs                   |
| Contrato da API                 | [docs/api/contrato-api.md](docs/api/contrato-api.md) |

**Passo a passo (equivalente ao `npm run demo`):**

| Comando                | O que faz                                                                       |
| ---------------------- | ------------------------------------------------------------------------------- |
| `npm run db:up`      | PostgreSQL 17 em `localhost:5433` (Docker). Cria também o banco de testes    |
| `npm run db:migrate` | Aplica as migrações                                                           |
| `npm run db:seed`    | Recarrega os 7 casos do case (pode rodar de novo para voltar ao estado inicial) |
| `npm run dev`        | API (porta 3333) e web (porta 3000) com recarga automática                     |
| `npm run db:down`    | Para o banco                                                                    |

- [ ] **Ambiente:** só os arquivos `.env.example` estão no repositório. As credenciais do banco são de desenvolvimento local, as mesmas do `docker-compose.yml`. Portas 3333 e 5433 foram escolhidas para não colidir com serviços comuns (3000/3001/5432).
- [ ] **Data de referência:** `REFERENCE_DATE` em `apps/api/.env` (padrão `2026-10-15`). Reinicie a API depois de alterar. Os limites de 5 e 7 dias também são configuráveis ali (`ATTENTION_NO_CONTACT_DAYS`, `ATTENTION_EVENT_WINDOW_DAYS`).
- [ ] **Use `npm ci`, não `npm install`:** o `npm install` do npm 10 tem um bug ao resolver a árvore deste monorepo sem lockfile; o `npm ci` instala exatamente o `package-lock.json`.

**Testes:**

| Comando                                   | O que roda                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `npm test`                              | Unitários dos dois apps (regras de domínio, casos de uso, componentes). Não precisa de banco |
| `npm run test:e2e`                      | API real contra o banco de testes `crm_nobre_test` (precisa do `npm run db:up`)             |
| `npm run test:cov -w api`               | Cobertura do domínio e dos casos de uso                                                        |
| `npm run lint` · `npm run typecheck` | Lint (inclui checagem de tokens do design system) e tipos                                       |

**Fila de retorno do dia, disparo manual:** `curl -X POST http://localhost:3333/api/v1/follow-up-queue/runs` (ou pelo Swagger, ou pelo botão "Gerar fila de hoje" na tela "Retornos de hoje"). A rotina automática roda todo dia às 7h (`FOLLOW_UP_QUEUE_CRON`, fuso `FOLLOW_UP_QUEUE_TIMEZONE`).

- **Antes da demonstração**, rode `npm run db:seed` para voltar ao estado do case (testes manuais alteram os dados).
- Os e2e usam um banco próprio (`crm_nobre_test`) e um *advisory lock* do PostgreSQL: duas execuções simultâneas esperam a vez em vez de apagar os dados uma da outra.

### Roteiro de demonstração (5 minutos)

Com o seed carregado e a data de referência em 15/10/2026:

1. Abra o Kanban. **OPP-2002, OPP-2003 e OPP-2004** aparecem com selo de atenção, no topo de suas colunas.
2. Arraste a **OPP-2003** (Follow-up) para Fechamento. O card volta e aparece "Fechamento só pode ser aplicado a partir de Forecast." (O botão "Mover para…" só oferece os destinos válidos, por isso essa recusa aparece pelo arraste.)
3. Arraste a **OPP-2005** (Forecast) para Fechamento. A mudança é aceita e aparece no histórico.
4. Arraste qualquer card não final para **Perdida**. O sistema exige o motivo.
5. Filtre por **Carla + "Só precisa de atenção"**. Resta apenas a OPP-2004.
6. Abra "Retornos de hoje", clique em **"Gerar fila de hoje"** (logo após o seed a fila ainda não foi gerada) e escolha **Bruno**. A OPP-2002 está na fila. Registre contato: ela sai da fila, e no Kanban o alerta "sem contato" some, mas "proposta vencida" continua.

---

## Stack e arquitetura

| Camada   | Tecnologia                              |
| -------- | --------------------------------------- |
| Backend  | NestJS (Node.js + TypeScript)           |
| Banco    | PostgreSQL                              |
| Frontend | Next.js + React + TypeScript + Tailwind |

Monorepo com **npm workspaces**: `apps/api` (NestJS) e `apps/web` (Next.js). Sem ferramenta extra de monorepo: dois apps não justificam Nx ou Turborepo.

### Camadas (Clean Architecture)

```text
apps/api/src/
  config/                    variáveis de ambiente validadas + data de referência
  shared/domain/             CalendarDate, DomainError, porta ReferenceDateProvider
  shared/http/               formato único de erro, validação de entrada
  shared/infra/prisma/       conexão única com o banco
  modules/opportunities/     Fase 1
    domain/                  matriz de transições, atenção A1–A4 (TypeScript puro)
    application/             casos de uso + portas (repositório)
    infra/                   repositório Prisma, mappers
    http/                    controllers, DTOs, presenters
  modules/follow-up-queue/   Fase 3 (reusa a atenção de opportunities/domain)

apps/web/src/
  app/                       rotas (finas)
  features/<feature>/        components, hooks (React Query), api
  shared/                    cliente HTTP + tipos do contrato, peças de UI, formatação
```

- **As dependências apontam para dentro.** O domínio não conhece Nest, Prisma nem HTTP: é testado sem banco e sem framework. Regras completas em [.claude/rules/clean-architecture.md](.claude/rules/clean-architecture.md).
- **Onde vivem as regras:** só no backend, em `domain/`, uma vez cada. A API entrega pronto o que o front exibe: atenção com motivos, `allowedTransitions` (gerado pela mesma tabela que valida o movimento), ordem dos cards e da fila. O Kanban e a automação consomem o **mesmo** cálculo de atenção.
- **"Hoje" é injetado.** Nenhuma regra usa o relógio do servidor: todas recebem a data de referência por uma porta (`ReferenceDateProvider`). É isso que torna demonstração e testes reprodutíveis.
- **Etapa + histórico atômicos:** o caso de uso chama um único método do repositório (`saveStageChange`), que grava a nova etapa e a entrada de histórico dentro de `prisma.$transaction`. Se uma falhar, nenhuma é gravada.
- **Datas de negócio** (validade, evento, último contato) são colunas `date` e trafegam como `AAAA-MM-DD`, sem fuso, para que "dias sem contato" nunca varie com o horário.

### Bibliotecas

| Biblioteca                                         | Por quê                                                                                                |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| NestJS 12                                          | Stack decidida; módulos e injeção de dependência encaixam portas e adaptadores sem código extra    |
| Prisma 7 (+ `@prisma/adapter-pg`)                | Schema declarativo, migrações versionadas e cliente tipado; `$transaction` para etapa + histórico  |
| PostgreSQL 17 (Docker)                             | Stack decidida; tipo `date` nativo para as datas de negócio; Docker evita instalar banco na máquina |
| class-validator / class-transformer                | Padrão do `ValidationPipe` do Nest para validar toda entrada                                         |
| @nestjs/config                                     | Valida o ambiente na subida: configuração errada derruba a API em vez de gerar erro escondido         |
| @nestjs/schedule                                   | Rotina diária da Fila sem infraestrutura extra (fila, worker)                                          |
| @nestjs/swagger                                    | Documentação da API gerada do código, sempre em dia                                                  |
| helmet · @nestjs/throttler                        | Cabeçalhos HTTP seguros e limite de requisições com uma linha cada                                   |
| Vitest · Supertest                                | Testes rápidos com ESM nativo e a mesma ferramenta nos dois apps; Supertest testa o HTTP real do Nest  |
| oxlint (com tipos)                                 | Lint muito rápido na API, inclusive a regra que pega promise sem `await`                             |
| Next.js 16 · React 19 · Tailwind 4               | Stack decidida                                                                                          |
| TanStack Query                                     | Cache, estados de carregando/erro e atualização otimista com rollback quando a API recusa o movimento |
| dnd-kit                                            | Arrastar e soltar acessível (teclado e toque) e mantido ativamente                                     |
| Radix UI (padrão shadcn) · cva · tailwind-merge | Componentes acessíveis sem visual imposto, estilizados só com os tokens da marca                      |
| next-themes · sonner · lucide-react              | Tema claro/escuro sem piscar, toasts e ícones                                                          |
| Testing Library (jsdom)                            | Testa componentes pelo que o vendedor vê, não pela implementação                                    |
| ESLint (`eslint-config-next`)                    | Regras oficiais do Next e do React no front                                                             |

---

## Regras do funil

**O case exige:**

- Etapas: Primeiro Contato → Apresentação de Orçamento → Follow-up → Forecast → Fechamento. Além disso, Perdida.
- Fechamento e Perdida são estados finais.
- Só avança para Apresentação de Orçamento com valor estimado e pelo menos 1 item de brinde.
- Só entra em Fechamento a partir de Forecast.
- Perdida pode ser aplicada de qualquer etapa não final e exige motivo.

**Nós decidimos** ([ADR-001](docs/decisoes/ADR-001-transicoes-de-etapa.md)):

| De ↓ / Para →             | Prim. Contato | Apres. Orçamento |   Follow-up   | Forecast | Fechamento | Perdida |
| --------------------------- | :-----------: | :---------------: | :-----------: | :------: | :--------: | :-----: |
| **Primeiro Contato**  |      –      |       ✅ ¹       |      ❌      |    ❌    |     ❌     |  ✅ ²  |
| **Apres. Orçamento** |      ❌      |        –        |      ✅      |    ❌    |     ❌     |  ✅ ²  |
| **Follow-up**         |      ❌      | ✅ ↩ revisão ¹ |      –      |    ✅    |     ❌     |  ✅ ²  |
| **Forecast**          |      ❌      | ✅ ↩ revisão ¹ | ✅ ↩ esfriou |    –    |     ✅     |  ✅ ²  |
| **Fechamento**        |      ❌      |        ❌        |      ❌      |    ❌    |     –     |   ❌   |
| **Perdida**           |      ❌      |        ❌        |      ❌      |    ❌    |     ❌     |   –   |

¹ Exige valor estimado e pelo menos 1 item. ² Exige motivo (Preço, Prazo, Concorrência, Cliente desistiu, Sem resposta ou Outro com texto).

Todas as regras são validadas **no backend**. O frontend apenas reflete o que a API decide.

---

## Decisões de produto

Cada decisão está registrada como ADR curto em [`docs/decisoes`](docs/decisoes/README.md).

| Decisão                                                                   | Resumo                                                                                                                                            | Por quê                                                                                   |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [ADR-001](docs/decisoes/ADR-001-transicoes-de-etapa.md) Transições        | Avança uma etapa por vez. Retornos só para revisão de proposta ou quando o Forecast esfria. Estado final não reabre                           | Pular etapa esconde a falta de follow-up. Reabrir distorce o histórico                    |
| [ADR-002](docs/decisoes/ADR-002-precisa-de-atencao.md) Precisa de atenção | 4 regras objetivas: proposta vencida, mais de 5 dias sem contato, evento em 7 dias ou menos, validade após o evento. Sempre com o motivo escrito | O motivo diz ao vendedor o que fazer. Regras simples são testáveis e explicáveis        |
| [ADR-003](docs/decisoes/ADR-003-automacao-escolhida.md) Automação         | Problema 4 (retorno esquecido) como "Fila de retorno do dia"                                                                                      | Maior aderência ao tema, testável sem serviço externo, reaproveita a regra de atenção |
| [ADR-004](docs/decisoes/ADR-004-itens-por-oportunidade.md) Itens            | Oportunidade com 1 ou mais itens. Valor estimado informado pelo vendedor                                                                          | Kits corporativos têm vários brindes. O case não traz regras de preço                  |
| [ADR-005](docs/decisoes/ADR-005-comportamento-do-kanban.md) Kanban          | Cards com atenção primeiro. Movimento recusado devolve o card com a mensagem da API. Botão "Mover para…" como alternativa ao arraste          | Responde à pergunta-chave. O vendedor nunca vê um estado falso                           |

### Resultado esperado com os dados do case

| Código  | Empresa               | Etapa             | Precisa de atenção? | Motivos                                          |
| -------- | --------------------- | ----------------- | --------------------- | ------------------------------------------------ |
| OPP-2001 | Tech Alpha Ltda       | Primeiro Contato  | Não                  | –                                               |
| OPP-2002 | Construtora Horizonte | Apres. Orçamento | **Sim**         | Proposta vencida há 2 dias; 9 dias sem contato  |
| OPP-2003 | Clínica Vida         | Follow-up         | **Sim**         | Evento em 3 dias; validade após o evento        |
| OPP-2004 | Agência Pulso        | Follow-up         | **Sim**         | Proposta vencida há 5 dias; 13 dias sem contato |
| OPP-2005 | Banco Norte           | Forecast          | Não                  | –                                               |
| OPP-2006 | Escola Saber          | Fechamento        | Não (estado final)   | –                                               |
| OPP-2007 | Padaria do Bairro     | Perdida           | Não (estado final)   | –                                               |

---

## Premissas

O case não informa os valores abaixo. São **premissas nossas**, configuráveis ([premissas.md](docs/decisoes/premissas.md)).

| Premissa                              | Valor                                         | Motivo                                                                                                                  |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Data de referência                   | 15/10/2026                                    | Data de referência dos dados do case                                                                                   |
| Prazo mínimo de produção e entrega | 7 dias antes do evento                        | Brinde personalizado precisa de tempo de produção. O case não informa o prazo                                        |
| Limite sem contato                    | mais de 5 dias                                | Ritmo razoável de follow-up em venda consultiva. Deve ser validado com o time comercial                                |
| OPP-2001: data 30/11                  | É a data do evento                           | A oportunidade está em Primeiro Contato, sem proposta. Logo, não há validade                                         |
| OPP-2007 sem motivo de perda          | Carregada com "Não registrado (dado legado)" | O dado é anterior à regra. Não inventamos um motivo nem descartamos o registro. A regra vale para toda mudança nova |
| OPP-2003: validade após o evento     | Mantida e sinalizada                          | Alerta, não bloqueio. O vendedor corrige o dado                                                                        |

---

## Automação

### Implementada: Fila de retorno do dia (problema 4)

**Por que esta:** é a dor central do case (proposta esquecida = venda perdida), pode ser testada sem nenhum serviço externo e reaproveita a regra de "precisa de atenção" em vez de criar outra. Comparação completa no [ADR-003](docs/decisoes/ADR-003-automacao-escolhida.md).

**Como funciona:**

1. Uma rotina diária (que também pode ser disparada manualmente) monta, para cada vendedor, a lista das oportunidades não finais que precisam de atenção.
2. A ordem é pela urgência do motivo: evento próximo → proposta vencida → datas incoerentes → sem contato. Empate: maior valor primeiro (sem valor informado vai por último), depois o código. Cada oportunidade aparece uma vez, com todos os motivos.
3. Ao registrar contato, o item sai da fila **do dia**. Se o problema continuar (por exemplo, proposta ainda vencida), ele volta amanhã. Assim o vendedor não é cobrado duas vezes no mesmo dia.
4. Cada vendedor recebe um resumo do dia. O envio é **simulado**: o texto fica registrado, sem e-mail real.

**Resultado com os dados do case:** Ana → OPP-2003 · Bruno → OPP-2002 · Carla → OPP-2004.

**Regras cobertas por testes:** prioridade, desempate, oportunidade com vários motivos, exclusão de estados finais, idempotência (rodar duas vezes não duplica), baixa por contato, limites exatos de cada alerta, campos em branco, fila vazia e o resultado do seed. Lista completa em [fase-3-automacao.md](docs/backlog/fase-3-automacao.md#regras-críticas-que-precisam-de-testes).

**Como usar e verificar:**

| O quê                                     | Como                                                                                                                                                                                                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Disparar a rotina manualmente              | `curl -X POST http://localhost:3333/api/v1/follow-up-queue/runs` (opcional: `-H "Content-Type: application/json" -d '{"date":"2026-10-15"}'`), o Swagger ou o botão "Gerar fila de hoje". Rodar de novo para a mesma data substitui o resultado, sem duplicar |
| Ver a fila de um vendedor                  | Tela "Retornos de hoje", ou `GET /api/v1/follow-up-queue?sellerId=<id>` (ids em `GET /api/v1/sellers`)                                                                                                                                                         |
| Consultar o resumo gerado (envio simulado) | `GET /api/v1/follow-up-queue/summaries` (filtros opcionais `date` e `sellerId`)                                                                                                                                                                              |
| Rodar só os testes da automação         | Unitários: `npm test -w api -- follow-up-queue` · e2e: `npm run test:e2e -w api -- follow-up-queue` (precisa do `npm run db:up`)                                                                                                                           |

O código fica em `apps/api/src/modules/follow-up-queue`: a regra da fila (quem entra e em que ordem) é uma função pura que reaproveita o cálculo de atenção da Fase 1; a rotina diária e o disparo manual chamam o mesmo caso de uso.

### Não implementadas

**Problema 1: Lead esperando o primeiro contato (SLA)**

- **Solução:** todo lead novo tem prazo para o primeiro contato. Perto de estourar, o vendedor é avisado. Se estourar, o gestor é avisado.
- **Ideia de implementação:** registrar a entrada do lead e o primeiro contato. Uma nova regra de atenção ("lead sem contato há X horas", em horário comercial) entra no mesmo motor da Fila de retorno, com prioridade máxima, e a rotina passa a rodar em intervalos curtos.
- **Por que não agora:** o case foca no follow-up, e o mecanismo da Fila já é a base dessa evolução.

**Problema 2: Enriquecer informações da empresa do lead**

- **Solução:** ao informar o CNPJ, o CRM completa razão social, porte, atividade principal e endereço.
- **Ideia de implementação:** consulta assíncrona a uma fonte pública de CNPJ, isolada atrás de uma interface própria (para trocar o fornecedor sem mexer no CRM), com cache, tolerância a falha e preenchimento manual como alternativa. Testes com fornecedor simulado.
- **Por que não agora:** depende de serviço externo (frágil para validar e demonstrar) e agrega pouco ao follow-up.

**Problema 3: Informações do roteiro da ligação acessíveis**

- **Solução:** o que o vendedor descobre na ligação (ocasião, data do evento, quantidade, orçamento, quem decide) vira dado estruturado na oportunidade.
- **Ideia de implementação:** primeiro, um roteiro em formulário dentro do detalhe da oportunidade. Depois, transcrição da ligação com extração automática por IA e revisão humana antes de salvar.
- **Por que não agora:** maior esforço, e a parte de maior valor depende de serviços externos e de cuidados com privacidade (LGPD).

---

## Segurança

**O que foi feito nesta versão:**

| Controle                           | Como                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nenhuma credencial no repositório | Só `.env.example` versionado (valores de desenvolvimento local). `.env*` no `.gitignore`                                                                    |
| Checagem de segredos               | `secretlint` nos arquivos de cada commit e no repositório inteiro na CI. Hook do Claude Code impede os agentes de editar `.env` reais e chaves                |
| Configuração validada            | Variável faltando ou inválida impede a API de subir                                                                                                              |
| Toda entrada validada              | DTOs com `class-validator`; campos desconhecidos são recusados (`whitelist` + `forbidNonWhitelisted`)                                                       |
| Erros sem detalhe interno          | Formato único `{ statusCode, error, message, details }`. Sem stack trace, SQL ou nome de tabela; erro inesperado vira 500 genérico e o detalhe fica só no log |
| SQL injection                      | Acesso ao banco só pelo Prisma, com consultas parametrizadas                                                                                                      |
| CORS                               | Uma única origem (a do frontend), sem curinga                                                                                                                     |
| Cabeçalhos HTTP                   | `helmet`                                                                                                                                                         |
| Abuso                              | 100 requisições por minuto por IP                                                                                                                                |
| Dependências                      | `npm audit` das dependências de produção na CI (falha com vulnerabilidade alta ou crítica)                                                                   |

Detalhes e regras para quem codifica: [skill de segurança](.claude/skills/seguranca/SKILL.md).

**Como protegeríamos a API em produção:**

- **Autenticação:** login corporativo (de preferência o provedor de identidade que a empresa já usa), com sessões ou tokens de curta duração.
- **Autorização por papel:** vendedor vê e altera as próprias oportunidades. Gestor vê todas. Com isso, o histórico passa a registrar **quem** fez cada mudança.
- **Transporte:** apenas HTTPS.
- **Proteção contra abuso:** limite de requisições por usuário e por IP.
- **Segredos:** em cofre de segredos do ambiente, nunca no código, com rotação periódica.
- **Banco:** usuário da aplicação com o mínimo de permissões necessárias e backups automáticos.
- **Auditoria e monitoramento:** logs estruturados sem dados sensíveis, alertas para erros e acessos suspeitos.
- **Dependências:** verificação automática de vulnerabilidades na CI.

---

## Qualidade e padrões

### Padrões

Escritos como regras e skills no próprio repositório, seguidas por pessoas e agentes ([mapa de responsáveis](docs/referencias/skills-regras-e-responsaveis.md)):

| Padrão             | Onde                                                                      | Em uma linha                                                                                           |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Clean Architecture  | [.claude/rules/clean-architecture.md](.claude/rules/clean-architecture.md) | Domínio puro no centro; Nest, Prisma e React nas bordas                                               |
| SOLID               | [.claude/rules/solid.md](.claude/rules/solid.md)                           | Um caso de uso por arquivo, portas abstratas, enums com `switch` exaustivo                           |
| Componentização   | [.claude/rules/componentizacao.md](.claude/rules/componentizacao.md)       | Peças base → peças do produto → peças da feature; dados do servidor só via React Query           |
| Design patterns     | [.claude/rules/design-patterns.md](.claude/rules/design-patterns.md)       | Repository, lista de regras (atenção), tabela de decisão (transições), presenter, update otimista |
| Design system       | [.claude/skills/design-system](.claude/skills/design-system/SKILL.md)      | Só tokens semânticos, dois temas, contraste AA. **Checado automaticamente no lint**            |
| Padrão da API REST | [.claude/skills/api-rest](.claude/skills/api-rest/SKILL.md)                | `/api/v1`, ações como subrecursos, formato único de erro com códigos de regra                    |
| Testes              | [.claude/skills/testes](.claude/skills/testes/SKILL.md)                    | Pirâmide domínio → caso de uso → e2e com banco real; data de referência fixa                      |
| Segurança          | [.claude/skills/seguranca](.claude/skills/seguranca/SKILL.md)              | Ver seção Segurança                                                                                 |

### Garantido por automação

Os padrões não dependem de boa vontade: são verificados em três momentos.

| Momento                               | O que roda                                                                                                                             | Ferramenta                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Antes do commit                       | Formatação, lint com correção automática, checagem de tokens do design system e de segredos, **só nos arquivos do commit** | Husky + lint-staged + Prettier + oxlint/ESLint + secretlint |
| Mensagem do commit                    | Recusa mensagem fora do Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`…)                  | commitlint                                                  |
| Antes do push                         | Checagem de tipos e testes unitários dos dois apps                                                                                    | Husky                                                       |
| Agente edita um arquivo               | Formata e roda o lint no arquivo; o erro volta na hora para o agente corrigir                                                          | Hook `PostToolUse` do Claude Code                         |
| Agente tenta editar `.env` ou chave | Bloqueado                                                                                                                              | Hook `PreToolUse` do Claude Code                          |
| Agente encerra a tarefa               | Tipos e testes **só dos apps que ele alterou**; se falhar, ele precisa corrigir ou reportar                                     | Hook `Stop` do Claude Code                                |
| Cada push e pull request              | Commits, formatação, segredos, lint, tipos, testes unitários, `npm audit`, build e **e2e com PostgreSQL**                   | GitHub Actions ([ci.yml](.github/workflows/ci.yml))          |

Hooks locais podem ser pulados (`--no-verify`); a CI não. Por isso ela repete tudo.

**Instalação dos hooks:** automática. O `npm ci` executa o script `prepare`, que ativa o Husky. Os hooks do Claude Code estão em [.claude/settings.json](.claude/settings.json) e valem para qualquer sessão aberta no repositório.

**Identidade visual:** cores e fontes da Nobre Brindes, extraídas do site público da marca ([identidade-visual-nobre.md](docs/referencias/identidade-visual-nobre.md)). As cores de atenção, sucesso e informação **não existem na marca** e foram criadas por nós, harmonizadas com a paleta: o dourado da marca escurecido para atenção no tema claro, um verde derivado do principal para sucesso e um azul petróleo para informação. O vermelho da marca também foi escurecido no tema claro, porque não atingia o contraste mínimo AA dentro dos selos. Todos os tons de status têm contraste AA (≥ 4,5:1) nos dois temas.

---

## Limitações e próximos passos

| Limitação                                                                                           | Impacto                                                                                        | Próximo passo                                                 |
| ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Sem autenticação                                                                                    | Qualquer pessoa com acesso altera qualquer oportunidade. O histórico não registra quem mudou | Login corporativo e papéis (ver Segurança)                   |
| Risco de entrega após o fechamento fica fora da regra de atenção (ex.: OPP-2006, evento em 2 dias) | O vendedor não é alertado. O risco passa a ser da produção                                 | Alerta "entrega apertada" para o time de produção            |
| Parâmetros (5 e 7 dias) são premissas                                                               | Podem não refletir a operação real                                                          | Validar com o time comercial e de produção                   |
| Estado final não reabre                                                                              | Cliente que volta exige nova oportunidade                                                      | "Duplicar oportunidade encerrada"                              |
| Envio do resumo é simulado                                                                           | O vendedor precisa abrir o CRM para ver a fila                                                 | Integração com e-mail ou mensageria corporativa              |
| Sem data de "próximo retorno" combinado com o cliente                                                | A fila se baseia em regras, não em promessas feitas na ligação                              | Campo de próximo retorno, que entra na fila na data combinada |
| Valor estimado não é calculado pelos itens                                                          | Depende do vendedor manter o valor atualizado                                                  | Preço por item quando houver regra comercial                  |

**Limitações técnicas:**

| Limitação                                                                                                                                                   | Impacto                                                                                                                                                                                                                                                      | Próximo passo                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Listagem sem paginação; busca (sem acento), filtro de atenção e ordenação feitos em memória                                                            | Adequado ao volume do case (7 oportunidades), não a uma base real                                                                                                                                                                                           | Paginação por cursor, busca no banco com a extensão `unaccent` e índice |
| Concorrência só é controlada na mudança de etapa (update condicional à etapa lida, `409`). Edições de dados comerciais simultâneas: a última vence | Raro com o uso esperado; nunca reabre estado final                                                                                                                                                                                                           | Campo de versão (lock otimista) também no PATCH                             |
| Limite de 100 requisições/min não é coberto por teste automatizado                                                                                        | Configuração de uma linha do Nest, conferida em revisão                                                                                                                                                                                                   | Teste dedicado com limite reduzido                                            |
| O histórico guarda o instante real da gravação (auditoria), mas as regras usam a data de referência                                                       | Na demonstração, o "hoje" do sistema é 15/10/2026, mas cada mudança aparece no histórico com a data e a hora reais em que foi feita (ex.: uma mudança feita em 20/10 mostra 20/10). Não é erro: a data de referência só simula o "hoje" das regras | Em produção não há diferença: a data de referência é o próprio dia    |
| `npm install` falha no npm 10 neste monorepo sem lockfile (bug do npm)                                                                                      | É preciso usar `npm ci`                                                                                                                                                                                                                                   | Resolvido no npm 11                                                           |
| Rotina diária roda dentro do processo da API                                                                                                                 | Com várias instâncias, rodaria uma vez por instância (a idempotência evita duplicar, mas há trabalho repetido)                                                                                                                                          | Agendador externo ou trava no banco                                           |
| A fila do dia é a lista gerada pela rotina                                                                                                                   | Uma oportunidade que passa a precisar de atenção depois da execução só entra na próxima (ou ao clicar em "Gerar fila de hoje")                                                                                                                         | Regenerar a fila quando um dado relevante mudar                               |
| O arraste do Kanban não tem teste automatizado (o jsdom não calcula layout para o dnd-kit)                                                                  | O que acontece depois de soltar é o mesmo fluxo do "Mover para…", que é testado; o arraste foi validado manualmente                                                                                                                                       | Teste de ponta a ponta no navegador (Playwright)                              |
| Teclado e leitor de tela movem cards pelo "Mover para…", não pelo arraste                                                                                   | Funciona, mas sem arrastar pelo teclado                                                                                                                                                                                                                      | Sensor de teclado do dnd-kit                                                  |
| Edição de dados comerciais na tela (H4.9, *Should*) não foi feita                                                                                        | A API aceita a edição (`PATCH`), mas a tela não oferece                                                                                                                                                                                                 | Formulário no detalhe da oportunidade                                        |
| Hook `Stop` do Claude Code verifica o app inteiro                                                                                                           | Com vários agentes no mesmo app, um pode ser cobrado pelo trabalho em andamento de outro                                                                                                                                                                    | Limitar a verificação aos arquivos do próprio agente                       |

---

## Uso de IA

O projeto foi desenvolvido com apoio de agentes de IA (Claude Code), cada um com um papel definido e regras escritas no repositório:

| Agente         | Papel                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Product Owner  | Transformou o enunciado em backlog, tomou e documentou as decisões de produto (ADRs) e analisou as inconsistências dos dados |
| Tech Lead      | Arquitetura, padrões e revisão técnica                                                                                      |
| Backend        | API e regras de negócio                                                                                                       |
| Frontend       | Kanban e telas                                                                                                                 |
| QA/Automação | Testes das regras críticas e automação                                                                                      |

**Como as decisões foram controladas:**

- As regras de negócio vivem num único lugar ([skill `dominio-crm`](.claude/skills/dominio-crm/SKILL.md) + ADRs), seguido por todos os agentes. Nenhum agente pode criar regra fora dos ADRs.
- Toda premissa feita pela IA foi apresentada ao desenvolvedor e **aprovada por ele** antes de entrar no backlog (data do evento da OPP-2001, tratamento do dado legado, prazos de 5 e 7 dias).
- A IA não teve acesso a fontes não públicas. As cores da marca vieram do CSS público do site da Nobre Brindes.
- Os agentes trabalharam em paralelo, orquestrados no Maestri, cada um com um papel escrito. O Tech Lead revisou o código dos demais. O P.O. validou cada fase contra os critérios de aceite **testando a API e a interface diretamente**, sem se basear só no relatório de quem implementou.
- Nenhum commit foi feito pelos agentes. O commit dependeu de autorização do desenvolvedor.

> **A completar pelo desenvolvedor:** o que foi revisado manualmente, onde a IA errou ou precisou ser corrigida, e o que foi escrito sem IA.
