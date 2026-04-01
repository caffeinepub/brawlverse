import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlayerConfig } from "../App";
import type { Character, GameMap, GunSkin, Vehicle } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface Props {
  onStart: (p1: PlayerConfig, p2: PlayerConfig, mapName: string) => void;
  onBack: () => void;
}

const MAP_INFO: Record<string, string> = {
  Jungle: "🌿",
  City: "🏙️",
  Castle: "🏰",
  "Space Station": "🚀",
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

interface PlayerState {
  character: Character | null;
  vehicle: Vehicle | null;
  gunSkin: GunSkin | null;
}

function SelectionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl p-4 transition-all hover:scale-102 cursor-pointer"
      style={{
        background: selected ? "rgba(45,140,255,0.15)" : "#101A2A",
        border: selected ? "2px solid #2D8CFF" : "2px solid #243249",
        outline: "none",
      }}
    >
      {children}
      {selected && (
        <Check
          className="h-4 w-4 ml-auto mt-1 float-right"
          style={{ color: "#2D8CFF" }}
        />
      )}
    </button>
  );
}

function PlayerColumn({
  player,
  colorHex,
  state,
  characters,
  vehicles,
  gunSkins,
  onSelect,
}: {
  player: string;
  colorHex: string;
  state: PlayerState;
  characters: Character[];
  vehicles: Vehicle[];
  gunSkins: GunSkin[];
  onSelect: (update: Partial<PlayerState>) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div
        className="text-center py-3 mb-6 rounded-xl font-black text-lg tracking-widest"
        style={{
          background: `${colorHex}22`,
          border: `2px solid ${colorHex}`,
          color: colorHex,
        }}
      >
        {player}
      </div>

      {/* Characters */}
      <div className="mb-6">
        <h3
          className="font-bold mb-3 text-sm tracking-widest"
          style={{ color: "#B7C2D6" }}
        >
          FIGHTER
        </h3>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {characters.map((c) => (
            <SelectionCard
              key={c.name}
              selected={state.character?.name === c.name}
              onClick={() => onSelect({ character: c })}
            >
              <div className="font-bold text-sm" style={{ color: "#F2F6FF" }}>
                {c.name}
              </div>
              <div className="text-xs" style={{ color: "#7a8fa8" }}>
                {c.description.slice(0, 50)}…
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* Vehicles */}
      <div className="mb-6">
        <h3
          className="font-bold mb-3 text-sm tracking-widest"
          style={{ color: "#B7C2D6" }}
        >
          VEHICLE
        </h3>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {vehicles.map((v) => (
            <SelectionCard
              key={v.name}
              selected={state.vehicle?.name === v.name}
              onClick={() => onSelect({ vehicle: v })}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {VEHICLE_EMOJI[v.vehicleType] ?? "🚗"}
                </span>
                <div>
                  <div
                    className="font-bold text-sm"
                    style={{ color: "#F2F6FF" }}
                  >
                    {v.name}
                  </div>
                  <div className="text-xs" style={{ color: "#7a8fa8" }}>
                    SPD:{Number(v.speed)} ARM:{Number(v.armor)}
                  </div>
                </div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>

      {/* Gun Skins */}
      <div>
        <h3
          className="font-bold mb-3 text-sm tracking-widest"
          style={{ color: "#B7C2D6" }}
        >
          WEAPON SKIN
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {gunSkins.map((g) => (
            <SelectionCard
              key={g.name}
              selected={state.gunSkin?.name === g.name}
              onClick={() => onSelect({ gunSkin: g })}
            >
              <div className="flex items-center gap-2">
                <span>🔫</span>
                <div>
                  <div
                    className="font-bold text-sm"
                    style={{ color: "#F2F6FF" }}
                  >
                    {g.name}
                  </div>
                  <div className="text-xs" style={{ color: "#7a8fa8" }}>
                    Rarity: {"⭐".repeat(Math.min(Number(g.rarity), 5))}
                  </div>
                </div>
              </div>
            </SelectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function GameSetup({ onStart, onBack }: Props) {
  const { actor, isFetching } = useActor();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [gunSkins, setGunSkins] = useState<GunSkin[]>([]);
  const [maps, setMaps] = useState<GameMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMap, setSelectedMap] = useState<string>("Jungle");
  const [p1, setP1] = useState<PlayerState>({
    character: null,
    vehicle: null,
    gunSkin: null,
  });
  const [p2, setP2] = useState<PlayerState>({
    character: null,
    vehicle: null,
    gunSkin: null,
  });

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

  const canStart =
    p1.character &&
    p1.vehicle &&
    p1.gunSkin &&
    p2.character &&
    p2.vehicle &&
    p2.gunSkin;

  const handleStart = () => {
    if (!canStart) return;
    onStart(
      {
        characterName: p1.character!.name,
        vehicleName: p1.vehicle!.name,
        vehicleType: p1.vehicle!.vehicleType as string,
        gunSkinName: p1.gunSkin!.name,
      },
      {
        characterName: p2.character!.name,
        vehicleName: p2.vehicle!.name,
        vehicleType: p2.vehicle!.vehicleType as string,
        gunSkinName: p2.gunSkin!.name,
      },
      selectedMap,
    );
  };

  return (
    <div className="min-h-screen px-4 py-8" style={{ color: "#F2F6FF" }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-sm"
            style={{ color: "#B7C2D6" }}
            data-ocid="setup.back_button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        <h1
          className="text-4xl font-black text-center tracking-tight"
          style={{ color: "#F2F6FF" }}
        >
          SELECT YOUR LOADOUT
        </h1>
        <p className="text-center mt-2" style={{ color: "#7a8fa8" }}>
          Choose fighter, vehicle, and weapon skin for each player
        </p>
      </div>

      {loading ? (
        <div className="max-w-6xl mx-auto grid grid-cols-2 gap-8">
          <Skeleton
            className="h-96 rounded-2xl"
            style={{ background: "#101A2A" }}
          />
          <Skeleton
            className="h-96 rounded-2xl"
            style={{ background: "#101A2A" }}
          />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto">
          {/* Player columns */}
          <div className="flex gap-6 mb-8">
            <PlayerColumn
              player="PLAYER 1"
              colorHex="#2D8CFF"
              state={p1}
              characters={characters}
              vehicles={vehicles}
              gunSkins={gunSkins}
              onSelect={(u) => setP1((prev) => ({ ...prev, ...u }))}
            />
            <div className="w-px" style={{ background: "#243249" }} />
            <PlayerColumn
              player="PLAYER 2"
              colorHex="#FF9A2E"
              state={p2}
              characters={characters}
              vehicles={vehicles}
              gunSkins={gunSkins}
              onSelect={(u) => setP2((prev) => ({ ...prev, ...u }))}
            />
          </div>

          {/* Map selection */}
          <div className="mb-8">
            <h2
              className="text-center font-black text-lg tracking-widest mb-4"
              style={{ color: "#B7C2D6" }}
            >
              SELECT ARENA
            </h2>
            <div className="flex gap-4 justify-center flex-wrap">
              {maps.map((m, i) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setSelectedMap(m.name)}
                  className="rounded-xl px-6 py-4 flex flex-col items-center transition-all hover:scale-105"
                  style={{
                    background:
                      selectedMap === m.name
                        ? "rgba(45,140,255,0.2)"
                        : "#101A2A",
                    border:
                      selectedMap === m.name
                        ? "2px solid #2D8CFF"
                        : "2px solid #243249",
                    outline: "none",
                  }}
                  data-ocid={`setup.map_button.${i + 1}`}
                >
                  <span className="text-3xl">{MAP_INFO[m.name] ?? "⚔️"}</span>
                  <span
                    className="font-bold text-sm mt-1"
                    style={{
                      color: selectedMap === m.name ? "#2D8CFF" : "#F2F6FF",
                    }}
                  >
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Fight button */}
          <div className="text-center">
            <Button
              onClick={handleStart}
              disabled={!canStart}
              size="lg"
              className="font-black tracking-widest text-xl px-16 py-5 h-auto"
              style={{
                background: canStart
                  ? "linear-gradient(135deg, #2D8CFF, #1a6fd8)"
                  : "#243249",
                border: "none",
                boxShadow: canStart ? "0 0 40px rgba(45,140,255,0.5)" : "none",
                color: canStart ? "white" : "#4a5a70",
              }}
              data-ocid="setup.fight_button"
            >
              ⚔️ FIGHT!
            </Button>
            {!canStart && (
              <p className="mt-3 text-sm" style={{ color: "#7a8fa8" }}>
                Both players must select a fighter, vehicle, and weapon skin
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
