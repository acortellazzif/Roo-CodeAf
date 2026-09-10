/* Verificação do motor: perft em posições de referência + validação
   de todas as posições (FEN) e soluções usadas no app.
   Rodar:  node test/engine.test.mjs   (a partir de chess-app/) */
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.join(dir, "..", "index.html"), "utf8");

function section(start, end) {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < 0) throw new Error("bloco não encontrado: " + start);
  return html.slice(a + start.length, b);
}

const ctx = vm.createContext({ Date, Math, console, JSON });
vm.runInContext(section("/*ENGINE-START*/", "/*ENGINE-END*/"), ctx);
vm.runInContext(section("/*AI-START*/", "/*AI-END*/"), ctx);
let dataSrc = "";
try { dataSrc = section("/*DATA-START*/", "/*DATA-END*/"); } catch { /* ainda não escrito */ }
if (dataSrc) vm.runInContext(dataSrc, ctx);

const {
  fenToState, stateToFen, legalMoves, makeMove, unmakeMove, moveToSan, moveToUci,
  findMoveByUci, inCheck, gameStatus, searchBest, START_FEN,
} = ctx;

let fails = 0, checks = 0;
function ok(cond, label, extra = "") {
  checks++;
  if (!cond) { fails++; console.log("  ✗ " + label + (extra ? "  → " + extra : "")); }
  else console.log("  ✓ " + label);
}

function perft(st, d) {
  if (d === 0) return 1;
  const ms = legalMoves(st);
  if (d === 1) return ms.length;
  let n = 0;
  for (const m of ms) { makeMove(st, m, true); n += perft(st, d - 1); unmakeMove(st); }
  return n;
}

console.log("\nPERFT — contagem de lances legais");
const perftCases = [
  [START_FEN, [20, 400, 8902, 197281], "posição inicial"],
  ["r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1", [48, 2039, 97862], "Kiwipete"],
  ["8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1", [14, 191, 2812, 43238], "final com en passant"],
  ["r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1", [6, 264, 9467], "promoções"],
  ["rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8", [44, 1486, 62379], "posição 5"],
];
for (const [fen, counts, label] of perftCases) {
  for (let d = 0; d < counts.length; d++) {
    const st = fenToState(fen);
    const got = perft(st, d + 1);
    ok(got === counts[d], `${label} · profundidade ${d + 1} = ${counts[d]}`, got !== counts[d] ? "obtido " + got : "");
  }
}

console.log("\nINTEGRIDADE — desfazer restaura a posição");
{
  const st = fenToState("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
  const before = stateToFen(st);
  let bad = null;
  for (const m of legalMoves(st)) {
    makeMove(st, m); unmakeMove(st);
    if (stateToFen(st) !== before) { bad = moveToUci(m); break; }
  }
  ok(!bad, "make/unmake preserva o FEN em todos os lances", bad || "");
}

/* mate forçado em `plies` meios-lances (o lado da vez começa) */
function mateIn(st, plies) {
  if (plies <= 0) return null;
  for (const m of legalMoves(st)) {
    makeMove(st, m, true);
    const replies = legalMoves(st);
    let good;
    if (!replies.length) good = inCheck(st, st.turn);
    else if (plies === 1) good = false;
    else {
      good = true;
      for (const r of replies) {
        makeMove(st, r, true);
        const deeper = mateIn(st, plies - 2);
        unmakeMove(st);
        if (!deeper) { good = false; break; }
      }
    }
    unmakeMove(st);
    if (good) return m;
  }
  return null;
}
function allMateMoves(st, plies) {
  const out = [];
  for (const m of legalMoves(st)) {
    makeMove(st, m, true);
    let good;
    const replies = legalMoves(st);
    if (!replies.length) good = inCheck(st, st.turn);
    else if (plies === 1) good = false;
    else {
      good = true;
      for (const r of replies) {
        makeMove(st, r, true);
        const d = mateIn(st, plies - 2);
        unmakeMove(st);
        if (!d) { good = false; break; }
      }
    }
    unmakeMove(st);
    if (good) out.push(moveToUci(m));
  }
  return out;
}

if (ctx.PUZZLES) {
  console.log("\nEXERCÍCIOS — cada solução é verificada de verdade");
  ctx.PUZZLES.forEach((p, i) => {
    const label = `#${i + 1} ${p.title}`;
    let st;
    try { st = fenToState(p.fen); } catch (e) { ok(false, label + " · FEN", e.message); return; }
    const first = findMoveByUci(st, p.line[0]);
    if (!first) { ok(false, label + " · lance da solução é legal", p.line[0]); return; }
    if (p.mateIn) {
      const plies = p.mateIn * 2 - 1;
      const solutions = allMateMoves(st, plies);
      ok(solutions.includes(p.line[0]),
        `${label} · ${p.line[0]} dá mate em ${p.mateIn}`,
        solutions.length ? "mates encontrados: " + solutions.join(", ") : "nenhum mate nessa profundidade");
      if (solutions.length > 1) console.log(`    · ${label}: outras soluções aceitas — ${solutions.join(", ")}`);
      /* a linha guardada precisa ser jogável até o fim */
      let playable = true, why = "";
      const st2 = fenToState(p.fen);
      for (const u of p.line) {
        const mv = findMoveByUci(st2, u);
        if (!mv) { playable = false; why = "lance ilegal: " + u; break; }
        makeMove(st2, mv);
      }
      if (playable) {
        const s = gameStatus(st2);
        if (!(s.over && s.kind === "mate")) { playable = false; why = "a linha não termina em mate"; }
      }
      ok(playable, `${label} · linha completa termina em xeque-mate`, why);
    } else {
      /* tática de ganho material: a solução tem de ser claramente a melhor */
      const scores = legalMoves(st).map((m) => {
        makeMove(st, m, true);
        const s = -ctx.searchBest(st, 3, 8000, true, 0).score;
        unmakeMove(st);
        return { u: moveToUci(m), s };
      }).sort((a, b) => b.s - a.s);
      const solved = scores.find((x) => x.u === p.line[0]);
      const runnerUp = scores.find((x) => x.u !== p.line[0]);
      const margin = solved && runnerUp ? solved.s - runnerUp.s : -1;
      ok(scores[0] && scores[0].u === p.line[0],
        `${label} · ${p.line[0]} é o melhor lance da posição`,
        "melhores: " + scores.slice(0, 3).map((x) => x.u + " " + x.s).join(", "));
      ok(margin >= 150,
        `${label} · ganha ${(margin / 100).toFixed(1)} sobre a segunda opção`,
        runnerUp ? runnerUp.u + " " + runnerUp.s : "");
      let playable = true;
      const st3 = fenToState(p.fen);
      for (const u of p.line) {
        const mv = findMoveByUci(st3, u);
        if (!mv) { playable = false; break; }
        makeMove(st3, mv);
      }
      ok(playable, `${label} · linha completa é legal`);
    }
  });
}

if (ctx.LESSONS) {
  console.log("\nLIÇÕES — posições e demonstrações");
  let nBoards = 0, nDemo = 0, bad = [];
  for (const l of ctx.LESSONS) {
    for (const blk of l.blocks) {
      if (blk.fen) {
        nBoards++;
        let st;
        try { st = fenToState(blk.fen); } catch (e) { bad.push(l.title + ": " + e.message); continue; }
        if (blk.moves) {
          nDemo++;
          for (const u of blk.moves) {
            const mv = findMoveByUci(st, u);
            if (!mv) { bad.push(`${l.title}: lance ilegal ${u} em ${stateToFen(st)}`); break; }
            makeMove(st, mv);
          }
        }
        if (blk.marks) {
          for (const s of blk.marks) {
            if (!/^[a-h][1-8]$/.test(s)) bad.push(`${l.title}: casa marcada inválida ${s}`);
          }
        }
      }
    }
  }
  ok(bad.length === 0, `${nBoards} posições válidas, ${nDemo} demonstrações jogáveis`, bad.slice(0, 5).join(" | "));
}

console.log(`\n${fails ? "✗" : "✓"} ${checks - fails}/${checks} verificações passaram\n`);
process.exit(fails ? 1 : 0);
