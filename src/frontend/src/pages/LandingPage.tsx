import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ChevronDown,
  Lock,
  Shield,
  Star,
  Users,
  Wifi,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Character, GameMap, GunSkin, Vehicle } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface Props {
  isAdmin: boolean;
  onPlay: () => void;
  onAdmin: () => void;
  onPlayOnline: () => void;
}

const VEHICLE_INFO: Record<string, { emoji: string; label: string }> = {
  car: { emoji: "🚗", label: "Car" },
  van: { emoji: "🚐", label: "Van" },
  bike: { emoji: "🏍️", label: "Bike" },
  tank: { emoji: "🪖", label: "Tank" },
  plane: { emoji: "✈️", label: "Plane" },
  ship: { emoji: "🚢", label: "Ship" },
  battle: { emoji: "⚔️", label: "Battle" },
  submarine: { emoji: "🚤", label: "Submarine" },
  speedboat: { emoji: "🛥️", label: "Speedboat" },
  warship: { emoji: "🚢", label: "Warship" },
  yacht: { emoji: "⛵", label: "Yacht" },
};

function StatBar({
  value,
  max = 10,
  color,
}: { value: number; max?: number; color: string }) {
  return (
    <div className="w-full h-2 rounded-full" style={{ background: "#243249" }}>
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%`, background: color }}
      />
    </div>
  );
}

export default function LandingPage({
  isAdmin,
  onPlay,
  onAdmin,
  onPlayOnline,
}: Props) {
  const { actor, isFetching } = useActor();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [gunSkins, setGunSkins] = useState<GunSkin[]>([]);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    Promise.all([
      actor.getAllCharacters(),
      actor.getAllVehicles(),
      actor.getAllGunSkins(),
      actor.getAllMaps(),
    ]).then(([chars, vehs, guns, gameMaps]) => {
      setCharacters(chars);
      setVehicles(vehs);
      setGunSkins(guns);
      setMaps(gameMaps);
      setLoading(false);
    });
  }, [actor, isFetching]);

  return (
    <div className="min-h-screen" style={{ color: "#F2F6FF" }}>
      {/* Sticky Nav */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(7,11,18,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #243249",
        }}
        data-ocid="nav.panel"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-2xl font-black tracking-wider"
            style={{ color: "#2D8CFF" }}
          >
            ⚡ BrawlVerse
          </span>
          {isAdmin && (
            <span
              className="text-xs font-black px-3 py-1 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,154,46,0.15))",
                border: "1px solid #FFD700",
                color: "#FFD700",
                boxShadow: "0 0 12px rgba(255,215,0,0.3)",
              }}
            >
              👑 OWNER MODE
            </span>
          )}
        </div>
        <div
          className="hidden md:flex items-center gap-6 text-sm font-medium"
          style={{ color: "#B7C2D6" }}
        >
          <a href="#characters" className="hover:text-white transition-colors">
            Fighters
          </a>
          <a href="#arenas" className="hover:text-white transition-colors">
            Arenas
          </a>
          <a href="#vehicles" className="hover:text-white transition-colors">
            Vehicles
          </a>
          <a href="#guns" className="hover:text-white transition-colors">
            Weapons
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onPlayOnline}
            variant="outline"
            className="font-black tracking-widest text-sm px-4 py-2"
            style={{
              borderColor: "#FF9A2E",
              color: "#FF9A2E",
              background: "transparent",
            }}
            data-ocid="nav.secondary_button"
          >
            <Wifi className="mr-2 h-4 w-4" />
            ONLINE
          </Button>
          <Button
            onClick={onPlay}
            className="font-black tracking-widest text-sm px-6 py-2"
            style={{
              background: "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
              border: "none",
            }}
            data-ocid="nav.primary_button"
          >
            PLAY NOW
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 py-32">
        <div
          className="text-8xl md:text-9xl font-black mb-4 tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, #2D8CFF 0%, #B7C2D6 50%, #FF9A2E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          BrawlVerse
        </div>
        <p
          className="text-xl md:text-2xl mb-4 font-bold"
          style={{ color: "#B7C2D6" }}
        >
          The Ultimate Browser Combat Arena
        </p>
        <p className="text-base mb-10 max-w-xl" style={{ color: "#7a8fa8" }}>
          Choose your fighter, mount your vehicle, equip your weapon. Battle
          locally or online — right in your browser.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            onClick={onPlay}
            size="lg"
            className="font-black tracking-widest text-lg px-10 py-4 h-auto"
            style={{
              background: "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
              border: "none",
              boxShadow: "0 0 32px rgba(45,140,255,0.4)",
            }}
            data-ocid="hero.primary_button"
          >
            ⚔️ PLAY LOCAL
          </Button>
          <Button
            onClick={onPlayOnline}
            size="lg"
            className="font-black tracking-widest text-lg px-10 py-4 h-auto"
            style={{
              background: "linear-gradient(135deg, #FF9A2E, #e07820)",
              border: "none",
              boxShadow: "0 0 32px rgba(255,154,46,0.4)",
              color: "#000",
            }}
            data-ocid="hero.secondary_button"
          >
            <Wifi className="mr-2 h-5 w-5" />
            PLAY ONLINE
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="font-bold tracking-wider text-base px-8 py-4 h-auto"
            style={{
              borderColor: "#243249",
              color: "#B7C2D6",
              background: "transparent",
            }}
            onClick={() =>
              document
                .getElementById("characters")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            data-ocid="hero.link"
          >
            Explore Fighters <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-8 mt-16 text-center">
          <div>
            <div className="text-3xl font-black" style={{ color: "#2D8CFF" }}>
              2P
            </div>
            <div className="text-xs" style={{ color: "#7a8fa8" }}>
              LOCAL COOP
            </div>
          </div>
          <div>
            <div className="text-3xl font-black" style={{ color: "#FF9A2E" }}>
              20P
            </div>
            <div className="text-xs" style={{ color: "#7a8fa8" }}>
              ONLINE ROOMS
            </div>
          </div>
          <div>
            <div className="text-3xl font-black" style={{ color: "#2D8CFF" }}>
              7
            </div>
            <div className="text-xs" style={{ color: "#7a8fa8" }}>
              VEHICLES
            </div>
          </div>
          <div>
            <div className="text-3xl font-black" style={{ color: "#2D8CFF" }}>
              4+
            </div>
            <div className="text-xs" style={{ color: "#7a8fa8" }}>
              ARENAS
            </div>
          </div>
        </div>
      </section>

      {/* Characters */}
      <section id="characters" className="px-6 py-20 max-w-7xl mx-auto">
        <h2
          className="text-4xl font-black text-center mb-2"
          style={{ color: "#F2F6FF" }}
        >
          Choose Your Fighter
        </h2>
        <p className="text-center mb-12" style={{ color: "#7a8fa8" }}>
          Each warrior brings unique stats to the arena
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }, (_, i) => `skel-char-${i}`).map((k) => (
                <Skeleton
                  key={k}
                  className="h-48 rounded-xl"
                  style={{ background: "#101A2A" }}
                />
              ))
            : characters.map((char, i) => (
                <div
                  key={char.name}
                  className="rounded-xl p-6 transition-all hover:scale-105"
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                  data-ocid={`characters.item.${i + 1}`}
                >
                  <div className="text-4xl mb-3">🥊</div>
                  <h3
                    className="text-xl font-black mb-1"
                    style={{ color: "#F2F6FF" }}
                  >
                    {char.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "#7a8fa8" }}>
                    {char.description}
                  </p>
                  <div className="space-y-2">
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-16">Speed</span>
                      <StatBar value={Number(char.speed)} color="#2D8CFF" />
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-16">Strength</span>
                      <StatBar value={Number(char.strength)} color="#FF9A2E" />
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-16">Agility</span>
                      <StatBar value={Number(char.agility)} color="#2D8CFF" />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Arenas */}
      <section
        id="arenas"
        className="px-6 py-20"
        style={{ background: "rgba(16,26,42,0.5)" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-4xl font-black text-center mb-2"
            style={{ color: "#F2F6FF" }}
          >
            Battle Arenas
          </h2>
          <p className="text-center mb-12" style={{ color: "#7a8fa8" }}>
            Fight across legendary landscapes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }, (_, i) => `skel-${i}`).map((k) => (
                  <Skeleton
                    key={k}
                    className="h-40 rounded-xl"
                    style={{ background: "#101A2A" }}
                  />
                ))
              : maps.map((map, i) => {
                  const themes: Record<string, { bg: string; emoji: string }> =
                    {
                      Jungle: {
                        bg: "linear-gradient(135deg, #0a2a0a, #1a4a1a)",
                        emoji: "🌿",
                      },
                      City: {
                        bg: "linear-gradient(135deg, #1a1a2e, #2a2a4e)",
                        emoji: "🏙️",
                      },
                      Castle: {
                        bg: "linear-gradient(135deg, #1a0a2e, #2a1a4e)",
                        emoji: "🏰",
                      },
                      "Space Station": {
                        bg: "linear-gradient(135deg, #020210, #0a0a30)",
                        emoji: "🚀",
                      },
                    };
                  const theme = themes[map.name] || {
                    bg: "linear-gradient(135deg, #101A2A, #1a2a4a)",
                    emoji: "⚔️",
                  };
                  return (
                    <div
                      key={map.name}
                      className="rounded-xl p-6 flex flex-col items-center justify-center text-center h-40 transition-all hover:scale-105"
                      style={{
                        background: theme.bg,
                        border: "1px solid #243249",
                      }}
                      data-ocid={`arenas.item.${i + 1}`}
                    >
                      <div className="text-4xl mb-2">{theme.emoji}</div>
                      <h3
                        className="text-lg font-black"
                        style={{ color: "#F2F6FF" }}
                      >
                        {map.name}
                      </h3>
                      <Badge
                        className="mt-2 text-xs"
                        style={{
                          background: "rgba(45,140,255,0.2)",
                          color: "#2D8CFF",
                          border: "1px solid #2D8CFF",
                        }}
                      >
                        {map.theme}
                      </Badge>
                    </div>
                  );
                })}
          </div>
        </div>
      </section>

      {/* Vehicles */}
      <section id="vehicles" className="px-6 py-20 max-w-7xl mx-auto">
        <h2
          className="text-4xl font-black text-center mb-2"
          style={{ color: "#F2F6FF" }}
        >
          Combat Vehicles
        </h2>
        <p className="text-center mb-12" style={{ color: "#7a8fa8" }}>
          Your ride changes everything
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {(loading ? [] : vehicles).length === 0 && !loading
            ? Object.entries(VEHICLE_INFO).map(([key, info], i) => (
                <div
                  key={key}
                  className="rounded-xl p-5 text-center transition-all hover:scale-105"
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                  data-ocid={`vehicles.item.${i + 1}`}
                >
                  <div className="text-4xl mb-2">{info.emoji}</div>
                  <div className="font-black" style={{ color: "#F2F6FF" }}>
                    {info.label}
                  </div>
                </div>
              ))
            : vehicles.map((v, i) => (
                <div
                  key={v.name}
                  className="rounded-xl p-5 transition-all hover:scale-105"
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                  data-ocid={`vehicles.item.${i + 1}`}
                >
                  <div className="text-4xl mb-2">
                    {VEHICLE_INFO[v.vehicleType]?.emoji ?? "🚗"}
                  </div>
                  <div className="font-black mb-1" style={{ color: "#F2F6FF" }}>
                    {v.name}
                  </div>
                  <div className="text-xs mb-3" style={{ color: "#7a8fa8" }}>
                    {v.vehicleType}
                  </div>
                  <div className="space-y-1">
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-14">Speed</span>
                      <StatBar value={Number(v.speed)} color="#2D8CFF" />
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-14">Armor</span>
                      <StatBar value={Number(v.armor)} color="#FF9A2E" />
                    </div>
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "#B7C2D6" }}
                    >
                      <span className="w-14">Firepower</span>
                      <StatBar value={Number(v.firepower)} color="#2D8CFF" />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </section>

      {/* Gun Skins */}
      <section
        id="guns"
        className="px-6 py-20"
        style={{ background: "rgba(16,26,42,0.5)" }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-4xl font-black text-center mb-2"
            style={{ color: "#F2F6FF" }}
          >
            Weapon Skins
          </h2>
          <p className="text-center mb-12" style={{ color: "#7a8fa8" }}>
            Rare skins for deadly weapons
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 3 }, (_, i) => `skel-${i}`).map((k) => (
                  <Skeleton
                    key={k}
                    className="h-36 rounded-xl"
                    style={{ background: "#101A2A" }}
                  />
                ))
              : gunSkins.map((skin, i) => {
                  const rarity = Number(skin.rarity);
                  const rarityColor =
                    rarity >= 5
                      ? "#FFD700"
                      : rarity >= 3
                        ? "#FF9A2E"
                        : "#2D8CFF";
                  const rarityLabel =
                    rarity >= 5 ? "Legendary" : rarity >= 3 ? "Rare" : "Common";
                  return (
                    <div
                      key={skin.name}
                      className="rounded-xl p-6 transition-all hover:scale-105"
                      style={{
                        background: "#101A2A",
                        border: `1px solid ${rarityColor}40`,
                      }}
                      data-ocid={`guns.item.${i + 1}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-3xl">🔫</div>
                        <Badge
                          style={{
                            background: `${rarityColor}20`,
                            color: rarityColor,
                            border: `1px solid ${rarityColor}`,
                          }}
                        >
                          {rarityLabel}
                        </Badge>
                      </div>
                      <h3
                        className="text-lg font-black mb-1"
                        style={{ color: "#F2F6FF" }}
                      >
                        {skin.name}
                      </h3>
                      <p className="text-sm mb-3" style={{ color: "#7a8fa8" }}>
                        {skin.description}
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className="h-4 w-4"
                            style={{
                              fill: n <= rarity ? rarityColor : "transparent",
                              color: rarityColor,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2
          className="text-4xl font-black text-center mb-12"
          style={{ color: "#F2F6FF" }}
        >
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div
            className="rounded-2xl p-8"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
          >
            <Users className="h-10 w-10 mb-4" style={{ color: "#2D8CFF" }} />
            <h3
              className="text-2xl font-black mb-3"
              style={{ color: "#F2F6FF" }}
            >
              Local 2-Player
            </h3>
            <p style={{ color: "#B7C2D6" }}>
              Two players, one keyboard. Player 1 uses WASD + F to shoot. Player
              2 uses Arrow Keys + K. No internet required for the fight!
            </p>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
          >
            <Wifi className="h-10 w-10 mb-4" style={{ color: "#FF9A2E" }} />
            <h3
              className="text-2xl font-black mb-3"
              style={{ color: "#F2F6FF" }}
            >
              Online Multiplayer
            </h3>
            <p style={{ color: "#B7C2D6" }}>
              Create a room and share the code with friends, or jump into a
              Quick Match. Up to 20 players per room with real-time in-game
              chat!
            </p>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
          >
            <Shield className="h-10 w-10 mb-4" style={{ color: "#2D8CFF" }} />
            <h3
              className="text-2xl font-black mb-3"
              style={{ color: "#F2F6FF" }}
            >
              Health Bars
            </h3>
            <p style={{ color: "#B7C2D6" }}>
              Every fighter starts with 100HP modified by their vehicle armor.
              Shoot your opponent, dodge their bullets, and be the last one
              standing!
            </p>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
          >
            <Zap className="h-10 w-10 mb-4" style={{ color: "#2D8CFF" }} />
            <h3
              className="text-2xl font-black mb-3"
              style={{ color: "#F2F6FF" }}
            >
              Vehicle Perks
            </h3>
            <p style={{ color: "#B7C2D6" }}>
              Tanks are slow but nearly indestructible. Bikes are lightning fast
              but fragile. Planes can FLY. Choose your combat style!
            </p>
          </div>
          <div
            className="rounded-2xl p-8"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
          >
            <Star className="h-10 w-10 mb-4" style={{ color: "#FFD700" }} />
            <h3
              className="text-2xl font-black mb-3"
              style={{ color: "#F2F6FF" }}
            >
              Owner God Mode
            </h3>
            <p style={{ color: "#B7C2D6" }}>
              Admins can activate God Mode, fly freely, switch vehicles
              mid-battle, and collect coins. Absolute power in the arena!
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-12 text-center"
        style={{ borderTop: "1px solid #243249" }}
      >
        <div className="mb-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={isAdmin ? onAdmin : undefined}
                  className="font-bold tracking-wider"
                  style={{
                    borderColor: isAdmin ? "#FFD700" : "#243249",
                    color: isAdmin ? "#FFD700" : "#7a8fa8",
                    background: "transparent",
                    cursor: isAdmin ? "pointer" : "not-allowed",
                    opacity: isAdmin ? 1 : 0.5,
                  }}
                  data-ocid="footer.admin_button"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  ADMIN PANEL ACCESS
                </Button>
              </TooltipTrigger>
              {!isAdmin && (
                <TooltipContent>Admin access required</TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm" style={{ color: "#4a5a70" }}>
          © {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
            style={{ color: "#2D8CFF" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
