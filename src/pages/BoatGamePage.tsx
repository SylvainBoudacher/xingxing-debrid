import { type BoatControl, boatControlOf } from "@/components/boat";
import { DuckPreview } from "@/components/DuckPreview";
import { getRarity, randomVariant, type Rarity } from "@/components/duckRandom";
import { spawnVariant } from "@/components/duckShopBridge";
import type { Variant } from "@/components/duckTypes";
import { earnedAchievements, labelOf } from "@/game/achievements";
import {
  type Boss,
  BOSS_R,
  bossDangerous,
  bossPhase,
  drawBoss,
  makeBoss,
  updateBoss,
} from "@/game/boss";
import {
  type Bomb,
  BOMB_BLAST_R,
  drawBombs,
  drawEnemies,
  drawShots,
  type Enemy,
  makeDirector,
  type Shot,
  updateBombs,
  updateEnemies,
  updateShots,
  updateSpawns,
} from "@/game/enemies";
import {
  drawEvent,
  drawFog,
  makeEventDirector,
  updateEvents,
  waveHits,
  whirlPull,
} from "@/game/events";
import {
  addPopup,
  buildScanlines,
  burstSparks,
  drawBackground,
  drawFinishLine,
  drawPopups,
  drawSparks,
  drawWarning,
  flushText,
  pixelText,
  type Popup,
  type Spark,
  updatePopups,
  updateSparks,
} from "@/game/fx";
import {
  type Banana,
  BANANA_R,
  drawBananas,
  makeBananaDirector,
  updateBananas,
  updateBananaSpawns,
} from "@/game/pickups";
import { drawPlayer, GRAZE_MARGIN, makePlayer, PLAYER_R, updatePlayer } from "@/game/player";
import {
  drawPowerups,
  MAGNET_DURATION,
  MAGNET_RANGE,
  makePowerupDirector,
  type Powerup,
  POWERUP_R,
  SLOW_DURATION,
  SLOW_FACTOR,
  updatePowerups,
  updatePowerupSpawns,
} from "@/game/powerups";
import { rewardBoost, rollRewards } from "@/game/rewards";
import {
  ACTS,
  computeRank,
  computeScore,
  DIFF_LABEL,
  DIFF_MODS,
  DIFFICULTIES,
  fmtChrono,
  LH,
  LW,
  makeRun,
  type Rank,
  type ScoreBreakdown,
  scrollSpeed,
} from "@/game/run";
import { LazyStore } from "@tauri-apps/plugin-store";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const store = new LazyStore("settings.json", { defaults: {}, autoSave: false });
const HS_KEY = "boatgame_high_score";
const HS_ENDLESS_KEY = "boatgame_endless_high";
const WON_KEY = "boatgame_won";
const ACH_KEY = "boatgame_achievements";

const RARITY_LABEL: Record<Rarity, string> = {
  common: "Commun",
  uncommon: "Peu commun",
  rare: "Rare",
  legendary: "Légendaire",
  mythic: "Mythique",
  god: "Divin",
};
const RARITY_CLASS: Record<Rarity, string> = {
  common: "text-zinc-400",
  uncommon: "text-emerald-400",
  rare: "text-sky-400",
  legendary: "text-purple-400",
  mythic: "text-amber-300",
  god: "text-yellow-200",
};

const RANK_COLOR: Record<Rank, string> = {
  S: "#ffd21e",
  A: "#7bd850",
  B: "#4fb0f0",
  C: "#9aa5b1",
};

interface RewardState {
  variants: Variant[];
  score: ScoreBreakdown;
  newRecord: boolean;
}

// One slot-machine reel: cycles through random skins, then locks onto its real
// prize after `settleAt` ms. Only a settled card can be picked.
function RewardCard({
  variant,
  settleAt,
  onPick,
}: {
  variant: Variant;
  settleAt: number;
  onPick: () => void;
}) {
  const [spin, setSpin] = useState<Variant | null>(() => randomVariant());

  useEffect(() => {
    const tick = setInterval(() => setSpin(randomVariant()), 75);
    const stop = setTimeout(() => {
      clearInterval(tick);
      setSpin(null);
    }, settleAt);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
    };
  }, [settleAt]);

  const settled = spin === null;
  const shown = spin ?? variant;
  const rarity = getRarity(variant);

  return (
    <motion.button
      onClick={settled ? onPick : undefined}
      disabled={!settled}
      animate={settled ? { scale: [1.12, 1], y: [-6, 0] } : { scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`group flex w-40 flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
        settled
          ? "cursor-pointer border-amber-400/70 bg-slate-900/80 hover:-translate-y-1 hover:bg-slate-800"
          : "animate-pulse border-slate-600 bg-slate-950/80"
      }`}
    >
      <div className={settled ? "" : "opacity-80 blur-[1px]"}>
        <DuckPreview variant={shown} size={84} />
      </div>
      {settled ? (
        <span className={`font-mono text-xs font-bold uppercase ${RARITY_CLASS[rarity]}`}>
          {RARITY_LABEL[rarity]}
        </span>
      ) : (
        <span className="font-mono text-xs font-bold text-slate-500">? ? ?</span>
      )}
      {settled && variant.shiny && (
        <span className="font-mono text-[10px] font-bold text-fuchsia-400">SHINY</span>
      )}
    </motion.button>
  );
}

export function BoatGamePage({ onExit }: { onExit: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reward, setReward] = useState<RewardState | null>(null);
  const exitRef = useRef(onExit);

  useEffect(() => {
    exitRef.current = onExit;
  }, [onExit]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const low = document.createElement("canvas");
    low.width = LW;
    low.height = LH;
    const c = low.getContext("2d")!;

    // upscale geometry + CRT overlay, rebuilt on resize
    let scale = 1;
    let ox = 0;
    let oy = 0;
    let scanlines: HTMLCanvasElement | null = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      scale = Math.max(1, Math.floor(Math.min(canvas.width / LW, canvas.height / LH)));
      ox = Math.floor((canvas.width - LW * scale) / 2);
      oy = Math.floor((canvas.height - LH * scale) / 2);
      scanlines = buildScanlines(canvas.width, canvas.height);
    }

    // ---- title screen selection ----
    let selDiff = 0; // index into DIFFICULTIES
    let selEndless = false;
    let endlessUnlocked = false;

    // ---- game state ----
    let run = makeRun("normal", false);
    let player = makePlayer();
    let enemies: Enemy[] = [];
    let shots: Shot[] = [];
    let bombs: Bomb[] = [];
    let bananas: Banana[] = [];
    let powerups: Powerup[] = [];
    const sparks: Spark[] = [];
    const popups: Popup[] = [];
    let dir = makeDirector();
    let bananaDir = makeBananaDirector();
    let powerupDir = makePowerupDirector();
    let eventDir = makeEventDirector();
    let boss: Boss | null = null;
    let finishDelay = 0; // seconds after the boss leaves before the buoy shows
    const keys = new Set<BoatControl>();

    let highScore = 0;
    let endlessHigh = 0;
    let ownedAch = new Set<string>();
    let rewardShown = false;
    store
      .get<number>(HS_KEY)
      .then((v) => {
        if (typeof v === "number") highScore = v;
      })
      .catch(() => {});
    store
      .get<number>(HS_ENDLESS_KEY)
      .then((v) => {
        if (typeof v === "number") endlessHigh = v;
      })
      .catch(() => {});
    store
      .get<boolean>(WON_KEY)
      .then((v) => {
        endlessUnlocked = !!v;
      })
      .catch(() => {});
    store
      .get<string[]>(ACH_KEY)
      .then((v) => {
        if (Array.isArray(v)) ownedAch = new Set(v);
      })
      .catch(() => {});

    function setPhase(p: typeof run.phase) {
      run.phase = p;
      run.phaseT = 0;
    }

    function mods() {
      return DIFF_MODS[run.difficulty];
    }

    function startAct(act: number) {
      run.act = act;
      run.actT = 0;
      run.hearts = mods().hearts;
      run.snapshot = { bananas: run.bananas, grazes: run.grazes };
      run.finishX = null;
      enemies = [];
      shots = [];
      bombs = [];
      bananas = [];
      powerups = [];
      dir = makeDirector();
      bananaDir = makeBananaDirector();
      powerupDir = makePowerupDirector();
      eventDir = makeEventDirector();
      boss = !run.endless && act === 2 ? makeBoss() : null;
      finishDelay = 0;
      player = makePlayer();
      setPhase("banner");
    }

    function startRun() {
      run = makeRun(DIFFICULTIES[selDiff], selEndless);
      results = null;
      startAct(0);
    }

    function retryAct() {
      run.bananas = run.snapshot.bananas;
      run.grazes = run.snapshot.grazes;
      startAct(run.act);
    }

    function hitPlayer() {
      if (player.inv > 0) return;
      if (player.shield) {
        player.shield = false;
        player.inv = 1;
        addPopup(popups, player.x, player.y - 14, "BOUCLIER !", "#6ebeff");
        burstSparks(sparks, player.x, player.y, "#6ebeff", 8, 70);
        return;
      }
      run.hearts--;
      run.hitCount++;
      player.inv = 1.6;
      run.shake = 6;
      burstSparks(sparks, player.x, player.y, "#ff5a5a", 10, 90);
      if (run.hearts <= 0) {
        if (run.endless) {
          results = finishRun(false);
          setPhase("results");
        } else {
          setPhase("dead");
        }
      }
    }

    interface Results {
      score: ScoreBreakdown;
      rank: Rank;
      boost: number;
      newRecord: boolean;
      newAch: string[];
    }
    let results: Results | null = null;

    function finishRun(finished: boolean): Results {
      const score = computeScore(run);
      const rank = computeRank(run);
      const boost = rewardBoost(rank, score.total, run.difficulty);

      const hsKey = run.endless ? HS_ENDLESS_KEY : HS_KEY;
      const best = run.endless ? endlessHigh : highScore;
      const newRecord = score.total > best;
      if (newRecord) {
        if (run.endless) endlessHigh = score.total;
        else highScore = score.total;
        store
          .set(hsKey, score.total)
          .then(() => store.save())
          .catch(() => {});
      }

      if (finished && !endlessUnlocked) {
        endlessUnlocked = true;
        store
          .set(WON_KEY, true)
          .then(() => store.save())
          .catch(() => {});
      }

      const newAch = earnedAchievements(run, rank, finished).filter((id) => !ownedAch.has(id));
      if (newAch.length) {
        for (const id of newAch) ownedAch.add(id);
        store
          .set(ACH_KEY, [...ownedAch])
          .then(() => store.save())
          .catch(() => {});
      }

      return { score, rank, boost, newRecord, newAch };
    }

    function openReward() {
      if (rewardShown || !results) return;
      rewardShown = true;
      setReward({
        variants: rollRewards(results.rank, results.score.total, run.difficulty),
        score: results.score,
        newRecord: results.newRecord,
      });
    }

    // ---- input ----
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === "Escape") {
        exitRef.current();
        return;
      }
      if (rewardShown) return;
      const control = boatControlOf(e.code);

      if (run.phase === "intro") {
        if (control === "left") selDiff = (selDiff + DIFFICULTIES.length - 1) % DIFFICULTIES.length;
        else if (control === "right") selDiff = (selDiff + 1) % DIFFICULTIES.length;
        else if ((control === "up" || control === "down") && endlessUnlocked)
          selEndless = !selEndless;
        else if ((e.code === "Enter" || e.code === "Space") && run.phaseT > 0.3) startRun();
        e.preventDefault();
        return;
      }

      if (control) {
        keys.add(control);
        e.preventDefault();
      }
      if (run.phase === "dead" && e.code === "KeyR") retryAct();
      else if (run.phase === "results") {
        if (e.code === "Enter") openReward();
        else if (e.code === "KeyR") startRun();
        else if (e.code === "KeyM") run = makeRun(DIFFICULTIES[selDiff], selEndless); // back to title
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      const control = boatControlOf(e.code);
      if (control) keys.delete(control);
    }
    const onBlur = () => keys.clear();

    // closest distance from point (px,py) to the segment [ax,ay]-[bx,by]
    function segPointDist(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const tt = len2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2)) : 0;
      return Math.hypot(px - (ax + dx * tt), py - (ay + dy * tt));
    }

    // ---- collisions ----
    function collide(wdt: number) {
      for (const e of enemies) {
        const d = Math.hypot(e.x - player.x, e.y - player.y);
        const hitR = e.r + PLAYER_R;
        if (d < hitR) hitPlayer();
        else if (d < hitR + GRAZE_MARGIN && !e.grazed && player.inv <= 0) {
          e.grazed = true;
          run.grazes++;
          addPopup(popups, e.x, e.y - e.r - 4, "+50", "#8be9fd");
          burstSparks(sparks, player.x, player.y, "#8be9fd", 4, 40);
        }
      }
      if (
        boss &&
        bossDangerous(boss) &&
        Math.hypot(boss.x - player.x, boss.y - player.y) < BOSS_R + PLAYER_R
      )
        hitPlayer();

      const wave = eventDir.active;
      if (wave && waveHits(wave, player.x, player.y)) hitPlayer();

      for (let i = shots.length - 1; i >= 0; i--) {
        const s = shots[i];
        // swept test over the shot's travel this frame so fast bullets can't
        // tunnel through the thin graze band between two sampled positions
        const px = s.x - s.vx * wdt;
        const py = s.y - s.vy * wdt;
        const d = segPointDist(px, py, s.x, s.y, player.x, player.y);
        const hitR = s.r + PLAYER_R;
        if (d < hitR) {
          shots.splice(i, 1);
          hitPlayer();
        } else if (d < hitR + GRAZE_MARGIN && !s.grazed && player.inv <= 0) {
          s.grazed = true;
          run.grazes++;
          addPopup(popups, s.x, s.y - 6, "+50", "#8be9fd");
          burstSparks(sparks, s.x, s.y, "#8be9fd", 4, 40);
        }
      }

      for (let i = bananas.length - 1; i >= 0; i--) {
        const b = bananas[i];
        if (Math.hypot(b.x - player.x, b.y - player.y) < BANANA_R + PLAYER_R) {
          bananas.splice(i, 1);
          run.bananas++;
          addPopup(popups, b.x, b.y - 6, "+100", "#ffe066");
          burstSparks(sparks, b.x, b.y, "#ffe066", 5, 50);
        }
      }

      for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (Math.hypot(p.x - player.x, p.y - player.y) < POWERUP_R + PLAYER_R) {
          powerups.splice(i, 1);
          if (p.kind === "shield") {
            player.shield = true;
            addPopup(popups, p.x, p.y - 8, "BOUCLIER", "#6ebeff");
          } else if (p.kind === "magnet") {
            player.magnetT = MAGNET_DURATION;
            addPopup(popups, p.x, p.y - 8, "AIMANT", "#ff8a7a");
          } else {
            player.slowT = SLOW_DURATION;
            addPopup(popups, p.x, p.y - 8, "RALENTI", "#ffe066");
          }
          burstSparks(sparks, p.x, p.y, "#ffffff", 8, 60);
        }
      }
    }

    // ---- HUD ----
    function drawHeart(x: number, y: number, filled: boolean) {
      c.fillStyle = filled ? "#ff4d6d" : "rgba(255,255,255,0.18)";
      c.fillRect(x, y, 3, 3);
      c.fillRect(x + 4, y, 3, 3);
      c.fillRect(x, y + 2, 7, 3);
      c.fillRect(x + 1, y + 5, 5, 2);
      c.fillRect(x + 2, y + 7, 3, 1);
      if (filled) {
        c.fillStyle = "#ffb3c1";
        c.fillRect(x + 1, y + 1, 1, 1);
      }
    }

    function drawHud() {
      for (let i = 0; i < mods().hearts; i++) drawHeart(8 + i * 11, 8, i < run.hearts);
      pixelText(c, fmtChrono(run.totalT), LW / 2, 12, 10, "#e8f4ff");
      const label = run.endless
        ? `SANS FIN - ${DIFF_LABEL[run.difficulty]}`
        : `ACTE ${run.act + 1} - ${DIFF_LABEL[run.difficulty]}`;
      pixelText(c, label, LW / 2, 24, 7, "rgba(210,230,250,0.55)");
      pixelText(c, `BANANES ${run.bananas}`, LW - 8, 10, 7, "#ffe066", "right");
      pixelText(c, `FRISSONS ${run.grazes}`, LW - 8, 20, 7, "#8be9fd", "right");
    }

    function drawWorld(t: number) {
      if (run.finishX !== null) drawFinishLine(c, run.finishX, t);
      if (eventDir.active) drawEvent(c, eventDir.active, t);
      drawBananas(c, bananas, t);
      drawPowerups(c, powerups, t);
      drawEnemies(c, enemies, t);
      if (boss) drawBoss(c, boss, t, currentBossPhase());
      drawPlayer(c, player, t);
      drawShots(c, shots);
      drawBombs(c, bombs);
      if (eventDir.active) drawFog(c, eventDir.active, t);
      drawSparks(c, sparks);
      drawPopups(c, popups);
      // slow-motion tint
      if (player.slowT > 0) {
        c.fillStyle = "rgba(120,190,255,0.09)";
        c.fillRect(0, 0, LW, LH);
      }
    }

    function currentBossPhase() {
      return boss ? bossPhase(run.actT, ACTS[2].dur) : 0;
    }

    // ---- phases ----
    function updatePlay(dt: number) {
      run.totalT += dt;
      run.actT += dt;

      // the hourglass slows the world, never the boat
      const wdt = player.slowT > 0 ? dt * SLOW_FACTOR : dt;
      run.scroll += scrollSpeed(run) * wdt;

      const pull = eventDir.active ? whirlPull(eventDir.active, player.x, player.y) : null;
      updatePlayer(player, keys, dt, pull);

      updateSpawns(dir, run, enemies, wdt, mods().density);
      updateEnemies(enemies, shots, bombs, wdt, player.x, player.y, mods().shotSpeed);
      if (boss)
        updateBoss(boss, shots, wdt, player.x, player.y, currentBossPhase(), mods().shotSpeed);
      updateShots(shots, wdt);
      const impacts = updateBombs(bombs, wdt);
      for (const im of impacts) {
        burstSparks(sparks, im.x, im.y, "#bfe3ff", 10, 80);
        if (Math.hypot(im.x - player.x, im.y - player.y) < BOMB_BLAST_R + PLAYER_R * 0.5)
          hitPlayer();
      }
      updateBananaSpawns(bananaDir, bananas, wdt);
      updateBananas(bananas, run, wdt);
      updatePowerupSpawns(powerupDir, powerups, wdt);
      updatePowerups(powerups, run, wdt);
      updateEvents(eventDir, run, wdt);
      if (eventDir.active?.kind === "wave" && eventDir.active.warnT > 0)
        run.shake = Math.max(run.shake, 1.5);

      // banana magnet
      if (player.magnetT > 0) {
        for (const b of bananas) {
          const d = Math.hypot(b.x - player.x, b.y - player.y);
          if (d < MAGNET_RANGE && d > 1) {
            b.x += ((player.x - b.x) / d) * 170 * dt;
            b.y += ((player.y - b.y) / d) * 170 * dt;
          }
        }
      }

      collide(wdt);
      updateSparks(sparks, dt);
      updatePopups(popups, dt);

      if (!run.endless) {
        const act = ACTS[run.act];
        if (run.actT >= act.dur) {
          if (run.act < 2) {
            startActKeepStats(run.act + 1);
          } else if (boss && !boss.leaving) {
            boss.leaving = true;
            boss.t = 0;
            shots = [];
          }
        }

        // boss gone: bring in the arrival buoy
        if (boss?.leaving) {
          finishDelay += dt;
          if (finishDelay > 2 && run.finishX === null) run.finishX = LW + 40;
        }
        if (run.finishX !== null) {
          run.finishX -= (scrollSpeed(run) + 20) * dt;
          if (run.finishX <= player.x) {
            burstSparks(sparks, player.x, player.y - 10, "#ffe066", 20, 110);
            setPhase("finish");
          }
        }
      }
    }

    // act transition without resetting hearts/entities harshly: new act keeps
    // the current stats as the new checkpoint snapshot
    function startActKeepStats(act: number) {
      run.act = act;
      run.actT = 0;
      run.snapshot = { bananas: run.bananas, grazes: run.grazes };
      boss = act === 2 ? makeBoss() : null;
      setPhase("banner");
    }

    // ---- title / results drawing ----
    function drawIntro(t: number) {
      c.fillStyle = "#04070f";
      c.fillRect(0, 0, LW, LH);
      pixelText(c, "LE TYPHON", LW / 2, 58, 30, "#ffe066");
      pixelText(c, "XINGXING A ETE ASPIRE DANS L'ENVERS DE LA PISCINE", LW / 2, 92, 8, "#bcd6ee");

      // mode selector
      const modeLabel = selEndless ? "TYPHON SANS FIN" : "LA COURSE";
      pixelText(c, "MODE", LW / 2, 124, 7, "rgba(200,220,240,0.5)");
      pixelText(c, endlessUnlocked ? `^ ${modeLabel} v` : modeLabel, LW / 2, 137, 11, "#ffffff");
      if (!endlessUnlocked)
        pixelText(
          c,
          "TERMINE LA COURSE POUR DEBLOQUER LE MODE SANS FIN",
          LW / 2,
          150,
          6,
          "rgba(200,220,240,0.4)",
        );

      // difficulty selector
      const diff = DIFFICULTIES[selDiff];
      const diffColor = diff === "normal" ? "#7fd1c0" : diff === "tempete" ? "#ff9a3c" : "#ff4d6d";
      pixelText(c, "DIFFICULTE", LW / 2, 168, 7, "rgba(200,220,240,0.5)");
      pixelText(c, `< ${DIFF_LABEL[diff]} >`, LW / 2, 181, 11, diffColor);
      const diffHint =
        diff === "normal"
          ? "LA MER EST CALME. ENFIN, PRESQUE."
          : diff === "tempete"
            ? "TIRS +30%, CANARDS +50%. TIRAGE SANS COMMUN."
            : "UN SEUL COEUR. UN SHINY GARANTI AU TIRAGE.";
      pixelText(c, diffHint, LW / 2, 194, 6, "rgba(200,220,240,0.55)");

      if (Math.floor(t * 2) % 2 === 0 && run.phaseT > 0.3)
        pixelText(c, "ENTREE : LARGUER LES AMARRES", LW / 2, 224, 10, "#ffffff");
      pixelText(
        c,
        "ZQSD / FLECHES : PILOTER ET CHOISIR   ECHAP : RETOUR",
        LW / 2,
        252,
        7,
        "rgba(200,220,240,0.45)",
      );
    }

    function drawResults(t: number) {
      if (!results) return;
      c.fillStyle = "rgba(2,6,14,0.82)";
      c.fillRect(0, 0, LW, LH);
      const s = results.score;

      pixelText(c, run.endless ? "FIN DE LA DERIVE" : "RESULTATS", LW / 2, 36, 16, "#ffe066");

      // rank medallion
      pixelText(c, "RANG", LW / 2 - 150, 76, 8, "rgba(220,230,240,0.6)");
      pixelText(c, results.rank, LW / 2 - 150, 104, 34, RANK_COLOR[results.rank]);

      const lx = LW / 2 + 30;
      pixelText(c, `CHRONO  ${fmtChrono(run.totalT)}   +${s.timeBonus}`, lx, 68, 9, "#e8f4ff");
      pixelText(c, `BANANES x${run.bananas}   +${s.bananas}`, lx, 84, 9, "#ffe066");
      pixelText(c, `FRISSONS x${run.grazes}   +${s.grazes}`, lx, 100, 9, "#8be9fd");
      if (s.perfect > 0) pixelText(c, `SANS UNE EGRATIGNURE  +${s.perfect}`, lx, 116, 9, "#7bd850");
      pixelText(c, `TOTAL  ${s.total}`, lx, 138, 14, "#ffffff");
      if (results.newRecord && Math.floor(t * 2) % 2 === 0)
        pixelText(c, "NOUVEAU RECORD !", lx, 156, 9, "#ff9a3c");
      else if (!results.newRecord)
        pixelText(
          c,
          `RECORD  ${run.endless ? endlessHigh : highScore}`,
          lx,
          156,
          8,
          "rgba(220,230,240,0.55)",
        );

      if (results.boost > 0)
        pixelText(c, `TIRAGE AMELIORE +${results.boost}`, LW / 2, 182, 9, "#c9a8ff");

      for (let i = 0; i < Math.min(2, results.newAch.length); i++) {
        pixelText(c, `SUCCES : ${labelOf(results.newAch[i])}`, LW / 2, 198 + i * 12, 7, "#7bd850");
      }

      pixelText(c, "ENTREE : RECOMPENSE   R : REJOUER   M : MENU", LW / 2, 240, 10, "#ffffff");
    }

    // ---- frame loop ----
    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now;
      const t = now / 1000;
      run.phaseT += dt;

      c.imageSmoothingEnabled = false;
      c.clearRect(0, 0, LW, LH);

      if (run.phase === "intro") {
        drawIntro(t);
      } else {
        drawBackground(c, run, t, dt);

        if (run.phase === "banner") {
          drawWorld(t);
          drawHud();
          c.fillStyle = "rgba(0,0,0,0.55)";
          c.fillRect(0, 0, LW, LH);
          const name = run.endless ? "TYPHON SANS FIN" : ACTS[run.act].name;
          pixelText(c, name, LW / 2, LH / 2 - 8, 16, "#ffe066");
          if (run.phaseT > 1.3) pixelText(c, "GO !", LW / 2, LH / 2 + 20, 14, "#ffffff");
          if (run.phaseT >= 2) setPhase("play");
        } else if (run.phase === "play") {
          updatePlay(dt);
          drawWorld(t);
          drawHud();
          const ev = eventDir.active;
          if (ev && ev.warnT > 0)
            drawWarning(c, t, ev.kind === "wave" ? "VAGUE GEANTE" : "TOURBILLON");
        } else if (run.phase === "dead") {
          drawWorld(t);
          drawHud();
          c.fillStyle = "rgba(20,0,8,0.6)";
          c.fillRect(0, 0, LW, LH);
          pixelText(c, "NAUFRAGE !", LW / 2, LH / 2 - 22, 24, "#ff4d6d");
          pixelText(c, `R : REESSAYER L'ACTE ${run.act + 1}`, LW / 2, LH / 2 + 12, 10, "#ffffff");
          pixelText(c, "ECHAP : ABANDONNER", LW / 2, LH / 2 + 28, 8, "rgba(220,230,240,0.6)");
        } else if (run.phase === "finish") {
          updateSparks(sparks, dt);
          updatePopups(popups, dt);
          drawWorld(t);
          drawHud();
          pixelText(c, "ARRIVEE !", LW / 2, LH / 2 - 10, 26, "#ffe066");
          if (run.phaseT >= 1.8) {
            results = finishRun(true);
            setPhase("results");
          }
        } else if (run.phase === "results") {
          drawResults(t);
        }
      }

      // blit the low-res frame, shaken while it hurts
      run.shake = Math.max(0, run.shake - 30 * dt);
      const sx = ox + (Math.random() - 0.5) * run.shake * scale;
      const sy = oy + (Math.random() - 0.5) * run.shake * scale;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(low, sx, sy, LW * scale, LH * scale);
      // crisp text pass on top of the upscaled frame, still under the scanlines
      flushText(ctx, scale, sx, sy);
      if (scanlines) ctx.drawImage(scanlines, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  function pickReward(v: Variant) {
    spawnVariant(v);
    toast.success("XingXing ramene un canard du typhon !");
    onExit();
  }

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {reward && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 bg-black/85">
          <div className="text-center">
            <div className="font-mono text-xl font-bold tracking-widest text-amber-300">
              CHOISIS TA RECOMPENSE
            </div>
            <div className="mt-1 font-mono text-xs text-slate-400">
              Un seul canard rejoindra la piscine
            </div>
          </div>
          <div className="flex gap-4">
            {reward.variants.map((v, i) => (
              <RewardCard
                key={i}
                variant={v}
                settleAt={1100 + i * 800}
                onPick={() => pickReward(v)}
              />
            ))}
          </div>
          <div className="font-mono text-[11px] text-slate-500">Echap : repartir sans canard</div>
        </div>
      )}
    </div>
  );
}
