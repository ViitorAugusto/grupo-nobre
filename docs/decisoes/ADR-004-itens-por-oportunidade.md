# ADR-004 — Vários itens por oportunidade

**Status:** Aceito

## Contexto

Nos dados do case, cada oportunidade tem um único brinde. Na venda B2B de brindes, um kit corporativo costuma ter vários.

## Opções consideradas

1. Um brinde por oportunidade, como nos dados.
2. Vários itens, com o valor da oportunidade calculado pela soma dos itens.
3. Vários itens (brinde + quantidade), com o valor estimado informado pelo vendedor.

## Decisão

Opção 3. A oportunidade tem **1 ou mais itens** (brinde + quantidade). O **valor estimado** continua sendo um campo da oportunidade, informado pelo vendedor.

## Justificativa

O modelo já nasce pronto para kits. Calcular o valor pelos itens exigiria regras de preço que o case não traz.

## Consequências

- A regra "pelo menos 1 item" do case vale sobre a lista de itens.
- Preço unitário e cálculo automático do valor ficam como *Won't*.
