# Sistema de design do Portal (v2)

Guia rápido para manter o visual consistente quando o site crescer. Os valores ficam no começo de `assets/css/style.css`, em `:root`.

## Princípios

1. **A cor tem significado.** Vermelho, laranja, amarelo, cinza e bege dizem como um caso terminou para cada pessoa. Dourado marca os casos internacionais. Fora isso, o site é preto, papel e cinza.
2. **Menos caixas, mais respiro.** Fundo e borda em volta só para o que é controle (busca, filtros, seletor) ou fica por cima de outra coisa (menu, busca, painéis da Teia e do globo). Conteúdo se separa por linhas finas e espaço.
3. **Uma única voz em caixa alta.** Só o nome dos casos usa Archivo estreita, pesada e em maiúsculas, como nos cards das redes. Todo o resto vai em texto normal.
4. **Acessível por padrão.** Contraste mínimo de 4,5:1 para texto e 3:1 para bordas de controles. Área de toque de 44 px. Foco sempre visível.

## Tokens

| Grupo | Token | Valor | Uso |
|---|---|---|---|
| Base | `--breu` | `#000` | Fundo da página |
| | `--carvao` / `--carvao-2` | `#161616` / `#1f1f1f` | Superfícies de controles e sobreposições |
| | `--papel` | `#ece7df` | Texto principal |
| | `--papel-2` | `#cfc9c0` | Texto secundário |
| | `--chumbo` | `#a39e96` | Rótulos e notas |
| Linhas | `--linha` | `#2e2e2e` | Divisórias decorativas |
| | `--linha-ui` | `#6b665f` | Borda de botões, chips e seletores (3:1) |
| Seções | `--nova-republica` | `#e0242e` | Barras, marcas e preenchimentos |
| | `--sangue-texto` | `#ff5c63` | Texto em vermelho (4,5:1 no preto) |
| | `--internacional` | `#e8ae0c` | Casos de fora do Brasil |
| | `--acento` / `--acento-texto` | depende da seção | Use `--acento-texto` sempre que for texto |
| Desfechos | `--d-condenado` … `--d-vinculo` | mesmas cores da Teia | Placar, Quem é quem, Pessoas |
| Valores | `--v-desvio`, `--v-propina`, `--v-apreendido`, `--v-devolvido` | vermelho, roxo, verde, azul | Página Quanto custou (paleta validada para daltonismo) |
| Espaço | `--e1` … `--e9` | 4, 8, 12, 16, 24, 32, 48, 64, 96 px | Margens e espaçamentos |
| Raio | `--r1`, `--r2`, `--r-pilula` | 4 px, 8 px, 999 px | Miniaturas; fotos, campos e botões; chips e seletores |
| Toque | `--alvo` | 44 px | Altura mínima de botões, chips e seletores |
| Fontes | `--sans`, `--serif` | Archivo, Newsreader | Interface e títulos; texto corrido |

## Componentes

| Componente | Classe | Quando usar |
|---|---|---|
| Botão principal | `.botao` | Uma ação por bloco: "Ler o caso", "Limpar filtros" |
| Botão secundário | `.botao-fino` | Ações de apoio: "Compartilhar" |
| Chip | `.chip` | Filtros que se combinam (época, desfecho) |
| Seletor | `.seletor` + `.seletor-op` | Brasil / fora do Brasil em todas as guias. Usa `aria-pressed` (filtro), `aria-selected` (abas) ou `aria-current` (links) |
| Placar | `partial "placar.html"` | Barra de desfecho de um caso; `completo: true` mostra a legenda |
| Caso em linha | `partial "linha-caso.html"` | Listas cronológicas (Para começar, Linha do tempo) |
| Card de caso | `partial "card.html"` | Grades com foto (Casos, seções) |
| Dinheiro | `partial "dinheiro.html"` | Qualquer valor em R$, US$ ou €; `longo: true` mostra o número completo |
| Ícone | `partial "icone.html" "nome"` | Traço de 1,75 em grade de 24; sempre com texto ao lado ou `aria-label` |

## Antes de publicar algo novo

- Texto colorido usa `--acento-texto` ou `--sangue-texto`, nunca `--nova-republica` direto.
- Botão só com ícone precisa de `aria-label`.
- Nada interativo com menos de 44 px de altura.
- Se for pôr uma borda em volta de um bloco de conteúdo, tente uma linha em cima e espaço antes.

## Campos de cada caso (front matter)

Além de `title`, `date`, `description`, `image`, `periodo`, `ficha` e `valores`, cada caso pode ter:

```yaml
uf: "SP"                 # só casos da Nova República que aconteceram num estado. Sem uf = caso federal no Mapa
justica:                 # alimenta o Tempo da Justiça e o Comparar
  inicio: 1992           # ano em que o esquema começou
  fim: 2016              # ano do desfecho principal. Sem fim = "sem um ano de desfecho"
  desfecho: condenacao   # condenacao, misto, politico, absolvicao, anulacao, arquivado, sem-punicao
  prescrito: true        # opcional: houve prescrição
  anulado: true          # opcional: houve anulação
  nota: "Uma frase sobre o desfecho."
fontes:                  # aparecem no fim da matéria, em "Fontes e leitura complementar"
  - titulo: "Título da reportagem"
    veiculo: "Nome do veículo"
    ano: 2016            # opcional
    url: "https://..."
lastmod: 2026-11-02      # opcional: data da última atualização do texto
correcoes:               # opcional: histórico público de correções
  - data: 2026-11-02
    texto: "O texto dizia X. O correto é Y."
```

## Dados do site

| Arquivo | O que guarda |
|---|---|
| `data/ipca.yaml` | Inflação de cada ano. Atualize `parcial` e `ate` todo mês, e acrescente o ano novo em janeiro |
| `data/glossario.yaml` | Termos do glossário. Na matéria, só a primeira aparição de cada termo ganha a explicação |
| `data/trilhas.yaml` | Trilhas de leitura: lista ordenada de casos por tema |
| `data/brasil_mapa.json` | Contorno dos estados (svg-maps, de Victor Cazanave, CC BY 4.0). Não precisa mexer |

## Conforto de leitura

- Tema claro e tamanho do texto ficam em `localStorage` (`portal-tema`, `portal-escala`). O script no `<head>` do `baseof.html` aplica antes de a página aparecer, sem piscar.
- Tema claro troca os tokens em `html[data-tema="claro"]`. Cores novas devem usar tokens, nunca `#000` ou `#fff` direto. Para texto sobre fundo cor de papel, use `--tinta`; para negrito forte, `--forte`.
- Casos lidos ficam em `portal-lidos`. Qualquer link de caso com `data-lido="<slug>"` ganha o selo "Lido".
- "Ouvir" usa a voz do próprio navegador. Se o navegador não tiver síntese de voz, o botão não aparece.

## Menu do topo

O menu tem quatro entradas: Casos, **Explorar**, **Entender** e Sobre. Explorar e Entender são grupos: no computador abrem uma lista com ícone e descrição; no celular viram seções do menu. Para pôr uma página nova num grupo, crie a entrada em `hugo.toml` com `parent = "explorar"` ou `parent = "entender"`, e preencha `icone` e `desc` em `[menus.main.params]`. O rodapé e o início leem o mesmo menu.
