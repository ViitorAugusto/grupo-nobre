---
name: documentacao-decisoes
description: Padrão de documentação do CRM da Nobre Brindes — como registrar decisões (ADR curto), separar "o case diz" de "nós decidimos/assumimos", escrever histórias e handoffs, e montar o README final (execução, decisões, limitações, segurança, automações não implementadas, uso de IA). Use SEMPRE que for criar ou alterar ADR, backlog, handoff, README ou qualquer arquivo em docs/.
---

# Documentação e decisões

A banca avalia **raciocínio, priorização e explicação das decisões**. A documentação é parte da entrega, não um extra.

## Regra de ouro: fato × decisão × premissa

Toda afirmação sobre o negócio entra numa destas três categorias, e o texto deixa claro qual é:

| Categoria | Quando usar | Como escrever |
| --- | --- | --- |
| **O case diz** | Está no enunciado | "O case exige…" |
| **Nós decidimos** | Escolha nossa entre opções | "Decidimos… porque…" |
| **Nós assumimos** | Valor ou fato que o case não informa | "Assumimos… (configurável)" |

Nunca apresente uma premissa nossa como fato do Grupo Nobre.

## Onde fica cada coisa

| Conteúdo | Local |
| --- | --- |
| ADRs | `docs/decisoes/ADR-NNN-titulo-em-kebab-case.md` + índice em `docs/decisoes/README.md` |
| Premissas e parâmetros | `docs/decisoes/premissas.md` |
| Backlog e handoffs | `docs/backlog/fase-N-*.md` + índice em `docs/backlog/README.md` |
| Referências (marca, responsáveis, hooks) | `docs/referencias/` |
| README final | Raiz do repositório |

## Formato do ADR

```markdown
# ADR-NNN — Título

**Status:** Proposto | Aceito | Substituído por ADR-XXX

## Contexto
O que o case diz e o que ficou em aberto.

## Opções consideradas
1. …
2. …

## Decisão
O que foi decidido, de forma verificável (tabela quando houver regra).

## Justificativa
Por que esta opção e não as outras.

## Consequências
O que muda, o que fica de fora (Won't) e os riscos.
```

- Um ADR por decisão. Cabe numa explicação curta no README.
- Decisão mudou? Crie um ADR novo que **substitui** o antigo. Não reescreva a história.
- Sempre que possível, inclua o resultado esperado com os dados do case. Ele vira caso de teste.

## Formato da história

```markdown
### HN.N Título (Must | Should | Could | Won't)

*Como [vendedor], quero [ação] para [benefício].*

- **Dado** …, **quando** …, **então** ….
```

- Critérios de aceite testáveis, de preferência usando os dados do seed (OPP-2001…2007).
- Prioridade MoSCoW sempre explícita.

## Formato do handoff

Sempre com estas seções: **Construir**, **Regras**, **Necessidades** (o quê, não o como), **Pronto quando** e **Não fazer**.

## README final — seções obrigatórias

1. **O que é:** o problema e o usuário (vendedor), em poucas linhas.
2. **Como executar:** pré-requisitos, variáveis de ambiente (a partir do arquivo de exemplo, sem credenciais), comandos para subir, rodar o seed e rodar os testes.
3. **Decisões:** um parágrafo curto por ADR, com link.
4. **Premissas:** a tabela de `premissas.md`.
5. **Automação:** a implementada (como funciona, como testar) e as 3 não implementadas (solução + ideia de implementação).
6. **Segurança:** o que foi feito e como protegeria a API em produção.
7. **Limitações e próximos passos:** honestas e priorizadas.
8. **Uso de IA:** quais agentes e papéis, para que foram usados, o que foi revisado por humano e onde a IA errou ou foi corrigida.

## Estilo

- Português, direto, frases curtas.
- Tabelas para regras e comparações. Texto corrido para justificativas.
- Datas no formato brasileiro (15/10/2026) e valores em reais (R$ 4.500).
- Sem jargão desnecessário: o README precisa ser lido em poucos minutos.
