# Xadrez de Bolso

App de xadrez em português, num único arquivo HTML, feito para rodar no iPhone
**sem passar pela App Store**. Funciona em qualquer navegador moderno, no
celular ou no computador.

![aba Jogar, aba Aprender, aba Táticas](#)

## O que tem dentro

**Jogar** — partida completa contra o computador (quatro níveis) ou dois
jogadores no mesmo aparelho. Regras completas: roque, *en passant*, promoção,
xeque, xeque-mate, afogamento, repetição tripla, regra dos 50 lances e material
insuficiente. Tem dica, voltar lance, girar tabuleiro, peças capturadas com o
saldo de material e planilha da partida em notação portuguesa (R D T B C).

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

Não tem build nem dependência. Abra `index.html` no navegador, ou sirva a pasta:

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
| `/*UI-*/` | tabuleiro, controlador da partida, lições, táticas, abas |
