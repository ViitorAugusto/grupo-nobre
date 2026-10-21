# Fase 4 — README final

Objetivo: a banca entende **o que foi feito, por quê e como rodar** em poucos minutos.

Referência: skill [`documentacao-decisoes`](../../.claude/skills/documentacao-decisoes/SKILL.md).

## Épico E6 — Documentação de entrega

### H6.1 README de produto (Must) — Concluída pelo P.O.

*Como avaliador, quero entender o problema, as regras e as decisões sem ler o código.*

- Seções de produto escritas: visão, regras do funil, decisões, premissas, automação (implementada e as 3 não implementadas), proteção da API em produção, limitações de produto e uso de IA.
- Toda afirmação está marcada como "o case diz", "decidimos" ou "assumimos".

### H6.2 Seções técnicas do README (Must) — Tech Lead

*Como avaliador, quero rodar o projeto e entender a arquitetura sem pedir ajuda.*

- **Dado** um clone limpo do repositório, **quando** sigo "Como executar", **então** consigo subir tudo, carregar o seed e rodar os testes sem passos escondidos.
- Preenchidos todos os blocos marcados "A preencher pelo Tech Lead".

### H6.3 Roteiro de demonstração validado (Must) — QA

*Como avaliador, quero um roteiro curto que prove as regras principais funcionando.*

- **Dado** o seed e a data de referência 15/10/2026, **quando** sigo os 6 passos do roteiro, **então** cada resultado descrito acontece exatamente.

### H6.4 Uso de IA completo (Must) — Desenvolvedor

*Como avaliador, quero saber como a IA foi usada e o que foi revisado por humano.*

- A seção cita onde a IA errou ou foi corrigida e o que foi revisado manualmente.

### H6.5 Revisão final do P.O. (Must)

- O P.O. revisa o README contra os critérios de aceite das Fases 1–3 e confirma que as limitações descritas correspondem ao que foi entregue.

## Fora de escopo (Won't)

Documentação de API gerada à parte além do necessário, vídeos, diagramas extensos.

---

## Handoff — Para o Tech Lead

**Preencher no README:**

- Como executar.
- Stack e arquitetura.
- A parte "o que foi feito" de Segurança.
- Qualidade e padrões (incluindo os hooks).
- Comandos da automação.
- As limitações técnicas.

**Regras:**

- Seguir a skill `documentacao-decisoes`.
- Não alterar as seções de produto sem falar com o P.O.

**Pronto quando:** um clone limpo roda seguindo apenas o README.

**Não fazer:**

- Colar credenciais ou valores reais de ambiente.
- Descrever como feito algo que não foi implementado.

## Handoff — Para o QA

**Validar:** os 6 passos do roteiro de demonstração e a tabela de resultado esperado do README, contra o sistema rodando com o seed.

**Pronto quando:** todos os passos batem, ou as divergências estão registradas para o P.O. decidir.
