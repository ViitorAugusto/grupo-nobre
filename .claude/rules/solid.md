# Princípios SOLID — aplicação neste projeto

Aplicação em NestJS + Next.js. Vale para todo código novo ou alterado.

## S — Responsabilidade única

- **Um caso de uso por arquivo** (`move-stage.use-case.ts`, `register-contact.use-case.ts`). Nome com "e" (`moverEGravar`) = dividir.
- Controller cuida **só** de HTTP: recebe DTO validado, chama o caso de uso, devolve o presenter. Regra de negócio no controller → mover para domínio/aplicação.
- Um arquivo de domínio por assunto: `stage-transition.ts` (matriz), `attention.ts` (A1–A4), `queue-priority.ts` (ordem da fila).
- No front: um componente por arquivo; tela não faz chamada HTTP direta (usa hook da feature).

## O — Aberto/fechado

- Etapas, motivos de perda e regras de atenção são **unions/enums** com `switch` exaustivo (`never` no `default`). Novo valor = o compilador aponta todos os pontos.
- Regra de atenção nova (ex.: SLA do problema 1) entra como **mais uma regra na lista** do cálculo, sem mexer nas outras.
- Matriz de transições como **tabela de dados** (`Record<Stage, Stage[]>`), não como cadeia de `if`.

## L — Substituição de Liskov

- Toda implementação de uma porta respeita o contrato: o repositório em memória dos testes e o Prisma devolvem os mesmos tipos e lançam os mesmos erros de domínio (ex.: `NotFoundError`).
- Não estreite contrato: se a porta aceita `null` (validade em branco), toda implementação aceita.

## I — Segregação de interfaces

- Portas pequenas e voltadas ao caso de uso. A fila não precisa de `saveStageChange`; se precisar só de leitura, use uma porta de leitura.
- Componentes recebem só as props que usam (`code`, `company`, `attention`), não a oportunidade inteira.

## D — Inversão de dependência

- Casos de uso dependem de **abstrações** (`abstract class OpportunityRepository`, `ReferenceDateProvider`), ligadas no `*.module.ts`. Nos testes, troque por implementação em memória ou data fixa.
- O domínio recebe tudo por parâmetro (oportunidade, hoje, parâmetros 5/7 dias). Não lê `process.env` nem `ConfigService`.
- O front depende do **contrato HTTP** (`docs/api/contrato-api.md`), nunca de detalhes do backend.

## Sinais de violação (revisar antes de entregar)

- Controller ou componente com mais de ~100 linhas de lógica → extrair.
- Mesmo cálculo de datas em 2 lugares → extrair para o domínio (e no front: apagar, vem da API).
- `if (stage === ...)` repetido em vários arquivos → tabela/`switch` exaustivo no domínio.
- Caso de uso instanciando `PrismaService` ou lendo `process.env`.
