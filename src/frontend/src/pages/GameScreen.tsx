import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerConfig } from "../App";

interface Props {
  p1Config: PlayerConfig;
  p2Config: PlayerConfig;
  mapName: string;
  isAdmin: boolean;
  onWin: (winner: string) => void;
  onBack: () => void;
}

const CANVAS_W = 800;
const CANVAS_H = 450;
const GROUND_Y = 380;
const PLAYER_W = 60;
const PLAYER_H = 60;
const GRAVITY = 0.6;
const BULLET_SPEED = 12;
const BULLET_DAMAGE = 10;

const VEHICLE_STATS: Record<
  string,
  { speed: number; health: number; canFly: boolean }
> = {
  bike: { speed: 6, health: 60, canFly: false },
  car: { speed: 4, health: 100, canFly: false },
  van: { speed: 2.5, health: 140, canFly: false },
  tank: { speed: 1.5, health: 200, canFly: false },
  plane: { speed: 5.5, health: 70, canFly: true },
  ship: { speed: 2, health: 160, canFly: false },
  battle: { speed: 3, health: 180, canFly: false },
};

const VEHICLE_EMOJI: Record<string, string> = {
  car: "🚗",
  van: "🚐",
  bike: "🏍️",
  tank: "🪖",
  plane: "✈️",
  ship: "🚢",
  battle: "⚔️",
};

const ALL_VEHICLES = ["car", "van", "bike", "tank", "plane", "ship", "battle"];

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  facing: number;
  grounded: boolean;
  vehicleType: string;
  speed: number;
  canFly: boolean;
  name: string;
  config: PlayerConfig;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  owner: number;
}

interface GameState {
  p1: Player;
  p2: Player;
  bullets: Bullet[];
  running: boolean;
  godMode: boolean;
  flyMode: boolean;
  coins: number;
  showVehiclePicker: boolean;
}

function makePlayer(config: PlayerConfig, x: number, facing: number): Player {
  const vt = config.vehicleType.toLowerCase();
  const stats = VEHICLE_STATS[vt] ?? { speed: 3, health: 100, canFly: false };
  return {
    x,
    y: GROUND_Y - PLAYER_H,
    vx: 0,
    vy: 0,
    health: stats.health,
    maxHealth: stats.health,
    facing,
    grounded: true,
    vehicleType: vt,
    speed: stats.speed,
    canFly: stats.canFly,
    name: config.characterName,
    config,
  };
}

function drawMap(ctx: CanvasRenderingContext2D, mapName: string) {
  // Background
  let bg: CanvasGradient;
  if (mapName === "Jungle") {
    bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#0a2a0a");
    bg.addColorStop(1, "#1a4a1a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Trees
    ctx.fillStyle = "#2a5a2a";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(50 + i * 100, 350);
      ctx.lineTo(30 + i * 100, 280);
      ctx.lineTo(10 + i * 100, 350);
      ctx.fill();
    }
  } else if (mapName === "City") {
    bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#1a1a2e");
    bg.addColorStop(1, "#0d0d1a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Buildings
    ctx.fillStyle = "#2a2a4e";
    const buildings = [
      [20, 150, 80, 230],
      [110, 200, 70, 180],
      [200, 120, 90, 260],
      [310, 180, 60, 200],
      [390, 100, 110, 280],
      [520, 160, 80, 220],
      [620, 140, 90, 240],
      [730, 190, 70, 190],
    ];
    for (const [x, y, w, h] of buildings) {
      ctx.fillRect(x, y, w, h);
      // Windows
      ctx.fillStyle = "rgba(255,200,50,0.3)";
      for (let wy = y + 20; wy < y + h - 20; wy += 25) {
        for (let wx = x + 10; wx < x + w - 10; wx += 20) {
          if (Math.random() > 0.4) ctx.fillRect(wx, wy, 8, 10);
        }
      }
      ctx.fillStyle = "#2a2a4e";
    }
  } else if (mapName === "Castle") {
    bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    bg.addColorStop(0, "#1a0a2e");
    bg.addColorStop(1, "#0d0518");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Stone wall
    ctx.fillStyle = "#3a2a4e";
    ctx.fillRect(0, 300, CANVAS_W, 80);
    // Battlements
    for (let i = 0; i < 16; i++) {
      ctx.fillRect(i * 50, 280, 30, 25);
    }
    // Towers
    ctx.fillRect(0, 100, 100, 300);
    ctx.fillRect(700, 100, 100, 300);
  } else {
    // Space Station
    ctx.fillStyle = "#020210";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Stars
    ctx.fillStyle = "white";
    for (let i = 0; i < 80; i++) {
      ctx.beginPath();
      ctx.arc(
        (i * 137.5) % CANVAS_W,
        (i * 97.3) % (CANVAS_H * 0.8),
        Math.random() * 1.5 + 0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    // Platform glow
    ctx.fillStyle = "rgba(45,140,255,0.1)";
    ctx.fillRect(0, 380, CANVAS_W, 70);
  }
  // Ground
  const groundColors: Record<string, string> = {
    Jungle: "#4a2a0a",
    City: "#2a2a3e",
    Castle: "#3a2a4e",
    "Space Station": "#0a0a2e",
  };
  ctx.fillStyle = groundColors[mapName] ?? "#1a1a3e";
  ctx.fillRect(0, GROUND_Y, CANVAS_W, CANVAS_H - GROUND_Y);
}

export default function GameScreen({
  p1Config,
  p2Config,
  mapName,
  isAdmin,
  onWin,
  onBack,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const [godMode, setGodMode] = useState(false);
  const [flyMode, setFlyMode] = useState(false);
  const [coins, setCoins] = useState(0);
  const [p1Health, setP1Health] = useState(100);
  const [p2Health, setP2Health] = useState(100);
  const [p1MaxHealth, setP1MaxHealth] = useState(100);
  const [p2MaxHealth, setP2MaxHealth] = useState(100);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const lastShotRef = useRef<{ p1: number; p2: number }>({ p1: 0, p2: 0 });

  const initGame = useCallback(() => {
    const p1 = makePlayer(p1Config, 100, 1);
    const p2 = makePlayer(p2Config, CANVAS_W - 160, -1);
    gsRef.current = {
      p1,
      p2,
      bullets: [],
      running: true,
      godMode: false,
      flyMode: false,
      coins: 0,
      showVehiclePicker: false,
    };
    setP1Health(p1.health);
    setP2Health(p2.health);
    setP1MaxHealth(p1.maxHealth);
    setP2MaxHealth(p2.maxHealth);
    setGodMode(false);
    setFlyMode(false);
    setCoins(0);
  }, [p1Config, p2Config]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      const gs = gsRef.current;
      if (!gs) return;

      // Admin god-mode keys
      if (isAdmin) {
        if (e.code === "KeyG") {
          gs.godMode = !gs.godMode;
          setGodMode(gs.godMode);
        }
        if (e.code === "KeyT") {
          gs.flyMode = !gs.flyMode;
          setFlyMode(gs.flyMode);
        }
        if (e.code === "KeyV") {
          gs.showVehiclePicker = true;
          setShowVehiclePicker(true);
        }
        if (e.code === "KeyC") {
          gs.coins += 500;
          setCoins(gs.coins);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [isAdmin]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: game loop only needs to init once with stable refs
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (timestamp: number) => {
      const gs = gsRef.current;
      if (!gs || !gs.running) return;

      const keys = keysRef.current;

      // P1 controls: WASD, F=shoot
      const p1 = gs.p1;
      const p2 = gs.p2;

      // P1 horizontal
      if (keys.has("KeyA")) {
        p1.vx = -p1.speed;
        p1.facing = -1;
      } else if (keys.has("KeyD")) {
        p1.vx = p1.speed;
        p1.facing = 1;
      } else p1.vx = 0;

      // P1 jump / fly
      if (p1.canFly || gs.flyMode) {
        if (keys.has("KeyW")) p1.vy = -p1.speed * 0.8;
        else if (keys.has("KeyS")) p1.vy = p1.speed * 0.5;
        else p1.vy *= 0.85;
      } else {
        if (keys.has("KeyW") && p1.grounded) {
          p1.vy = -14;
          p1.grounded = false;
        }
      }

      // P2 horizontal
      if (keys.has("ArrowLeft")) {
        p2.vx = -p2.speed;
        p2.facing = -1;
      } else if (keys.has("ArrowRight")) {
        p2.vx = p2.speed;
        p2.facing = 1;
      } else p2.vx = 0;

      // P2 jump / fly
      if (p2.canFly) {
        if (keys.has("ArrowUp")) p2.vy = -p2.speed * 0.8;
        else if (keys.has("ArrowDown")) p2.vy = p2.speed * 0.5;
        else p2.vy *= 0.85;
      } else {
        if (keys.has("ArrowUp") && p2.grounded) {
          p2.vy = -14;
          p2.grounded = false;
        }
      }

      // Shooting cooldown 300ms
      if (keys.has("KeyF") && timestamp - lastShotRef.current.p1 > 300) {
        gs.bullets.push({
          x: p1.x + (p1.facing === 1 ? PLAYER_W : 0),
          y: p1.y + PLAYER_H / 2,
          vx: BULLET_SPEED * p1.facing,
          owner: 1,
        });
        lastShotRef.current.p1 = timestamp;
      }
      if (keys.has("KeyK") && timestamp - lastShotRef.current.p2 > 300) {
        gs.bullets.push({
          x: p2.x + (p2.facing === 1 ? PLAYER_W : 0),
          y: p2.y + PLAYER_H / 2,
          vx: BULLET_SPEED * p2.facing,
          owner: 2,
        });
        lastShotRef.current.p2 = timestamp;
      }

      // Physics
      if (!p1.canFly && !gs.flyMode) p1.vy += GRAVITY;
      if (!p2.canFly) p2.vy += GRAVITY;

      p1.x += p1.vx;
      p1.y += p1.vy;
      p2.x += p2.vx;
      p2.y += p2.vy;

      // Ground collision
      const groundY = GROUND_Y - PLAYER_H;
      if (p1.y >= groundY) {
        p1.y = groundY;
        p1.vy = 0;
        p1.grounded = true;
      } else p1.grounded = false;
      if (p2.y >= groundY) {
        p2.y = groundY;
        p2.vy = 0;
        p2.grounded = true;
      } else p2.grounded = false;

      // Ceiling
      if (p1.y < 60) {
        p1.y = 60;
        p1.vy = 0;
      }
      if (p2.y < 60) {
        p2.y = 60;
        p2.vy = 0;
      }

      // Wall bounds
      p1.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, p1.x));
      p2.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, p2.x));

      // Bullets
      gs.bullets = gs.bullets.filter((b) => b.x > -20 && b.x < CANVAS_W + 20);
      for (const b of gs.bullets) {
        b.x += b.vx;
        const target = b.owner === 1 ? p2 : p1;
        if (
          b.x > target.x &&
          b.x < target.x + PLAYER_W &&
          b.y > target.y &&
          b.y < target.y + PLAYER_H
        ) {
          if (b.owner === 2 && gs.godMode) {
            target.health = Math.max(1, target.health - BULLET_DAMAGE);
          } else {
            target.health = Math.max(0, target.health - BULLET_DAMAGE);
          }
          b.x = -100; // mark for removal
        }
      }

      setP1Health(p1.health);
      setP2Health(p2.health);

      // Win check
      if (p1.health <= 0) {
        gs.running = false;
        onWin(p2.name);
        return;
      }
      if (p2.health <= 0) {
        gs.running = false;
        onWin(p1.name);
        return;
      }

      // --- RENDER ---
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      drawMap(ctx, mapName);

      // Draw bullets
      for (const b of gs.bullets) {
        ctx.fillStyle = b.owner === 1 ? "#2D8CFF" : "#FF9A2E";
        ctx.beginPath();
        ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Trail
        ctx.fillStyle =
          b.owner === 1 ? "rgba(45,140,255,0.3)" : "rgba(255,154,46,0.3)";
        ctx.beginPath();
        ctx.arc(b.x - b.vx * 2, b.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw P1
      const p1glow = gs.godMode ? "#FFD700" : "#2D8CFF";
      if (gs.godMode) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = "#2D8CFF";
      ctx.fillRect(p1.x, p1.y, PLAYER_W, PLAYER_H);
      if (gs.godMode) {
        ctx.strokeStyle = p1glow;
        ctx.lineWidth = 3;
        ctx.strokeRect(p1.x, p1.y, PLAYER_W, PLAYER_H);
        ctx.shadowBlur = 0;
      }
      // P1 face
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 22px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(
        VEHICLE_EMOJI[p1.vehicleType] ?? "🥊",
        p1.x + PLAYER_W / 2,
        p1.y + PLAYER_H / 2 + 8,
      );
      ctx.font = "bold 11px system-ui";
      ctx.fillStyle = "white";
      ctx.fillText(p1.name, p1.x + PLAYER_W / 2, p1.y - 6);

      // Draw P2
      ctx.fillStyle = "#FF9A2E";
      ctx.fillRect(p2.x, p2.y, PLAYER_W, PLAYER_H);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 22px system-ui";
      ctx.fillText(
        VEHICLE_EMOJI[p2.vehicleType] ?? "🥊",
        p2.x + PLAYER_W / 2,
        p2.y + PLAYER_H / 2 + 8,
      );
      ctx.font = "bold 11px system-ui";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(p2.name, p2.x + PLAYER_W / 2, p2.y - 6);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [mapName, isAdmin, onWin, p1Config, p2Config]);

  const switchVehicle = (vt: string) => {
    const gs = gsRef.current;
    if (!gs) return;
    const stats = VEHICLE_STATS[vt] ?? { speed: 3, health: 100, canFly: false };
    gs.p1.vehicleType = vt;
    gs.p1.speed = stats.speed;
    gs.p1.canFly = stats.canFly;
    gs.showVehiclePicker = false;
    setShowVehiclePicker(false);
  };

  const p1HealthPct = (p1Health / p1MaxHealth) * 100;
  const p2HealthPct = (p2Health / p2MaxHealth) * 100;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{ color: "#F2F6FF" }}
    >
      {/* HUD */}
      <div className="w-full max-w-3xl mb-3">
        <div className="flex items-center gap-4">
          {/* P1 HUD */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-sm" style={{ color: "#2D8CFF" }}>
                {p1Config.characterName}
              </span>
              <span className="text-xs" style={{ color: "#7a8fa8" }}>
                {VEHICLE_EMOJI[p1Config.vehicleType.toLowerCase()] ?? ""}{" "}
                {p1Config.vehicleName}
              </span>
              {godMode && (
                <span
                  className="text-xs font-black px-2 py-0.5 rounded"
                  style={{ background: "#FFD700", color: "#000" }}
                >
                  ⚡ GOD
                </span>
              )}
              {flyMode && (
                <span
                  className="text-xs font-black px-2 py-0.5 rounded"
                  style={{ background: "#2D8CFF", color: "#fff" }}
                >
                  ✈ FLY
                </span>
              )}
            </div>
            <div
              className="relative h-5 rounded-full overflow-hidden"
              style={{ background: "#243249" }}
              data-ocid="game.p1_health"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${p1HealthPct}%`,
                  background: godMode
                    ? "linear-gradient(90deg, #FFD700, #FF9A2E)"
                    : "linear-gradient(90deg, #2D8CFF, #1a6fd8)",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
                {p1Health}
              </span>
            </div>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center">
            {isAdmin && (
              <span className="text-xs font-black" style={{ color: "#FFD700" }}>
                💰 {coins}
              </span>
            )}
            <span className="text-lg font-black" style={{ color: "#B7C2D6" }}>
              VS
            </span>
          </div>

          {/* P2 HUD */}
          <div className="flex-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <span className="text-xs" style={{ color: "#7a8fa8" }}>
                {VEHICLE_EMOJI[p2Config.vehicleType.toLowerCase()] ?? ""}{" "}
                {p2Config.vehicleName}
              </span>
              <span className="font-black text-sm" style={{ color: "#FF9A2E" }}>
                {p2Config.characterName}
              </span>
            </div>
            <div
              className="relative h-5 rounded-full overflow-hidden"
              style={{ background: "#243249" }}
              data-ocid="game.p2_health"
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${p2HealthPct}%`,
                  background: "linear-gradient(90deg, #FF9A2E, #e8891a)",
                  marginLeft: "auto",
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-black">
                {p2Health}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          border: "2px solid #243249",
          boxShadow: "0 0 40px rgba(0,0,0,0.8)",
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="block"
          style={{ maxWidth: "100%", height: "auto" }}
          tabIndex={0}
          data-ocid="game.canvas_target"
        />

        {/* Vehicle picker overlay */}
        {showVehiclePicker && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(7,11,18,0.9)" }}
            data-ocid="game.vehicle_picker"
          >
            <div
              className="rounded-2xl p-8"
              style={{ background: "#101A2A", border: "2px solid #FFD700" }}
            >
              <h3
                className="text-xl font-black text-center mb-4"
                style={{ color: "#FFD700" }}
              >
                ⚡ SWITCH VEHICLE
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {ALL_VEHICLES.map((vt, i) => (
                  <button
                    key={vt}
                    type="button"
                    onClick={() => switchVehicle(vt)}
                    className="rounded-xl p-3 flex flex-col items-center transition-all hover:scale-110"
                    style={{
                      background: "#1a2a3a",
                      border: "2px solid #243249",
                      outline: "none",
                    }}
                    data-ocid={`game.vehicle_option.${i + 1}`}
                  >
                    <span className="text-3xl">{VEHICLE_EMOJI[vt]}</span>
                    <span
                      className="text-xs font-bold mt-1"
                      style={{ color: "#F2F6FF" }}
                    >
                      {vt}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (gsRef.current) {
                    gsRef.current.showVehiclePicker = false;
                  }
                  setShowVehiclePicker(false);
                }}
                className="mt-4 w-full py-2 rounded-lg font-bold"
                style={{ background: "#243249", color: "#B7C2D6" }}
                data-ocid="game.vehicle_picker_close"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls hint + back */}
      <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
        <div className="text-xs" style={{ color: "#4a5a70" }}>
          P1: WASD move · F shoot
          {isAdmin && " · G god · T fly · V vehicle · C coins"}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          style={{ color: "#4a5a70" }}
          data-ocid="game.back_button"
        >
          Quit
        </Button>
        <div className="text-xs text-right" style={{ color: "#4a5a70" }}>
          P2: Arrow keys · K shoot
        </div>
      </div>
    </div>
  );
}
