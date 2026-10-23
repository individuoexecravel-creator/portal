# Portal

Arquivo de escândalos políticos, feito com Hugo e publicado pelo GitHub Pages em
https://individuoexecravel-creator.github.io/portal/

## Estrutura

- `content/nova-republica/` → casos brasileiros (tarja vermelha)
- `content/internacional/` → casos internacionais (tarja amarela)
- `static/img/capas/` → capa grande de cada caso (página da matéria)
- `static/img/thumbs/` → versão menor da mesma capa (cards da página inicial)
- `hugo.toml` → nome do site, slogan e menu
- `data/teia/` → dados da Teia da Nova República (ver abaixo)
- `layouts/_default/teia.html` → página da Teia

## Publicar um caso novo

1. Coloque a imagem sem texto do caso em `static/img/capas/` e uma cópia menor (cerca de 560 px) com o **mesmo nome** em `static/img/thumbs/`.
2. Em `content/nova-republica/` (ou `content/internacional/`), clique em **Add file → Create new file**, dê um nome como `nome-do-caso.md` e use este modelo:

```markdown
---
title: "Título do caso"
date: 2026-10-20
description: "Linha fina: o resumo que aparece embaixo do título e nos cards."
image: "nome-do-caso.jpg"
periodo: "1990–1992"
ficha:
  - item: "Período"
    valor: "..."
  - item: "Personagens centrais"
    valor: "..."
  - item: "Desfecho"
    valor: "..."
---

Texto da matéria. Use `## Subtítulo` para abrir seções.

<h2>Linha do tempo</h2>

<ul class="linha-tempo">
<li><strong>Data</strong> · O que aconteceu.</li>
</ul>
```

3. Clique em **Commit changes**. Em um ou dois minutos o site atualiza.

O caso mais recente (pela `date`) aparece em destaque na página inicial.

## Teia da Nova República

A página `/teia/` é um grafo 3D que liga os casos pelas pessoas, empresas, órgãos, partidos e lugares em comum. Ela se monta sozinha a partir de `data/teia/`:

- `data/teia/entidades.yaml` → cadastro de pessoas, empresas, órgãos, partidos e lugares (cada um com um `id` único)
- `data/teia/vinculos.yaml` → ligações diretas entre entidades (parentesco, cargo, sociedade)
- `data/teia/casos/nome-do-caso.yaml` → um arquivo por caso, **com o mesmo nome da matéria `.md`**

### Pôr um caso novo na teia

Junto com a matéria `content/nova-republica/nome-do-caso.md`, suba `data/teia/casos/nome-do-caso.yaml`:

```yaml
caso: nome-do-caso            # igual ao nome do arquivo .md
nome: Nome curto do caso
periodo: [2010, 2014]         # ano de início e ano do desfecho
resumo: Uma ou duas frases sobre o esquema.
desfecho: O que a Justiça decidiu.
novas_entidades:              # só quem ainda não está em entidades.yaml
  - id: fulano-de-tal
    nome: Fulano de Tal
    tipo: pessoa              # pessoa | org | estado | partido | lugar
    desc: Quem é, em uma frase.
envolvidos:                   # use os ids de entidades.yaml para ligar aos outros casos
  - id: fulano-de-tal
    tipo: condenado           # condenado | cassado | delator | anulado | citado | agente | vinculo
    rel: 8 anos por corrupção
  - id: alberto-youssef
    tipo: citado
    rel: Operador citado na denúncia
relacionados:                 # outros casos ligados diretamente
  - caso: lava-jato
    rel: Desdobramento da Lava Jato
vinculos:                     # opcional: ligações entre duas entidades
  - de: fulano-de-tal
    para: sergio-cabral
    tipo: vinculo
    rel: Secretário do governo
```

Quem já existe em `entidades.yaml` é reaproveitado pelo `id`, e é isso que liga o caso novo aos antigos. A matéria ganha automaticamente o link "Ver as ligações deste caso na Teia".

Regras de tipo: `condenado` só com condenação; `cassado` para cassação ou renúncia para escapar dela; `anulado` para absolvição, prescrição ou condenação anulada; `citado` para quem foi acusado ou investigado sem condenação. Na dúvida, use `citado` ou `vinculo`.

## Mudar o nome do site

Edite `title` e `slogan` em `hugo.toml`.
