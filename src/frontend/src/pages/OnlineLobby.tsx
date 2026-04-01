import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Play,
  RefreshCw,
  Shuffle,
  Users,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  Character,
  ChatMessage,
  GameMap,
  GunSkin,
  Room,
  Vehicle,
} from "../backend.d";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface Props {
  isAdmin?: boolean;
  onStartOnlineGame: (room: Room, displayName: string) => void;
  onBack: () => void;
}

type LobbyStep = "enter" | "menu" | "room";

const PLAYER_COLORS = [
  "#2D8CFF",
  "#FF9A2E",
  "#2DFF8C",
  "#FF2D8C",
  "#8C2DFF",
  "#FFD700",
  "#00CFFF",
  "#FF6B35",
];

function getPlayerColor(index: number) {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export default function OnlineLobby({
  isAdmin = false,
  onStartOnlineGame,
  onBack,
}: Props) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const myPrincipal = identity?.getPrincipal().toString();

  const [step, setStep] = useState<LobbyStep>("enter");
  const [displayName, setDisplayName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadoutOpen, setLoadoutOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [gunSkins, setGunSkins] = useState<GunSkin[]>([]);
  const [selChar, setSelChar] = useState("");
  const [selVehicle, setSelVehicle] = useState("");
  const [selGun, setSelGun] = useState("");
  const [maps, setMaps] = useState<string[]>([
    "Jungle",
    "City",
    "Castle",
    "Space Station",
    "Seas",
  ]);
  const [readyLoading, setReadyLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load assets for loadout picker
  useEffect(() => {
    if (!actor) return;
    Promise.all([
      actor.getAllCharacters(),
      actor.getAllVehicles(),
      actor.getAllGunSkins(),
      actor.getAllMaps(),
    ]).then(([chars, vehs, guns, gameMaps]) => {
      setCharacters(chars);
      setVehicles(vehs);
      setGunSkins(guns);
      const mapList = (gameMaps as GameMap[]).map((m) => m.name);
      if (mapList.length > 0) setMaps(mapList);
      if (chars.length > 0) setSelChar(chars[0].name);
      if (vehs.length > 0) setSelVehicle(vehs[0].name);
      if (guns.length > 0) setSelGun(guns[0].name);
    });
  }, [actor]);

  // Polling
  useEffect(() => {
    if (!room || !actor) return;
    const poll = async () => {
      try {
        const [updatedRoom, newMessages] = await Promise.all([
          actor.getRoomByCode(room.code),
          actor.getRoomMessages(room.code),
        ]);
        if (updatedRoom) {
          setRoom(updatedRoom);
          if (updatedRoom.status === "playing") {
            clearInterval(pollRef.current!);
            onStartOnlineGame(updatedRoom, displayName);
          }
        }
        setMessages(newMessages);
      } catch {
        // silent
      }
    };
    pollRef.current = setInterval(poll, 3000);
    return () => clearInterval(pollRef.current!);
  }, [room, actor, displayName, onStartOnlineGame]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }); // eslint-disable-line -- intentionally runs after every render to scroll

  const handleCreateRoom = async () => {
    if (!actor || !displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const code = await actor.createRoom(displayName.trim());
      const joined = await actor.getRoomByCode(code);
      if (joined) {
        setRoom(joined);
        setStep("room");
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to create room");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!actor || !joinCode.trim() || !displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const joined = await actor.joinRoom(
        joinCode.trim().toUpperCase(),
        displayName.trim(),
      );
      setRoom(joined);
      setStep("room");
    } catch (e: any) {
      setError(e?.message ?? "Room not found or full");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMatch = async () => {
    if (!actor || !displayName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const code = await actor.joinRandomRoom(displayName.trim());
      const joined = await actor.getRoomByCode(code);
      if (joined) {
        setRoom(joined);
        setStep("room");
      }
    } catch (e: any) {
      setError(e?.message ?? "No open rooms found. Try creating one!");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!actor || !room) return;
    try {
      await actor.leaveRoom(room.code);
    } catch {
      // silent
    }
    clearInterval(pollRef.current!);
    setRoom(null);
    setMessages([]);
    setStep("menu");
  };

  const handleSendMessage = async () => {
    if (!actor || !room || !chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    try {
      await actor.sendChatMessage(room.code, displayName, msg);
      const newMessages = await actor.getRoomMessages(room.code);
      setMessages(newMessages);
    } catch {
      // silent
    }
  };

  const handleReadyUp = async () => {
    if (!actor || !room || !selChar || !selVehicle || !selGun) return;
    setReadyLoading(true);
    try {
      await actor.setPlayerReady(room.code, selChar, selVehicle, selGun);
      const updated = await actor.getRoomByCode(room.code);
      if (updated) setRoom(updated);
      setLoadoutOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Failed to ready up");
    } finally {
      setReadyLoading(false);
    }
  };

  const handleStartMatch = async () => {
    if (!actor || !room) return;
    setStartLoading(true);
    try {
      await actor.startMatch(room.code);
    } catch (e: any) {
      setError(e?.message ?? "Failed to start match");
    } finally {
      setStartLoading(false);
    }
  };

  const handleSetMap = async (mapName: string) => {
    if (!actor || !room) return;
    try {
      await actor.setRoomMap(room.code, mapName);
      const updated = await actor.getRoomByCode(room.code);
      if (updated) setRoom(updated);
    } catch {
      // silent
    }
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = room?.hostPrincipal.toString() === myPrincipal;
  const myPlayer = room?.players.find(
    (p) => p.principal.toString() === myPrincipal,
  );
  const readyCount = room?.players.filter((p) => p.isReady).length ?? 0;
  const canStart = isHost && readyCount >= 2;

  const s: React.CSSProperties = {
    color: "#F2F6FF",
  };

  // ENTER NAME SCREEN
  if (step === "enter") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={s}>
        <div
          className="rounded-2xl p-10 w-full max-w-md"
          style={{ background: "#0B1220", border: "1px solid #243249" }}
        >
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-sm mb-8 hover:text-white transition-colors"
            style={{ color: "#7a8fa8" }}
            data-ocid="online_lobby.link"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Menu
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Wifi className="h-7 w-7" style={{ color: "#2D8CFF" }} />
            <h1 className="text-3xl font-black tracking-wide">Play Online</h1>
          </div>
          <p className="mb-8 text-sm" style={{ color: "#7a8fa8" }}>
            Enter a display name to get started
          </p>
          <Label
            className="text-xs font-bold tracking-widest mb-2 block"
            style={{ color: "#B7C2D6" }}
          >
            DISPLAY NAME
          </Label>
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="YourName"
            maxLength={20}
            className="mb-6 font-bold text-base"
            style={{
              background: "#101A2A",
              border: "1px solid #243249",
              color: "#F2F6FF",
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && displayName.trim() && setStep("menu")
            }
            data-ocid="online_lobby.input"
          />
          <Button
            className="w-full font-black tracking-widest text-base"
            style={{
              background: "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
              border: "none",
              boxShadow: "0 0 24px rgba(45,140,255,0.3)",
            }}
            disabled={!displayName.trim()}
            onClick={() => setStep("menu")}
            data-ocid="online_lobby.primary_button"
          >
            CONTINUE
          </Button>
        </div>
      </div>
    );
  }

  // MENU SCREEN
  if (step === "menu") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={s}>
        <div
          className="rounded-2xl p-10 w-full max-w-md"
          style={{ background: "#0B1220", border: "1px solid #243249" }}
        >
          <button
            type="button"
            onClick={() => setStep("enter")}
            className="flex items-center gap-2 text-sm mb-8 hover:text-white transition-colors"
            style={{ color: "#7a8fa8" }}
            data-ocid="online_menu.link"
          >
            <ArrowLeft className="h-4 w-4" /> Change Name
          </button>
          <div className="flex items-center gap-3 mb-1">
            <Wifi className="h-7 w-7" style={{ color: "#2D8CFF" }} />
            <h1 className="text-3xl font-black tracking-wide">Online Arena</h1>
          </div>
          <p className="mb-8 text-sm" style={{ color: "#7a8fa8" }}>
            Playing as{" "}
            <span style={{ color: "#2D8CFF", fontWeight: 700 }}>
              {displayName}
            </span>
          </p>

          {error && (
            <div
              className="rounded-lg px-4 py-3 mb-4 text-sm"
              style={{
                background: "rgba(255,45,45,0.1)",
                border: "1px solid #FF2D2D",
                color: "#FF7070",
              }}
              data-ocid="online_menu.error_state"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full font-black tracking-widest text-base h-14"
              style={{
                background: "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
                border: "none",
                boxShadow: "0 0 24px rgba(45,140,255,0.3)",
              }}
              onClick={handleCreateRoom}
              disabled={loading}
              data-ocid="online_menu.primary_button"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Users className="mr-2 h-5 w-5" />
              )}
              CREATE ROOM
            </Button>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full font-bold tracking-wider text-base h-14"
                style={{
                  borderColor: showJoinInput ? "#2D8CFF" : "#243249",
                  color: "#F2F6FF",
                  background: "transparent",
                }}
                onClick={() => setShowJoinInput((v) => !v)}
                data-ocid="online_menu.secondary_button"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                JOIN BY CODE
              </Button>
              {showJoinInput && (
                <div className="flex gap-2">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE"
                    maxLength={8}
                    className="font-mono font-bold text-base tracking-widest"
                    style={{
                      background: "#101A2A",
                      border: "1px solid #2D8CFF",
                      color: "#2D8CFF",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    data-ocid="online_join.input"
                  />
                  <Button
                    onClick={handleJoinRoom}
                    disabled={loading || !joinCode.trim()}
                    style={{ background: "#2D8CFF", border: "none" }}
                    data-ocid="online_join.primary_button"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full font-bold tracking-wider text-base h-14"
              style={{
                borderColor: "#FF9A2E",
                color: "#FF9A2E",
                background: "transparent",
              }}
              onClick={handleQuickMatch}
              disabled={loading}
              data-ocid="online_quickmatch.button"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Shuffle className="mr-2 h-5 w-5" />
              )}
              QUICK MATCH
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ROOM LOBBY
  return (
    <div className="min-h-screen p-4 md:p-8" style={s}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="flex items-center gap-2 text-sm hover:text-white transition-colors"
            style={{ color: "#7a8fa8" }}
            data-ocid="room.link"
          >
            <ArrowLeft className="h-4 w-4" /> Leave Room
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold" style={{ color: "#7a8fa8" }}>
              ROOM CODE
            </span>
            <div
              className="flex items-center gap-2 rounded-lg px-4 py-2"
              style={{
                background: "#101A2A",
                border: "1px solid #2D8CFF",
                boxShadow: "0 0 16px rgba(45,140,255,0.15)",
              }}
            >
              <span
                className="font-mono font-black text-xl tracking-widest"
                style={{ color: "#2D8CFF" }}
              >
                {room?.code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="ml-1 rounded p-1 hover:bg-white/10 transition-colors"
                style={{ color: copied ? "#2DFF8C" : "#7a8fa8" }}
                title="Copy code"
                data-ocid="room.secondary_button"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Badge
            style={{
              background:
                room?.status === "waiting"
                  ? "rgba(45,140,255,0.15)"
                  : "rgba(45,255,140,0.15)",
              color: room?.status === "waiting" ? "#2D8CFF" : "#2DFF8C",
              border: `1px solid ${room?.status === "waiting" ? "#2D8CFF" : "#2DFF8C"}`,
            }}
          >
            {room?.status === "waiting" ? "⏳ Waiting" : "▶ Playing"}
          </Badge>
        </div>

        {error && (
          <div
            className="rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: "rgba(255,45,45,0.1)",
              border: "1px solid #FF2D2D",
              color: "#FF7070",
            }}
            data-ocid="room.error_state"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Player list */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "#0B1220", border: "1px solid #243249" }}
            >
              <h2 className="text-lg font-black tracking-wide mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: "#2D8CFF" }} />
                Players ({room?.players.length ?? 0}/20)
              </h2>
              <div className="space-y-3" data-ocid="room.list">
                {room?.players.map((player, i) => (
                  <div
                    key={player.principal.toString()}
                    className="flex items-center justify-between rounded-xl px-4 py-3"
                    style={{
                      background:
                        player.principal.toString() === myPrincipal
                          ? "rgba(45,140,255,0.08)"
                          : "#101A2A",
                      border: `1px solid ${player.principal.toString() === myPrincipal ? "#2D8CFF40" : "#243249"}`,
                    }}
                    data-ocid={`room.item.${i + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                        style={{ background: getPlayerColor(i), color: "#000" }}
                      >
                        {player.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {player.displayName}
                          {player.principal.toString() ===
                            room?.hostPrincipal.toString() && (
                            <Badge
                              className="text-xs px-1 py-0"
                              style={{
                                background: "rgba(255,215,0,0.15)",
                                color: "#FFD700",
                                border: "1px solid #FFD700",
                              }}
                            >
                              HOST
                            </Badge>
                          )}
                          {player.principal.toString() === myPrincipal && (
                            <Badge
                              className="text-xs px-1 py-0"
                              style={{
                                background: "rgba(45,140,255,0.15)",
                                color: "#2D8CFF",
                                border: "1px solid #2D8CFF",
                              }}
                            >
                              YOU
                            </Badge>
                          )}
                          {player.principal.toString() === myPrincipal &&
                            isAdmin && (
                              <Badge
                                className="text-xs px-1 py-0"
                                style={{
                                  background: "rgba(255,215,0,0.2)",
                                  color: "#FFD700",
                                  border: "1px solid #FFD700",
                                }}
                              >
                                👑 OWNER
                              </Badge>
                            )}
                        </div>
                        {player.isReady && (
                          <div className="text-xs" style={{ color: "#7a8fa8" }}>
                            {player.characterName} · {player.vehicleName} ·{" "}
                            {player.gunSkinName}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      style={{
                        background: player.isReady
                          ? "rgba(45,255,140,0.1)"
                          : "rgba(255,154,46,0.1)",
                        color: player.isReady ? "#2DFF8C" : "#FF9A2E",
                        border: `1px solid ${player.isReady ? "#2DFF8C" : "#FF9A2E"}`,
                      }}
                    >
                      {player.isReady ? "✓ Ready" : "Not Ready"}
                    </Badge>
                  </div>
                ))}
                {(room?.players.length ?? 0) === 0 && (
                  <div
                    className="text-center py-8 text-sm"
                    style={{ color: "#7a8fa8" }}
                    data-ocid="room.empty_state"
                  >
                    Waiting for players to join...
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setLoadoutOpen(true)}
                className="font-black tracking-wider flex-1"
                style={{
                  background: myPlayer?.isReady
                    ? "rgba(45,255,140,0.2)"
                    : "linear-gradient(135deg, #2D8CFF, #1a6fd8)",
                  border: myPlayer?.isReady ? "1px solid #2DFF8C" : "none",
                  color: myPlayer?.isReady ? "#2DFF8C" : "#fff",
                }}
                data-ocid="room.primary_button"
              >
                {myPlayer?.isReady ? (
                  <>
                    <Check className="mr-2 h-4 w-4" /> READY!
                  </>
                ) : (
                  "SELECT LOADOUT & READY UP"
                )}
              </Button>

              {isHost && (
                <div className="flex items-center gap-3">
                  <Select
                    value={room?.selectedMap ?? "Jungle"}
                    onValueChange={handleSetMap}
                  >
                    <SelectTrigger
                      className="w-40 font-bold"
                      style={{
                        background: "#101A2A",
                        border: "1px solid #243249",
                        color: "#F2F6FF",
                      }}
                      data-ocid="room.select"
                    >
                      <SelectValue placeholder="Select Map" />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "#101A2A",
                        border: "1px solid #243249",
                      }}
                    >
                      {maps.map((m) => (
                        <SelectItem
                          key={m}
                          value={m}
                          style={{ color: "#F2F6FF" }}
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleStartMatch}
                    disabled={!canStart || startLoading}
                    className="font-black tracking-wider"
                    style={{
                      background: canStart
                        ? "linear-gradient(135deg, #2DFF8C, #1ab868)"
                        : "#243249",
                      border: "none",
                      color: canStart ? "#000" : "#4a5a70",
                    }}
                    data-ocid="room.submit_button"
                  >
                    {startLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-2 h-4 w-4" />
                    )}
                    START MATCH
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div
            className="rounded-2xl flex flex-col"
            style={{
              background: "#0B1220",
              border: "1px solid #243249",
              height: "520px",
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid #243249" }}
            >
              <MessageSquare className="h-4 w-4" style={{ color: "#2D8CFF" }} />
              <span className="font-black text-sm tracking-wide">
                ROOM CHAT
              </span>
            </div>
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-2">
                {messages.length === 0 && (
                  <div
                    className="text-center text-xs py-4"
                    style={{ color: "#4a5a70" }}
                    data-ocid="chat.empty_state"
                  >
                    No messages yet. Say hello!
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMine = msg.senderPrincipal.toString() === myPrincipal;
                  const playerIndex =
                    room?.players.findIndex(
                      (p) =>
                        p.principal.toString() ===
                        msg.senderPrincipal.toString(),
                    ) ?? 0;
                  const nameColor = getPlayerColor(
                    playerIndex >= 0 ? playerIndex : 0,
                  );
                  return (
                    <div
                      key={`msg-${msg.timestamp.toString()}-${i}`}
                      className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                      data-ocid={`chat.item.${i + 1}`}
                    >
                      <span
                        className="text-xs font-bold mb-1"
                        style={{ color: nameColor }}
                      >
                        {msg.displayName}
                      </span>
                      <div
                        className="rounded-2xl px-3 py-2 text-sm max-w-[85%]"
                        style={{
                          background: isMine
                            ? "rgba(45,140,255,0.2)"
                            : "#101A2A",
                          border: isMine
                            ? "1px solid #2D8CFF40"
                            : "1px solid #243249",
                          color: "#F2F6FF",
                          borderRadius: isMine
                            ? "16px 4px 16px 16px"
                            : "4px 16px 16px 16px",
                        }}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>
            </ScrollArea>
            <div
              className="flex gap-2 px-3 py-3"
              style={{ borderTop: "1px solid #243249" }}
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="text-sm"
                style={{
                  background: "#101A2A",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                maxLength={200}
                data-ocid="chat.input"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!chatInput.trim()}
                size="sm"
                style={{ background: "#2D8CFF", border: "none", minWidth: 40 }}
                data-ocid="chat.submit_button"
              >
                ➤
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Loadout Dialog */}
      <Dialog open={loadoutOpen} onOpenChange={setLoadoutOpen}>
        <DialogContent
          className="max-w-lg"
          style={{
            background: "#0B1220",
            border: "1px solid #243249",
            color: "#F2F6FF",
          }}
          data-ocid="loadout.dialog"
        >
          <DialogHeader>
            <DialogTitle
              className="text-xl font-black tracking-wide"
              style={{ color: "#F2F6FF" }}
            >
              Select Loadout & Ready Up
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <Label
                className="text-xs font-bold tracking-widest mb-2 block"
                style={{ color: "#B7C2D6" }}
              >
                FIGHTER
              </Label>
              <Select value={selChar} onValueChange={setSelChar}>
                <SelectTrigger
                  className="w-full"
                  style={{
                    background: "#101A2A",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="loadout.select"
                >
                  <SelectValue placeholder="Choose character" />
                </SelectTrigger>
                <SelectContent
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                >
                  {characters.map((c) => (
                    <SelectItem
                      key={c.name}
                      value={c.name}
                      style={{ color: "#F2F6FF" }}
                    >
                      🥊 {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                className="text-xs font-bold tracking-widest mb-2 block"
                style={{ color: "#B7C2D6" }}
              >
                VEHICLE
              </Label>
              <Select value={selVehicle} onValueChange={setSelVehicle}>
                <SelectTrigger
                  className="w-full"
                  style={{
                    background: "#101A2A",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                >
                  <SelectValue placeholder="Choose vehicle" />
                </SelectTrigger>
                <SelectContent
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                >
                  {vehicles.map((v) => (
                    <SelectItem
                      key={v.name}
                      value={v.name}
                      style={{ color: "#F2F6FF" }}
                    >
                      🚗 {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label
                className="text-xs font-bold tracking-widest mb-2 block"
                style={{ color: "#B7C2D6" }}
              >
                WEAPON SKIN
              </Label>
              <Select value={selGun} onValueChange={setSelGun}>
                <SelectTrigger
                  className="w-full"
                  style={{
                    background: "#101A2A",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                >
                  <SelectValue placeholder="Choose gun skin" />
                </SelectTrigger>
                <SelectContent
                  style={{ background: "#101A2A", border: "1px solid #243249" }}
                >
                  {gunSkins.map((g) => (
                    <SelectItem
                      key={g.name}
                      value={g.name}
                      style={{ color: "#F2F6FF" }}
                    >
                      🔫 {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setLoadoutOpen(false)}
              className="flex-1 font-bold"
              style={{
                borderColor: "#243249",
                color: "#B7C2D6",
                background: "transparent",
              }}
              data-ocid="loadout.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReadyUp}
              disabled={readyLoading || !selChar || !selVehicle || !selGun}
              className="flex-1 font-black tracking-wider"
              style={{
                background: "linear-gradient(135deg, #2DFF8C, #1ab868)",
                border: "none",
                color: "#000",
              }}
              data-ocid="loadout.confirm_button"
            >
              {readyLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              READY UP!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
