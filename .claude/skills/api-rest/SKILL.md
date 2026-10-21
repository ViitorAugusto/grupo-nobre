---
name: api-rest
description: Padrão da API REST do CRM da Nobre Brindes (NestJS) — prefixo /api/v1, recursos e subrecursos de ação, verbos e status, DTOs com class-validator, formato único de erro com códigos em português, datas AAAA-MM-DD, presenters, Swagger e o contrato em docs/api/contrato-api.md. Use SEMPRE que for criar ou alterar endpoint, controller, DTO, presenter, código de erro, ou ao consumir a API no frontend.
---

# Padrão da API REST

O contrato vivo é **[docs/api/contrato-api.md](../../../docs/api/contrato-api.md)**. Esta skill diz **como** qualquer endpoint deve ser feito. Endpoint novo ou mudança de formato = atualizar o contrato (combinar com o Tech Lead) **antes** do código.

## URLs e recursos

- Prefixo global `/api/v1` (já configurado em `configure-app.ts`). Versão na URL: mudança incompatível = `/v2`.
- Recursos no plural, em inglês, kebab-case: `/opportunities`, `/sellers`, `/follow-up-queue`.
- Ações de negócio que não são CRUD viram **subrecurso com POST** e nome de substantivo: `POST /opportunities/:id/stage-changes`, `POST /opportunities/:id/contacts`. Nada de verbo na URL (`/moveStage`).
- Filtros, busca e ordenação na query string (`?sellerId=&needsAttention=true`). Lista vazia é `200` com `data: []`.

## Verbos e status

| Situação | Status |
| --- | --- |
| Leitura, ação concluída que devolve o recurso atualizado | `200` |
| Criação de recurso novo com `id` próprio | `201` + corpo do recurso |
| Formato inválido (DTO) | `400 VALIDACAO_INVALIDA` |
| Recurso inexistente | `404 NAO_ENCONTRADO` |
| Regra de negócio violada | `422` + código da regra |
| Limite de requisições | `429` |
| Erro inesperado | `500 ERRO_INTERNO` (detalhe só no log) |

- `PATCH` = atualização parcial (só os campos enviados). `PUT` não é usado.
- Escritas devolvem o **estado atualizado** (`OpportunityDetail`), para o front não precisar de outro GET.

## Entrada: DTOs

- Toda entrada (body, query, params) é uma classe em `http/dto/` com `class-validator`. O `ValidationPipe` global usa `whitelist` + `forbidNonWhitelisted` + `transform`: campo desconhecido é recusado.
- Mensagens dos decorators em **português** (`@IsEnum(Stage, { message: 'toStage inválido' })`).
- `:id` com `ParseUUIDPipe`. Datas com o validador de `CalendarDate` (`AAAA-MM-DD` real). Texto com `@Transform(trim)` e `@MaxLength`.
- O DTO valida **formato**. Regra de negócio (matriz, requisitos, motivo) fica no domínio e vira `DomainError` → `422`.

## Saída: presenters

- O controller devolve o resultado de um **presenter** (`http/*.presenter.ts`) que monta o JSON do contrato a partir do domínio. Nunca devolva objeto do Prisma.
- `camelCase`; datas de negócio `AAAA-MM-DD`; instantes ISO 8601 UTC; dinheiro `number` em reais; campo em branco = `null` (nunca omitido); enums em português maiúsculo.
- Listas em `{ "data": [...] }`.

## Erros

- Formato único: `{ statusCode, error, message, details? }`, aplicado pelo `ApiExceptionFilter` global (`shared/http`).
- No domínio, lance `DomainError(code, message, details)` (ou `NotFoundError`). O filtro converte: `NotFoundError` → 404, demais `DomainError` → 422.
- `message` em português, para o vendedor, dizendo **qual regra** foi violada. `details` com dados para a UI (`{ from, to }`, `{ missing }`).
- Código de erro novo = adicionar na tabela de erros do contrato.

## Documentação

- `@ApiTags` no controller e `@ApiProperty` nos DTOs/respostas: o Swagger em `/api/v1/docs` precisa bater com o contrato.

## No frontend

- Todo acesso pelo cliente de `apps/web/src/shared/api/` (base `NEXT_PUBLIC_API_URL`), que converte resposta de erro em `ApiError { status, error, message, details }`.
- Mostre `message` da API ao usuário. Decida comportamento pelo `error` (código), nunca pelo texto.
- Tipos do contrato em `shared/api/types.ts`, escritos a partir do contrato.

## Checklist do endpoint

- [ ] Está no contrato, com exemplo e erros possíveis.
- [ ] DTO com validação e mensagens em português; campos extras recusados.
- [ ] Controller fino: DTO → caso de uso → presenter.
- [ ] Erros de regra como `DomainError` com código do contrato.
- [ ] Teste e2e cobrindo sucesso e cada erro de regra.
- [ ] Swagger anotado.
