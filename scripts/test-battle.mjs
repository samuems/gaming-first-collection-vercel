// Quick validation of battle engine logic (run with: node scripts/test-battle.mjs)
const ORDER = ['Air','Earth','Lightning','Water','Fire','Ice','Nature','Light','Shadow'];
const RAW = [
  [0,3,2,1,1,-1,-1,-2,-3],[-3,0,3,2,1,1,-1,-1,-2],[-2,-3,0,3,2,1,1,-1,-1],
  [-1,-2,-3,0,3,2,1,1,-1],[-1,-1,-2,-3,0,3,2,1,1],[1,-1,-1,-2,-3,0,3,2,1],
  [1,1,-1,-1,-2,-3,0,3,2],[2,1,1,-1,-1,-2,-3,0,3],[3,2,1,1,-1,-1,-2,-3,0],
];
const IDX = Object.fromEntries(ORDER.map((a,i)=>[a,i]));
const bonus = (a,d) => Math.max(0, RAW[IDX[a]][IDX[d]]);

function simulateRound(n, p, o, pTI, oTI) {
  const pAff = bonus(p.affinity, o.affinity);
  const oAff = bonus(o.affinity, p.affinity);
  const pScore = p.power + pAff;
  const oScore = o.power + oAff;
  let winner;
  if      (pScore > oScore) winner = 'player';
  else if (oScore > pScore) winner = 'opponent';
  else if (p.speed > o.speed) winner = 'player';
  else if (o.speed > p.speed) winner = 'opponent';
  else if (pTI > oTI) winner = 'player';
  else if (oTI > pTI) winner = 'opponent';
  else winner = p.id < o.id ? 'player' : 'opponent';
  return { n, pScore, oScore, pAff, oAff, winner };
}

const P = [
  { id:'p1', name:'Cinder Fox',  affinity:'Fire',    power:18, speed:15 },
  { id:'p2', name:'Flame Bear',  affinity:'Fire',    power:14, speed:10 },
  { id:'p3', name:'Ash Wing',    affinity:'Air',     power:12, speed:14 },
  { id:'p4', name:'Glow Moth',   affinity:'Nature',  power:11, speed:14 },
  { id:'p5', name:'Snow Cub',    affinity:'Ice',     power:12, speed:12 },
];
const O = [
  { id:'o1', name:'Tide Whelp',  affinity:'Water',    power:15, speed:12 },
  { id:'o2', name:'Storm Drake', affinity:'Lightning', power:16, speed:13 },
  { id:'o3', name:'Shadow Wisp', affinity:'Shadow',   power:14, speed:11 },
  { id:'o4', name:'Terra Imp',   affinity:'Earth',    power:13, speed:9  },
  { id:'o5', name:'Frost Pup',   affinity:'Ice',      power:11, speed:13 },
];

const pTI = P.reduce((s,u)=>s+u.speed,0);
const oTI = O.reduce((s,u)=>s+u.speed,0);
console.log(`Team Initiative  Player: ${pTI}  Opponent: ${oTI}\n`);

let pW=0, oW=0;
for (let i=0; i<5; i++) {
  const r = simulateRound(i+1, P[i], O[i], pTI, oTI);
  const tag = r.winner === 'player' ? 'WIN' : 'LOSS';
  console.log(
    `Round ${r.n}: ${P[i].name}(${P[i].affinity}) ${r.pScore}[+${r.pAff}aff]` +
    ` vs ${O[i].name}(${O[i].affinity}) ${r.oScore}[+${r.oAff}aff]` +
    ` -> ${tag}`
  );
  if (r.winner === 'player') pW++; else oW++;
}
console.log(`\nFinal: Player ${pW}-${oW} Opponent  =>  ${pW>=3 ? 'PLAYER WINS' : 'OPPONENT WINS'}`);

// Determinism check: same input always same output
const r1 = simulateRound(1, P[0], O[0], pTI, oTI);
const r2 = simulateRound(1, P[0], O[0], pTI, oTI);
console.log(`\nDeterminism check: ${r1.winner === r2.winner ? 'PASS' : 'FAIL'}`);
