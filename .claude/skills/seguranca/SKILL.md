---
name: seguranca
description: Segurança básica do CRM da Nobre Brindes — o que esta versão garante (sem segredos no repositório, validação de toda entrada, erro sem detalhe interno, CORS restrito, helmet, limite de requisições, Prisma parametrizado, checagem de segredos e de dependências) e como seria em produção (autenticação, papéis, HTTPS, cofre de segredos). Use SEMPRE que for mexer em configuração, variáveis de ambiente, endpoints, entrada de dados, erros, dependências, CORS, logs, ou revisar segurança.
---

# Segurança básica

Escopo do case: **sem autenticação** (Won't). Mesmo assim, a API é tratada como exposta. Requisito da H3.3: nenhuma credencial no repositório, toda entrada validada, erros em formato único.

## O que esta versão garante (e onde)

| Controle | Como | Onde |
| --- | --- | --- |
| Sem segredo no repositório | Só `.env.example` versionado; `.env*` no `.gitignore`; credenciais do Postgres são locais e de exemplo | `.gitignore`, `apps/*/.env.example` |
| Detecção de segredo | `secretlint` nos arquivos do commit (pre-commit) e no repositório inteiro (CI) | `.lintstagedrc.json`, CI |
| Bloqueio de edição de `.env` reais pelos agentes | Hook `PreToolUse` do Claude Code | `.claude/hooks/protect-sensitive-files.mjs` |
| Configuração validada na subida | `validateEnv`: variável faltando ou inválida = a API não sobe | `apps/api/src/config/env.ts` |
| Validação de toda entrada | `ValidationPipe` global com `whitelist` + `forbidNonWhitelisted` + DTOs | `shared/http/validation.ts` |
| Erro sem detalhe interno | Filtro global: sem stack trace, SQL ou nome de tabela; 500 genérico com log no servidor | `shared/http/api-exception.filter.ts` |
| SQL injection | Só Prisma com consultas parametrizadas. `$queryRawUnsafe`/`$executeRawUnsafe` **proibidos** | revisão de código |
| CORS | Uma origem só (`CORS_ORIGIN`), sem curinga | `configure-app.ts` |
| Cabeçalhos HTTP seguros | `helmet` | `configure-app.ts` |
| Abuso | `@nestjs/throttler`: 100 req/min por IP | `app.module.ts` |
| Dependências | `npm audit --omit=dev --audit-level=high` na CI | CI |

## Regras para quem codifica

- Nunca escreva segredo, token ou senha real em código, teste, doc ou commit. Valor novo de configuração = variável em `env.ts` + `.env.example` com valor de exemplo.
- Nunca leia `process.env` fora de `config/` (exceto `prisma.config.ts` e setup de testes).
- Nunca devolva `error.message` de exceção desconhecida ao cliente. Lance `DomainError` com mensagem pensada para o usuário.
- Toda entrada nova tem DTO com limites (`@MaxLength`, `@Min`, `@ArrayMaxSize`). Texto livre (motivo "Outro") tem tamanho máximo e `trim`.
- Logs sem dado pessoal desnecessário; nunca logue corpo inteiro de requisição.
- No front: não use `dangerouslySetInnerHTML`; o React já escapa texto. Só `NEXT_PUBLIC_*` vai para o navegador e nunca contém segredo.
- Dependência nova: justifique no README e verifique `npm audit`.

## Em produção (documentado no README, não implementado)

Autenticação corporativa (SSO/OIDC) com sessão ou token de curta duração; autorização por papel (vendedor vê as suas, gestor vê todas) e autor no histórico; HTTPS apenas; segredos em cofre com rotação; usuário do banco com privilégio mínimo e backups; logs estruturados com alertas; limite de requisições por usuário além de por IP.

## Checklist de revisão de segurança

- [ ] Nenhum arquivo `.env` real ou credencial no diff (`npm run secrets:check`).
- [ ] Todo endpoint novo com DTO e limites.
- [ ] Nenhum `$queryRawUnsafe`, `eval`, `dangerouslySetInnerHTML`.
- [ ] Erros novos sem detalhe interno.
- [ ] `npm audit --omit=dev` sem `high`/`critical`.
