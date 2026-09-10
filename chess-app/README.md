# Xadrez de Bolso

App de xadrez em português, num único arquivo HTML, feito para rodar no iPhone
**sem passar pela App Store**. Funciona em qualquer navegador moderno, no
celular ou no computador.

## O que tem dentro

**Jogar** — partida completa contra o computador (quatro níveis) ou dois
jogadores no mesmo aparelho. Regras completas: roque, *en passant*, promoção,
xeque, xeque-mate, afogamento, repetição tripla, regra dos 50 lances e material
insuficiente. Tem dica, voltar lance, girar tabuleiro, peças capturadas com o
saldo de material e planilha da partida em notação portuguesa (R D T B C).

**Relógio** — opcional. Sem relógio, 3+2, 10+5 ou 25+10 (minutos + incremento
por lance). O relógio de cada lado só corre na vez dele, pausa quando você sai
da aba e dá um lance de cortesia para os dois no começo. Quem cai no tempo
perde — a não ser que o adversário não tenha material para dar mate, e aí é
empate, como manda a regra.

**Análise** — ao fim da partida (ou durante ela), o app confere lance a lance e
mostra um gráfico da avaliação, quantos lances bons e quantos erros cada lado
fez, e os momentos decisivos com o lance que era melhor. Arraste o dedo pelo
gráfico para percorrer a partida no tabuleiro. É uma análise rasa, de dois
lances à frente: acha os erros grandes, não julga sutilezas.

**Aprender** — onze lições curtas, na ordem, do tabuleiro ao xeque-mate. Cada
uma traz tabuleiros de verdade: uns em que você toca numa peça e vê todos os
lances legais dela, outros que avançam lance a lance (roque, *en passant*,
mate do pastor, Abertura Italiana, mate da escada).

**Táticas** — treze exercícios verificados: mates em 1, mates em 2 (incluindo a
herança de Philidor e o mate de Anastasia) e táticas de ganho material (garfo de
cavalo, garfo de peão, espeto). O app aceita **qualquer** lance que force o mate,
não só o da solução guardada.

A partida em andamento, os ajustes, as lições concluídas e os exercícios
resolvidos ficam salvos no próprio aparelho.

## Instalar no iPhone

1. Abra o link do app no **Safari**.
2. Toque no botão **Compartilhar** (o quadrado com a seta para cima).
3. Escolha **Adicionar à Tela de Início** e confirme.

Pronto: vira um ícone na tela de início e abre em tela cheia, sem barra de
navegador. Nada de App Store, nada de conta.

Sem link? Também dá para abrir o arquivo `index.html` direto — mande-o para si
mesmo (AirDrop, e-mail, iCloud Drive) e abra pelo app Arquivos. Nesse modo ele
funciona **offline por completo**; só as fontes vêm da internet, e sem elas o
app usa as fontes do sistema.

## Rodar localmente

Não tem build nem dependência. As peças são desenhadas em SVG dentro do próprio
arquivo, então nada depende das fontes do sistema. Abra `index.html` no
navegador, ou sirva a pasta:

```bash
python3 -m http.server 8000    # depois: http://localhost:8000/chess-app/
```

## Testes

O motor de xadrez é conferido por *perft* (contagem exaustiva de lances legais)
em cinco posições de referência, incluindo a *Kiwipete*, até 197.281 posições.
Os testes também provam, por busca exaustiva, que cada exercício de mate é
mesmo mate no número de lances anunciado, que cada tática de material é o melhor
lance da posição com margem, e que toda posição e demonstração das lições é
legal.

```bash
cd chess-app && node test/engine.test.mjs
```

## Como está organizado

`index.html` é auto-contido e tem quatro blocos marcados por comentários, que os
testes leem diretamente do arquivo:

| bloco | o que faz |
| --- | --- |
| `/*ENGINE-*/` | tabuleiro 0x88, geração de lances, regras, FEN, notação |
| `/*AI-*/` | negamax com poda alfa-beta, ordenação MVV-LVA, quiescência, tabelas de casas |
| `/*DATA-*/` | conteúdo das lições e dos exercícios |
| `/*UI-*/` | peças em SVG, tabuleiro, partida, relógio, análise, lições, táticas |
