# Skills, regras e responsáveis

Mapa central do que cada agente segue e do que cada um é dono. Se uma regra conflitar com um ADR, **o ADR vence** e o P.O. deve ser avisado.

## Agentes e responsabilidades

| Agente | É dono de | Não faz |
| --- | --- | --- |
| Product Owner | Backlog, critérios de aceite, ADRs de produto, premissas, revisão contra critérios | Código, escolha de ferramentas, arquitetura |
| Tech Lead | Arquitetura, escolha de ferramentas, adaptação das regras técnicas, hooks e padrões de qualidade | Mudar regra de negócio sem ADR |
| Backend | API NestJS + PostgreSQL, regras no backend, seed, histórico | Regra só no front, autenticação completa |
| Frontend | Kanban Next.js, estados de UI, design system | Recalcular regra de negócio |
| QA / Automação | Testes das regras críticas, automação da Fase 3 | Alterar critérios de aceite sem o P.O. |

## Skills e regras do projeto

| Skill / regra | Origem | Responsável por escrever/adaptar | Quem segue | Status |
| --- | --- | --- | --- | --- |
| Domínio do CRM | Nova | P.O. | Todos | Criada em `.claude/skills/dominio-crm` |
| Documentação e decisões | Nova | P.O. | Todos (principalmente P.O. e Tech Lead) | Criada em `.claude/skills/documentacao-decisoes` |
| Clean Architecture | Padrão de mercado | Tech Lead (adaptar para NestJS + Next.js) | Tech Lead, Backend, Frontend | Adaptada em `.claude/rules/clean-architecture.md` |
| SOLID | Padrão de mercado | Tech Lead (adaptar) | Tech Lead, Backend, Frontend | Adaptada em `.claude/rules/solid.md` |
| Componentização | Padrão de mercado | Tech Lead (adaptar) | Frontend | Adaptada em `.claude/rules/componentizacao.md` |
| Design patterns | Padrão de mercado | Tech Lead (adaptar) | Tech Lead, Backend, Frontend | Adaptada em `.claude/rules/design-patterns.md` |
| Design system | Tokens semânticos + [identidade Nobre Brindes](identidade-visual-nobre.md) | Tech Lead / Frontend | Frontend | Adaptada em `.claude/skills/design-system` |
| Testes | Nova | Tech Lead / QA | Backend, QA | Criada em `.claude/skills/testes` |
| Padrão da API REST | Nova | Tech Lead | Backend, Frontend (consumo) | Criada em `.claude/skills/api-rest` |
| Segurança básica | Nova + revisão de segurança existente | Tech Lead | Backend | Criada em `.claude/skills/seguranca` |
| Definição de pronto | Nova | P.O. + Tech Lead | Todos | Rascunho em `docs/referencias/definicao-de-pronto.md` (parte técnica com o Tech Lead) |

**Atenção na adaptação das regras:** os exemplos e as pastas devem refletir o nosso projeto (backend NestJS separado, PostgreSQL). A identidade visual é a da Nobre Brindes.

## Hooks e padrões automáticos (requisito para o Tech Lead)

Pedido do desenvolvedor: os padrões devem ser **garantidos por hooks**, seguindo as práticas mais comuns do mercado. A escolha das ferramentas é do Tech Lead. O P.O. define **o que** precisa ser garantido.

### Git hooks (valem para qualquer pessoa ou agente)

| Momento | O que garantir | Prática de mercado |
| --- | --- | --- |
| Antes do commit | Lint e formatação **só nos arquivos alterados**, com correção automática quando possível | Hooks de pre-commit com lint e format em arquivos staged |
| Mensagem do commit | Mensagem no padrão **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`) | Validação de commit-msg |
| Antes do push | Checagem de tipos e testes passando | Hook de pre-push |
| Sempre | Nenhum segredo ou `.env` real commitado | `.gitignore` + checagem de segredos |

### Hooks do Claude Code (valem para os agentes)

| Momento | O que garantir |
| --- | --- |
| Depois de editar ou criar arquivo de código | Formatar e rodar o lint no arquivo alterado, devolvendo os erros ao agente |
| Antes de editar | Bloquear edição de arquivos sensíveis (`.env` reais, credenciais) |
| Ao encerrar uma tarefa | Rodar checagem de tipos e testes do módulo afetado e avisar se falharem |

### Integração contínua

Os hooks locais podem ser ignorados. Por isso a CI deve repetir **lint, checagem de tipos e testes** a cada push e pull request. Esse é o padrão de mercado e é o que a banca consegue verificar.

### Critério de pronto dos hooks

- Um commit com mensagem fora do padrão é recusado.
- Um arquivo com erro de lint não entra no commit sem correção.
- Um push com teste quebrado é recusado.
- O README explica como os hooks são instalados (devem funcionar após a instalação normal das dependências, sem passo manual escondido).
