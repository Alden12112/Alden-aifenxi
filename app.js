const ESPN = {
  worldcup: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260611-20260719&limit=200",
  nba: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20260611-20260625&limit=100"
};

const ratings = {
  Spain: 94, France: 93, England: 91, Brazil: 90, Argentina: 90, Portugal: 88, Germany: 87,
  Netherlands: 86, Belgium: 84, Uruguay: 83, Croatia: 82, Colombia: 81, Switzerland: 80,
  Morocco: 79, USA: 78, Japan: 78, Mexico: 77, Senegal: 77, Sweden: 76, Ecuador: 76,
  Austria: 75, Norway: 74, "South Korea": 74, Czechia: 73, Turkiye: 73, Paraguay: 72,
  Australia: 71, Canada: 70, Egypt: 70, Iran: 69, Ghana: 69, Scotland: 68,
  "South Africa": 66, "Bosnia-Herzegovina": 66, Tunisia: 66, Qatar: 62,
  "San Antonio Spurs": 91, "New York Knicks": 89, "Boston Celtics": 88, "Denver Nuggets": 87
};

const fallbackMatches = {
  worldcup: [
    makeFallback("worldcup", "Group", "2026-06-11T19:00:00Z", "Mexico", "South Africa", "Mexico City Stadium", "DraftKings", [-235, 340, 750], "MEX -235"),
    makeFallback("worldcup", "Group", "2026-06-12T02:00:00Z", "South Korea", "Czechia", "Guadalajara Stadium", "DraftKings", [160, 210, 175], "平衡盘口"),
    makeFallback("worldcup", "Group", "2026-06-12T19:00:00Z", "Canada", "Bosnia-Herzegovina", "Toronto Stadium", "DraftKings", [-115, 270, 330], "CAN -115")
  ],
  nba: [
    makeFallback("nba", "NBA Finals", "2026-06-14T00:30:00Z", "San Antonio Spurs", "New York Knicks", "Frost Bank Center", "ESPN Bet", [-220, null, 180], "SA -5.5 · O/U 216.5"),
    makeFallback("nba", "NBA Finals", "2026-06-17T00:30:00Z", "New York Knicks", "San Antonio Spurs", "Madison Square Garden", "ESPN Bet", [-120, null, 100], "如有需要"),
    makeFallback("nba", "NBA Finals", "2026-06-20T00:30:00Z", "San Antonio Spurs", "New York Knicks", "Frost Bank Center", "ESPN Bet", [-135, null, 115], "如有需要")
  ]
};

const $ = id => document.querySelector(id);
const els = {
  list: $("#matchList"), search: $("#searchInput"), date: $("#dateFilter"), stage: $("#stageFilter"),
  marketOnly: $("#marketOnly"), hideEnded: $("#hideEnded"), refreshBtn: $("#refreshBtn"),
  refreshStatus: $("#refreshStatus"), tabs: [...document.querySelectorAll(".sport-tab")],
  viewTabs: [...document.querySelectorAll(".view-tab")], viewPanels: [...document.querySelectorAll(".view-panel")],
  selectedStage: $("#selectedStage"), selectedTitle: $("#selectedTitle"), teamAName: $("#teamAName"),
  teamBName: $("#teamBName"), teamAGoals: $("#teamAGoals"), teamBGoals: $("#teamBGoals"),
  teamAProbLabel: $("#teamAProbLabel"), middleProbLabel: $("#middleProbLabel"), teamBProbLabel: $("#teamBProbLabel"),
  teamAProb: $("#teamAProb"), drawProb: $("#drawProb"), teamBProb: $("#teamBProb"),
  barA: $("#barA"), barD: $("#barD"), barB: $("#barB"), oddsALabel: $("#oddsALabel"),
  oddsDLabel: $("#oddsDLabel"), oddsBLabel: $("#oddsBLabel"), oddsA: $("#oddsA"), oddsD: $("#oddsD"), oddsB: $("#oddsB"),
  aiConfidence: $("#aiConfidence"), marketEdge: $("#marketEdge"), riskLevel: $("#riskLevel"),
  paceLabel: $("#paceLabel"), paceValue: $("#paceValue"), modelTag: $("#modelTag"), factorList: $("#factorList"),
  analysis: $("#analysisText"), searchBtn: $("#webSearchBtn"), attack: $("#attackSlider"), draw: $("#drawSlider"),
  attackOut: $("#attackOut"), drawOut: $("#drawOut"), headlineMatch: $("#headlineMatch"), headlineMeta: $("#headlineMeta"),
  heroTeamA: $("#heroTeamA"), heroTeamB: $("#heroTeamB"), heroScore: $("#heroScore"), clock: $("#liveClock"),
  nextMatchName: $("#nextMatchName"), nextCountdown: $("#nextCountdown"), sixCountdown: $("#sixCountdown"),
  nextEndTime: $("#nextEndTime"), selectedStartTime: $("#selectedStartTime"), selectedEndTime: $("#selectedEndTime"),
  selectedCountdown: $("#selectedCountdown")
};

const state = {
  sport: "worldcup",
  matches: { worldcup: fallbackMatches.worldcup, nba: fallbackMatches.nba },
  selectedKey: null,
  loading: false
};

function makeFallback(sport, stage, iso, home, away, venue, provider, moneyline, details) {
  return { key: `${sport}-${home}-${away}-${iso}`, sport, stage, home, away, venue, start: new Date(iso), completed: false, statusText: "未开赛", odds: { provider, moneyline, details }, score: null };
}

function gameMinutes(match) {
  return match.sport === "nba" ? 170 : 135;
}

function endTime(match) {
  return new Date(match.start.getTime() + gameMinutes(match) * 60000);
}

function isEnded(match) {
  return match.completed || Date.now() > endTime(match).getTime();
}

function fmtMY(date, withDate = true) {
  return new Intl.DateTimeFormat("zh-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    month: withDate ? "short" : undefined,
    day: withDate ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function fmtCountdown(target) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return "已经开始";
  const total = Math.floor(diff / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分`;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function nextSixAM() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const y = parts.find(p => p.type === "year").value;
  const m = parts.find(p => p.type === "month").value;
  const d = parts.find(p => p.type === "day").value;
  let target = new Date(`${y}-${m}-${d}T06:00:00+08:00`);
  if (target <= now) target = new Date(target.getTime() + 86400000);
  return target;
}

function americanToProb(odds) {
  const n = Number(String(odds).replace("+", ""));
  if (!Number.isFinite(n) || n === 0) return null;
  return n < 0 ? Math.abs(n) / (Math.abs(n) + 100) : 100 / (n + 100);
}

function normalize(values) {
  const total = values.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  return total ? values.map(v => (Number.isFinite(v) ? v : 0) / total) : values.map(() => 0);
}

function decimalFromAmerican(odds) {
  const n = Number(String(odds).replace("+", ""));
  if (!Number.isFinite(n)) return "--";
  return n < 0 ? (1 + 100 / Math.abs(n)).toFixed(2) : (1 + n / 100).toFixed(2);
}

function decimalFromProb(prob) {
  return prob > 0 ? (1 / prob).toFixed(2) : "--";
}

function pct(x) {
  return `${Math.round((x || 0) * 100)}%`;
}

function parseOdds(comp, sport) {
  const odds = comp?.odds?.[0];
  if (!odds) return null;
  const provider = odds.provider?.displayName || odds.provider?.name || "Market";
  const ml = odds.moneyline || {};
  const home = ml.home?.close?.odds ?? ml.home?.open?.odds;
  const away = ml.away?.close?.odds ?? ml.away?.open?.odds;
  const draw = sport === "worldcup" ? (ml.draw?.close?.odds ?? ml.draw?.open?.odds ?? odds.drawOdds?.moneyLine) : null;
  const spread = odds.pointSpread?.home?.close?.line ?? odds.pointSpread?.home?.open?.line;
  const totalLine = odds.total?.over?.close?.line ?? odds.total?.over?.open?.line ?? "";
  return {
    provider,
    moneyline: sport === "worldcup" ? [home, draw, away] : [home, null, away],
    details: odds.details || [spread, totalLine].filter(Boolean).join(" · "),
    overUnder: odds.overUnder || Number(String(totalLine).replace(/[^\d.]/g, ""))
  };
}

function mapEspnEvent(event, sport) {
  const comp = event.competitions?.[0] || {};
  const teams = comp.competitors || [];
  const home = teams.find(t => t.homeAway === "home") || teams[0] || {};
  const away = teams.find(t => t.homeAway === "away") || teams[1] || {};
  const status = event.status?.type || {};
  return {
    key: `${sport}-${event.id}`,
    sport,
    stage: sport === "nba" ? "NBA Finals" : (new Date(event.date) < new Date("2026-06-28T00:00:00Z") ? "Group" : "Knockout"),
    home: home.team?.displayName || "Home",
    away: away.team?.displayName || "Away",
    venue: comp.venue?.fullName || "Venue TBA",
    start: new Date(event.date),
    completed: Boolean(status.completed),
    statusText: status.shortDetail || status.description || "未开赛",
    odds: parseOdds(comp, sport),
    score: home.score || away.score ? [Number(home.score || 0), Number(away.score || 0)] : null
  };
}

async function fetchSport(sport) {
  const res = await fetch(ESPN[sport], { cache: "no-store" });
  if (!res.ok) throw new Error(`${sport} ${res.status}`);
  const json = await res.json();
  return (json.events || []).map(event => mapEspnEvent(event, sport)).sort((a, b) => a.start - b.start);
}

async function refreshData(showStatus = true) {
  if (state.loading) return;
  state.loading = true;
  if (showStatus) els.refreshStatus.textContent = "正在联网刷新赛程、开赛时间和市场赔率...";
  try {
    const [worldcup, nba] = await Promise.all([fetchSport("worldcup"), fetchSport("nba")]);
    if (worldcup.length) state.matches.worldcup = worldcup;
    if (nba.length) state.matches.nba = nba;
    els.refreshStatus.textContent = `已更新：世界杯 ${state.matches.worldcup.length} 场，NBA ${state.matches.nba.length} 场 · ${fmtMY(new Date(), false)}`;
  } catch (err) {
    els.refreshStatus.textContent = `联网刷新失败，正在使用备用数据。${String(err).replace("Error: ", "")}`;
  } finally {
    state.loading = false;
    renderAll();
  }
}

function marketProbs(match) {
  const ml = match.odds?.moneyline;
  if (!ml) return null;
  const raw = ml.map(americanToProb);
  if (match.sport === "nba" && raw[0] && raw[2]) {
    const p = normalize([raw[0], raw[2]]);
    return [p[0], 0, p[1]];
  }
  if (match.sport === "worldcup" && raw[0] && raw[1] && raw[2]) return normalize(raw);
  return null;
}

function poisson(k, lambda) {
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / fact;
}

function model(match) {
  const market = marketProbs(match);
  const ra = ratings[match.home] ?? 70;
  const rb = ratings[match.away] ?? 70;
  if (match.sport === "nba") {
    const ratingHome = 1 / (1 + Math.exp(-(ra - rb + 2) / 7));
    const home = market ? market[0] * .72 + ratingHome * .28 : ratingHome;
    const total = Number(match.odds?.overUnder) || 216;
    const margin = Math.round((home - .5) * 18);
    return { probs: [home, Math.min(.18, Math.abs(home - .5) * .55 + .06), 1 - home], score: [Math.round(total / 2 + margin / 2), Math.round(total / 2 - margin / 2)], market, total, ratings: [ra + 2, rb] };
  }

  const attackBoost = Number(els.attack.value);
  const drawBoost = Number(els.draw.value);
  const diff = (ra - rb) / 18;
  const lambdaA = Math.max(.25, (1.28 + diff * .46) * attackBoost);
  const lambdaB = Math.max(.25, (1.12 - diff * .42) * attackBoost);
  let winA = 0, draw = 0, winB = 0, best = { a: 0, b: 0, p: 0 };
  for (let a = 0; a <= 7; a++) {
    for (let b = 0; b <= 7; b++) {
      let p = poisson(a, lambdaA) * poisson(b, lambdaB);
      if (a === b) p *= drawBoost;
      if (a > b) winA += p;
      if (a === b) draw += p;
      if (a < b) winB += p;
      if (p > best.p) best = { a, b, p };
    }
  }
  const base = normalize([winA, draw, winB]);
  const probs = market ? normalize(base.map((p, i) => p * .35 + market[i] * .65)) : base;
  return { probs, score: [best.a, best.b], market, lambdas: [lambdaA, lambdaB], ratings: [ra, rb] };
}

function intelligence(match, result) {
  const [pa, pm, pb] = result.probs;
  const gap = Math.abs(pa - pb);
  const confidence = Math.round(Math.min(94, Math.max(48, Math.max(pa, pb, match.sport === "worldcup" ? pm : 0) * 100 + gap * 25)));
  const risk = gap < .08 ? "高" : gap < .18 ? "中" : "低";
  const edge = result.market ? `${Math.round((pa - result.market[0]) * 100)} pts` : "无市场";
  const pace = match.sport === "nba" ? `${Math.round(result.total || 216)} 总分` : `${((result.lambdas?.[0] || 1.1) + (result.lambdas?.[1] || 1.1)).toFixed(2)} xG`;
  return { confidence, risk, edge, pace };
}

function filteredMatches() {
  const q = els.search.value.trim().toLowerCase();
  return state.matches[state.sport].filter(m => {
    const text = `${m.home} ${m.away} ${m.venue} ${m.stage}`.toLowerCase();
    return text.includes(q)
      && (els.date.value === "all" || fmtMY(m.start).startsWith(els.date.value))
      && (els.stage.value === "all" || m.stage.toLowerCase().includes(els.stage.value.toLowerCase()))
      && (!els.marketOnly.checked || Boolean(m.odds?.moneyline))
      && (!els.hideEnded.checked || !isEnded(m));
  });
}

function selectedMatch() {
  return state.matches[state.sport].find(m => m.key === state.selectedKey) || filteredMatches()[0] || state.matches[state.sport][0];
}

function renderDates() {
  const current = els.date.value || "all";
  const dates = [...new Set(state.matches[state.sport].filter(m => !els.hideEnded.checked || !isEnded(m)).map(m => fmtMY(m.start).split(" ")[0]))];
  els.date.innerHTML = `<option value="all">全部日期</option>${dates.map(d => `<option>${d}</option>`).join("")}`;
  els.date.value = dates.includes(current) ? current : "all";
}

function renderList() {
  const data = filteredMatches();
  if (!data.find(m => m.key === state.selectedKey)) state.selectedKey = data[0]?.key || null;
  els.list.innerHTML = data.map(m => {
    const r = model(m);
    const s = r.score;
    return `<button class="match-card ${m.key === state.selectedKey ? "active" : ""}" data-key="${m.key}">
      <div>
        <div class="teams"><span>${m.home}</span><small>vs</small><span>${m.away}</span></div>
        <div class="meta">${m.stage} · ${m.venue}</div>
        <div class="mini">MYT ${fmtMY(m.start)} · 预计结束 ${fmtMY(endTime(m), false)} · 倒计时 ${fmtCountdown(m.start)} · 预测 ${s[0]}-${s[1]}</div>
      </div>
      <span class="pill">${m.odds?.provider || "模型"}</span>
    </button>`;
  }).join("") || `<div class="panel source-box">没有符合条件的未结束比赛。</div>`;
}

function renderPanel() {
  const match = selectedMatch();
  if (!match) return;
  const result = model(match);
  const [pa, pm, pb] = result.probs;
  const score = match.score && isEnded(match) ? match.score : result.score;
  const intel = intelligence(match, result);
  const ml = match.odds?.moneyline || [];

  els.selectedStage.textContent = `${match.stage} · MYT ${fmtMY(match.start)}`;
  els.selectedTitle.textContent = `${match.home} vs ${match.away}`;
  els.selectedStartTime.textContent = fmtMY(match.start);
  els.selectedEndTime.textContent = fmtMY(endTime(match));
  els.selectedCountdown.textContent = fmtCountdown(match.start);
  els.teamAName.textContent = match.home;
  els.teamBName.textContent = match.away;
  els.teamAGoals.textContent = score[0];
  els.teamBGoals.textContent = score[1];
  els.teamAProbLabel.textContent = `${match.home} 赢`;
  els.middleProbLabel.textContent = match.sport === "nba" ? "市场信心" : "平局";
  els.teamBProbLabel.textContent = `${match.away} 赢`;
  els.teamAProb.textContent = pct(pa);
  els.drawProb.textContent = pct(pm);
  els.teamBProb.textContent = pct(pb);
  els.barA.style.width = pct(pa);
  els.barD.style.width = pct(pm);
  els.barB.style.width = pct(pb);

  if (match.sport === "nba") {
    els.oddsALabel.textContent = "主胜";
    els.oddsDLabel.textContent = "让分/总分";
    els.oddsBLabel.textContent = "客胜";
    els.oddsA.textContent = ml[0] ? decimalFromAmerican(ml[0]) : decimalFromProb(pa);
    els.oddsD.textContent = match.odds?.details || "--";
    els.oddsB.textContent = ml[2] ? decimalFromAmerican(ml[2]) : decimalFromProb(pb);
    els.paceLabel.textContent = "总分节奏";
  } else {
    els.oddsALabel.textContent = "1";
    els.oddsDLabel.textContent = "X";
    els.oddsBLabel.textContent = "2";
    els.oddsA.textContent = ml[0] ? decimalFromAmerican(ml[0]) : decimalFromProb(pa);
    els.oddsD.textContent = ml[1] ? decimalFromAmerican(ml[1]) : decimalFromProb(pm);
    els.oddsB.textContent = ml[2] ? decimalFromAmerican(ml[2]) : decimalFromProb(pb);
    els.paceLabel.textContent = "进球节奏";
  }

  els.aiConfidence.textContent = `${intel.confidence}/100`;
  els.marketEdge.textContent = intel.edge;
  els.riskLevel.textContent = intel.risk;
  els.paceValue.textContent = intel.pace;
  els.modelTag.textContent = `${match.odds?.provider || "AI"} + 实力模型`;
  const favorite = pa >= pb ? match.home : match.away;
  els.analysis.textContent = `${favorite} 是当前 AI 倾向。模型会同时看市场盘口、球队评分、主客场、比赛节奏和开赛时间；赔率变化后，胜率和比分会自动重新计算。`;
  els.factorList.innerHTML = [
    `开赛时间：${fmtMY(match.start)}，预计结束：${fmtMY(endTime(match))}。`,
    `当前胜率差约 ${Math.round(Math.abs(pa - pb) * 100)} 个百分点，风险等级：${intel.risk}。`,
    `盘口来源：${match.odds?.provider || "模型估算"}，显示赔率已转换成 decimal odds。`,
    match.sport === "nba" ? `总分节奏约 ${Math.round(result.total || 216)}，会影响预测比分。` : `预期进球约 ${intel.pace}，低比分概率较高。`,
    `倒计时会自动跳动，比赛结束后会从列表隐藏。`
  ].map(x => `<li>${x}</li>`).join("");

  els.searchBtn.onclick = () => window.open(`https://www.google.com/search?q=${encodeURIComponent(`${match.home} ${match.away} odds prediction Malaysia time`)}`, "_blank", "noreferrer");
  els.headlineMatch.textContent = `${match.home} vs ${match.away}`;
  els.headlineMeta.textContent = `${match.venue} · MYT ${fmtMY(match.start)} · 预计结束 ${fmtMY(endTime(match), false)}`;
  els.heroTeamA.textContent = match.home;
  els.heroTeamB.textContent = match.away;
  els.heroScore.textContent = `${score[0]} : ${score[1]}`;
}

function renderCountdowns() {
  const all = [...state.matches.worldcup, ...state.matches.nba].filter(m => !isEnded(m)).sort((a, b) => a.start - b.start);
  const next = all[0];
  if (next) {
    els.nextMatchName.textContent = `${next.home} vs ${next.away}`;
    els.nextCountdown.textContent = fmtCountdown(next.start);
    els.nextEndTime.textContent = fmtMY(endTime(next), false);
  }
  els.sixCountdown.textContent = fmtCountdown(nextSixAM());
  const selected = selectedMatch();
  if (selected) {
    els.selectedCountdown.textContent = fmtCountdown(selected.start);
    els.selectedEndTime.textContent = fmtMY(endTime(selected));
  }
}

function renderAll() {
  els.tabs.forEach(t => t.classList.toggle("active", t.dataset.sport === state.sport));
  renderDates();
  renderList();
  renderPanel();
  renderCountdowns();
}

function tick() {
  els.clock.textContent = new Intl.DateTimeFormat("zh-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
  renderCountdowns();
}

els.tabs.forEach(tab => tab.addEventListener("click", () => {
  state.sport = tab.dataset.sport;
  state.selectedKey = null;
  els.search.value = "";
  els.stage.value = "all";
  els.date.value = "all";
  renderAll();
}));

els.viewTabs.forEach(tab => tab.addEventListener("click", () => {
  els.viewTabs.forEach(t => t.classList.toggle("active", t === tab));
  els.viewPanels.forEach(panel => panel.classList.toggle("active", panel.dataset.panel === tab.dataset.view));
}));

[els.search, els.date, els.stage, els.marketOnly, els.hideEnded].forEach(el => el.addEventListener("input", renderAll));
[els.attack, els.draw].forEach(el => el.addEventListener("input", () => {
  els.attackOut.textContent = Number(els.attack.value).toFixed(2);
  els.drawOut.textContent = Number(els.draw.value).toFixed(2);
  renderAll();
}));
els.refreshBtn.addEventListener("click", () => refreshData(true));
els.list.addEventListener("click", event => {
  const card = event.target.closest(".match-card");
  if (card) {
    state.selectedKey = card.dataset.key;
    renderAll();
  }
});

tick();
renderAll();
refreshData(true);
setInterval(tick, 1000);
setInterval(() => refreshData(false), 5 * 60 * 1000);
