# Portal

Arquivo de escândalos políticos, feito com Hugo e publicado pelo GitHub Pages em
https://individuoexecravel-creator.github.io/portal/

## Estrutura

- `content/nova-republica/` → casos brasileiros (tarja vermelha)
- `content/internacional/` → casos internacionais (tarja amarela)
- `static/img/capas/` → capa grande de cada caso (página da matéria)
- `static/img/thumbs/` → versão menor da mesma capa (cards da página inicial)
- `hugo.toml` → nome do site, slogan e menu

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

## Mudar o nome do site

Edite `title` e `slogan` em `hugo.toml`.
