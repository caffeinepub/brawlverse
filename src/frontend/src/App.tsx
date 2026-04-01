import { useEffect, useState } from "react";
import type { Room } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPanel from "./pages/AdminPanel";
import GameScreen from "./pages/GameScreen";
import GameSetup from "./pages/GameSetup";
import LandingPage from "./pages/LandingPage";
import OnlineLobby from "./pages/OnlineLobby";
import WinScreen from "./pages/WinScreen";

export type AppView =
  | "landing"
  | "setup"
  | "game"
  | "win"
  | "admin"
  | "online-lobby"
  | "online-game";

export interface PlayerConfig {
  characterName: string;
  vehicleName: string;
  vehicleType: string;
  gunSkinName: string;
}

export default function App() {
  const [view, setView] = useState<AppView>("landing");
  const [isAdmin, setIsAdmin] = useState(false);
  const [p1Config, setP1Config] = useState<PlayerConfig | null>(null);
  const [p2Config, setP2Config] = useState<PlayerConfig | null>(null);
  const [selectedMap, setSelectedMap] = useState("Jungle");
  const [winner, setWinner] = useState("");
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [onlineDisplayName, setOnlineDisplayName] = useState("");
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  useEffect(() => {
    if (!actor) return;
    // Check v2 seed key to ensure Seas map is seeded
    const seededV2 = localStorage.getItem("brawlverse_seeded_v2");
    const tasks: Promise<unknown>[] = [actor.isCallerAdmin()];
    if (!seededV2) {
      tasks.push(actor.seedInitialData());
    }
    Promise.all(tasks)
      .then(([adminResult]) => {
        setIsAdmin(adminResult as boolean);
        if (!seededV2) localStorage.setItem("brawlverse_seeded_v2", "1");
      })
      .catch(() => {
        // silent — seed failure should not break the app
      });
  }, [actor]);

  const handleStart = (p1: PlayerConfig, p2: PlayerConfig, mapName: string) => {
    setP1Config(p1);
    setP2Config(p2);
    setSelectedMap(mapName);
    setView("game");
  };

  const handleWin = (winnerName: string) => {
    setWinner(winnerName);
    setView("win");
  };

  const handleOnlineWin = async (winnerName: string) => {
    setWinner(winnerName);
    if (actor && currentRoom) {
      try {
        await actor.endMatch(currentRoom.code);
      } catch {
        // silent
      }
    }
    setView("win");
  };

  const handleStartOnlineGame = (room: Room, displayName: string) => {
    const myPrincipal = identity?.getPrincipal().toString();
    const myPlayer = room.players.find(
      (p) => p.principal.toString() === myPrincipal,
    );
    const config: PlayerConfig = {
      characterName:
        myPlayer?.characterName ?? room.players[0]?.characterName ?? "Warrior",
      vehicleName:
        myPlayer?.vehicleName ?? room.players[0]?.vehicleName ?? "Car",
      vehicleType: "car",
      gunSkinName:
        myPlayer?.gunSkinName ?? room.players[0]?.gunSkinName ?? "Default",
    };
    const otherPlayer = room.players.find(
      (p) => p.principal.toString() !== myPrincipal,
    );
    const p2: PlayerConfig = {
      characterName: otherPlayer?.characterName ?? "Fighter",
      vehicleName: otherPlayer?.vehicleName ?? "Bike",
      vehicleType: "bike",
      gunSkinName: otherPlayer?.gunSkinName ?? "Default",
    };
    setCurrentRoom(room);
    setOnlineDisplayName(displayName);
    setP1Config(config);
    setP2Config(p2);
    setSelectedMap(room.selectedMap || "Jungle");
    setView("online-game");
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #070B12 0%, #0B1220 100%)",
      }}
    >
      {view === "landing" && (
        <LandingPage
          isAdmin={isAdmin}
          onPlay={() => setView("setup")}
          onAdmin={() => setView("admin")}
          onPlayOnline={() => setView("online-lobby")}
        />
      )}
      {view === "setup" && (
        <GameSetup onStart={handleStart} onBack={() => setView("landing")} />
      )}
      {view === "game" && p1Config && p2Config && (
        <GameScreen
          p1Config={p1Config}
          p2Config={p2Config}
          mapName={selectedMap}
          isAdmin={isAdmin}
          onWin={handleWin}
          onBack={() => setView("setup")}
        />
      )}
      {view === "online-lobby" && (
        <OnlineLobby
          isAdmin={isAdmin}
          onStartOnlineGame={handleStartOnlineGame}
          onBack={() => setView("landing")}
        />
      )}
      {view === "online-game" && p1Config && p2Config && (
        <div className="relative">
          <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-2 text-xs font-black tracking-widest gap-3"
            style={{
              background: "rgba(45,140,255,0.9)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            🌐 ONLINE MATCH — ROOM {currentRoom?.code} — {onlineDisplayName}
            {isAdmin && (
              <span
                className="px-2 py-0.5 rounded text-xs font-black"
                style={{ background: "#FFD700", color: "#000" }}
              >
                👑 OWNER
              </span>
            )}
          </div>
          <div className="pt-8">
            <GameScreen
              p1Config={p1Config}
              p2Config={p2Config}
              mapName={selectedMap}
              isAdmin={isAdmin}
              onWin={handleOnlineWin}
              onBack={() => {
                setView("online-lobby");
                setCurrentRoom(null);
              }}
            />
          </div>
        </div>
      )}
      {view === "win" && (
        <WinScreen
          winner={winner}
          onPlayAgain={() =>
            currentRoom ? setView("online-lobby") : setView("setup")
          }
          onMainMenu={() => {
            setCurrentRoom(null);
            setView("landing");
          }}
        />
      )}
      {view === "admin" && (
        <AdminPanel isAdmin={isAdmin} onBack={() => setView("landing")} />
      )}
    </div>
  );
}
