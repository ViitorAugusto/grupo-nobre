# Definição de pronto

Uma história só é **pronta** quando cumpre todos os itens abaixo. O P.O. revisa a parte de produto e o Tech Lead revisa a parte técnica.

## Produto (revisa: P.O.)

- [ ] Todos os critérios de aceite (Dado/Quando/Então) da história foram atendidos e podem ser demonstrados com o seed.
- [ ] O comportamento bate com os ADRs e com a skill `dominio-crm`. Nenhuma regra nova foi criada sem ADR.
- [ ] Os resultados esperados das tabelas (ADR-002, ADR-003, contrato da API) continuam exatos.
- [ ] As mensagens que o vendedor lê dizem **qual regra** foi violada e estão em português correto.
- [ ] Na interface: estados de carregamento, erro e vazio tratados, e "precisa de atenção" com ícone e texto (não só cor).
- [ ] Nada fora do escopo da história foi adicionado. Uma ideia nova vira sugestão ao P.O., não código.
- [ ] Se a entrega mudou algo que o README descreve, o README foi atualizado. Limitações novas foram registradas.
- [ ] O que foi premissa nossa está marcado como premissa, não como fato do Grupo Nobre.

## Técnico (revisa: Tech Lead)

Os itens marcados com ⚙ são verificados por automação (hooks e CI). Os demais, na revisão.

**Qualidade automática**

- [ ] ⚙ `npm run format:check`, `npm run lint` (inclui a checagem de tokens do design system), `npm run typecheck`, `npm test`, `npm run test:e2e` e `npm run build` passando localmente e na CI (na CI o Vitest também recusa `.only`).
- [ ] Nenhum teste desligado com `.skip` sem justificativa escrita (verificado na revisão).
- [ ] ⚙ `npm run secrets:check` limpo e `npm audit --omit=dev` sem vulnerabilidade alta ou crítica. Nenhum `.env` real ou credencial no diff.

**Testes** ([skill testes](../../.claude/skills/testes/SKILL.md))

- [ ] Toda regra nova ou alterada tem teste unitário no domínio, incluindo os casos de borda, com a data de referência fixa (nunca a data real).
- [ ] Todo endpoint novo ou alterado tem e2e de sucesso e de cada erro de regra que ele pode devolver.
- [ ] O resultado do seed continua batendo com a tabela do contrato (e2e `seed`).

**Arquitetura e código** ([.claude/rules](../../.claude/rules))

- [ ] Regra de negócio só em `domain/` do backend, num lugar só. O front não recalcula atenção, dias, ordem nem destinos.
- [ ] Dependências apontando para dentro: `domain/` sem Nest, Prisma ou `new Date()`; controller fino (DTO → caso de uso → presenter); componente sem `fetch` direto.
- [ ] Escritas que precisam acontecer juntas estão na mesma transação.

**API** ([contrato](../api/contrato-api.md), [skill api-rest](../../.claude/skills/api-rest/SKILL.md))

- [ ] O contrato foi atualizado **antes** do código, e Swagger e contrato batem.
- [ ] Toda entrada passa por DTO com limites; erros no formato único, com o código de regra do contrato e sem detalhe interno.

**Interface** ([skill design-system](../../.claude/skills/design-system/SKILL.md))

- [ ] Conferida nos temas claro e escuro e em largura de celular.
- [ ] Toda ação de arrastar tem alternativa por botão; botões só com ícone têm `aria-label`.

**Documentação e revisão**

- [ ] Biblioteca nova tem uma linha de justificativa no README.
- [ ] Limitação técnica nova registrada no README.
- [ ] Revisão técnica do Tech Lead feita, com os comandos acima rodados por ele (não só pelo autor).

## Fluxo

1. O agente termina e reporta ao P.O. o que fez, como validar e o que ficou pendente.
2. O P.O. valida contra esta lista e os critérios de aceite. Responde "aprovado" ou a lista do que falta.
3. O commit só acontece com autorização do desenvolvedor.
