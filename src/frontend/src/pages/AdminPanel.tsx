import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Ban, Edit, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Character, GameMap, GunSkin, Vehicle } from "../backend.d";
import { VehicleType } from "../backend.d";
import { useActor } from "../hooks/useActor";

interface Props {
  isAdmin: boolean;
  onBack: () => void;
}

type CharWithId = Character & { _id?: bigint };
type VehicleWithId = Vehicle & { _id?: bigint };
type GunSkinWithId = GunSkin & { _id?: bigint };
type GameMapWithId = GameMap & { _id?: bigint };

export default function AdminPanel({ isAdmin, onBack }: Props) {
  const { actor, isFetching } = useActor();
  const [characters, setCharacters] = useState<CharWithId[]>([]);
  const [vehicles, setVehicles] = useState<VehicleWithId[]>([]);
  const [gunSkins, setGunSkins] = useState<GunSkinWithId[]>([]);
  const [maps, setMaps] = useState<GameMapWithId[]>([]);
  const [loading, setLoading] = useState(true);

  // Ban players
  const [bannedIds, setBannedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("brawlverse_banned") ?? "[]");
    } catch {
      return [];
    }
  });
  const [banInput, setBanInput] = useState("");

  // Dialogs
  const [charDialog, setCharDialog] = useState(false);
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [gunDialog, setGunDialog] = useState(false);
  const [mapDialog, setMapDialog] = useState(false);

  // Form states
  const [charForm, setCharForm] = useState({
    name: "",
    description: "",
    speed: "5",
    strength: "5",
    agility: "5",
  });
  const [vehicleForm, setVehicleForm] = useState({
    name: "",
    vehicleType: "car",
    speed: "5",
    armor: "5",
    firepower: "5",
  });
  const [gunForm, setGunForm] = useState({
    name: "",
    description: "",
    rarity: "3",
  });
  const [mapForm, setMapForm] = useState({ name: "", theme: "" });

  const fetchAll = useCallback(() => {
    if (!actor || isFetching) return;
    setLoading(true);
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

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const banPlayer = () => {
    if (!banInput.trim()) return;
    const updated = [...bannedIds, banInput.trim()];
    setBannedIds(updated);
    localStorage.setItem("brawlverse_banned", JSON.stringify(updated));
    setBanInput("");
  };

  const unban = (id: string) => {
    const updated = bannedIds.filter((b) => b !== id);
    setBannedIds(updated);
    localStorage.setItem("brawlverse_banned", JSON.stringify(updated));
  };

  const addCharacter = async () => {
    if (!actor) return;
    await actor.addCharacter({
      name: charForm.name,
      description: charForm.description,
      speed: BigInt(charForm.speed),
      strength: BigInt(charForm.strength),
      agility: BigInt(charForm.agility),
    });
    setCharDialog(false);
    setCharForm({
      name: "",
      description: "",
      speed: "5",
      strength: "5",
      agility: "5",
    });
    fetchAll();
  };

  const deleteCharacter = async (idx: number) => {
    if (!actor) return;
    await actor.deleteCharacter(BigInt(idx));
    fetchAll();
  };

  const addVehicle = async () => {
    if (!actor) return;
    const vtMap: Record<string, VehicleType> = {
      car: VehicleType.car,
      van: VehicleType.van,
      bike: VehicleType.bike,
      ship: VehicleType.ship,
      tank: VehicleType.tank,
      battle: VehicleType.battle,
      plane: VehicleType.plane,
    };
    await actor.addVehicle({
      name: vehicleForm.name,
      vehicleType: vtMap[vehicleForm.vehicleType] ?? VehicleType.car,
      speed: BigInt(vehicleForm.speed),
      armor: BigInt(vehicleForm.armor),
      firepower: BigInt(vehicleForm.firepower),
    });
    setVehicleDialog(false);
    setVehicleForm({
      name: "",
      vehicleType: "car",
      speed: "5",
      armor: "5",
      firepower: "5",
    });
    fetchAll();
  };

  const deleteVehicle = async (idx: number) => {
    if (!actor) return;
    await actor.deleteVehicle(BigInt(idx));
    fetchAll();
  };

  const addGunSkin = async () => {
    if (!actor) return;
    await actor.addGunSkin({
      name: gunForm.name,
      description: gunForm.description,
      rarity: BigInt(gunForm.rarity),
    });
    setGunDialog(false);
    setGunForm({ name: "", description: "", rarity: "3" });
    fetchAll();
  };

  const deleteGunSkin = async (idx: number) => {
    if (!actor) return;
    await actor.deleteGunSkin(BigInt(idx));
    fetchAll();
  };

  const addMap = async () => {
    if (!actor) return;
    await actor.addGameMap({ name: mapForm.name, theme: mapForm.theme });
    setMapDialog(false);
    setMapForm({ name: "", theme: "" });
    fetchAll();
  };

  const deleteMap = async (idx: number) => {
    if (!actor) return;
    await actor.deleteGameMap(BigInt(idx));
    fetchAll();
  };

  const panelStyle = { background: "#101A2A", border: "1px solid #243249" };

  if (!isAdmin) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ color: "#F2F6FF" }}
      >
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-black mb-2" style={{ color: "#FF4444" }}>
          Access Denied
        </h1>
        <p style={{ color: "#7a8fa8" }}>You do not have admin privileges.</p>
        <Button
          onClick={onBack}
          className="mt-6"
          style={{ background: "#243249", color: "#B7C2D6", border: "none" }}
          data-ocid="admin.back_button"
        >
          Back to Menu
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ color: "#F2F6FF" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            style={{ color: "#B7C2D6" }}
            data-ocid="admin.back_button"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Menu
          </Button>
          <h1 className="text-3xl font-black" style={{ color: "#FFD700" }}>
            ⚡ Admin Panel
          </h1>
        </div>

        <Tabs defaultValue="characters">
          <TabsList
            className="mb-6 w-full justify-start"
            style={{ background: "#101A2A", border: "1px solid #243249" }}
            data-ocid="admin.tab"
          >
            <TabsTrigger value="characters" data-ocid="admin.characters_tab">
              Characters
            </TabsTrigger>
            <TabsTrigger value="vehicles" data-ocid="admin.vehicles_tab">
              Vehicles
            </TabsTrigger>
            <TabsTrigger value="gunskins" data-ocid="admin.gunskins_tab">
              Gun Skins
            </TabsTrigger>
            <TabsTrigger value="maps" data-ocid="admin.maps_tab">
              Maps
            </TabsTrigger>
            <TabsTrigger value="ban" data-ocid="admin.ban_tab">
              Ban Players
            </TabsTrigger>
          </TabsList>

          {/* Characters Tab */}
          <TabsContent value="characters">
            <div className="rounded-xl p-6" style={panelStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Characters</h2>
                <Button
                  onClick={() => setCharDialog(true)}
                  style={{ background: "#2D8CFF", border: "none" }}
                  data-ocid="admin.add_character_button"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-48" style={{ background: "#1a2a3a" }} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "#243249" }}>
                      <TableHead style={{ color: "#B7C2D6" }}>Name</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Description
                      </TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>SPD</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>STR</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>AGI</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {characters.map((c, i) => (
                      <TableRow
                        key={c.name}
                        style={{ borderColor: "#243249" }}
                        data-ocid={`admin.character.item.${i + 1}`}
                      >
                        <TableCell className="font-bold">{c.name}</TableCell>
                        <TableCell style={{ color: "#7a8fa8" }}>
                          {c.description.slice(0, 40)}
                        </TableCell>
                        <TableCell>{Number(c.speed)}</TableCell>
                        <TableCell>{Number(c.strength)}</TableCell>
                        <TableCell>{Number(c.agility)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCharacter(i)}
                            style={{ color: "#FF4444" }}
                            data-ocid={`admin.character.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {characters.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center"
                          style={{ color: "#7a8fa8" }}
                          data-ocid="admin.characters.empty_state"
                        >
                          No characters yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles">
            <div className="rounded-xl p-6" style={panelStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Vehicles</h2>
                <Button
                  onClick={() => setVehicleDialog(true)}
                  style={{ background: "#2D8CFF", border: "none" }}
                  data-ocid="admin.add_vehicle_button"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-48" style={{ background: "#1a2a3a" }} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "#243249" }}>
                      <TableHead style={{ color: "#B7C2D6" }}>Name</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>Type</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>SPD</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>ARM</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>FP</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v, i) => (
                      <TableRow
                        key={v.name}
                        style={{ borderColor: "#243249" }}
                        data-ocid={`admin.vehicle.item.${i + 1}`}
                      >
                        <TableCell className="font-bold">{v.name}</TableCell>
                        <TableCell>{v.vehicleType as string}</TableCell>
                        <TableCell>{Number(v.speed)}</TableCell>
                        <TableCell>{Number(v.armor)}</TableCell>
                        <TableCell>{Number(v.firepower)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVehicle(i)}
                            style={{ color: "#FF4444" }}
                            data-ocid={`admin.vehicle.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {vehicles.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center"
                          style={{ color: "#7a8fa8" }}
                          data-ocid="admin.vehicles.empty_state"
                        >
                          No vehicles yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Gun Skins Tab */}
          <TabsContent value="gunskins">
            <div className="rounded-xl p-6" style={panelStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Gun Skins</h2>
                <Button
                  onClick={() => setGunDialog(true)}
                  style={{ background: "#2D8CFF", border: "none" }}
                  data-ocid="admin.add_gunskin_button"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-48" style={{ background: "#1a2a3a" }} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "#243249" }}>
                      <TableHead style={{ color: "#B7C2D6" }}>Name</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Description
                      </TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>Rarity</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gunSkins.map((g, i) => (
                      <TableRow
                        key={g.name}
                        style={{ borderColor: "#243249" }}
                        data-ocid={`admin.gunskin.item.${i + 1}`}
                      >
                        <TableCell className="font-bold">{g.name}</TableCell>
                        <TableCell style={{ color: "#7a8fa8" }}>
                          {g.description.slice(0, 40)}
                        </TableCell>
                        <TableCell>
                          {"⭐".repeat(Math.min(Number(g.rarity), 5))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteGunSkin(i)}
                            style={{ color: "#FF4444" }}
                            data-ocid={`admin.gunskin.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {gunSkins.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center"
                          style={{ color: "#7a8fa8" }}
                          data-ocid="admin.gunskins.empty_state"
                        >
                          No gun skins yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Maps Tab */}
          <TabsContent value="maps">
            <div className="rounded-xl p-6" style={panelStyle}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black">Maps</h2>
                <Button
                  onClick={() => setMapDialog(true)}
                  style={{ background: "#2D8CFF", border: "none" }}
                  data-ocid="admin.add_map_button"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New
                </Button>
              </div>
              {loading ? (
                <Skeleton className="h-48" style={{ background: "#1a2a3a" }} />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow style={{ borderColor: "#243249" }}>
                      <TableHead style={{ color: "#B7C2D6" }}>Name</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>Theme</TableHead>
                      <TableHead style={{ color: "#B7C2D6" }}>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maps.map((m, i) => (
                      <TableRow
                        key={m.name}
                        style={{ borderColor: "#243249" }}
                        data-ocid={`admin.map.item.${i + 1}`}
                      >
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell style={{ color: "#7a8fa8" }}>
                          {m.theme}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMap(i)}
                            style={{ color: "#FF4444" }}
                            data-ocid={`admin.map.delete_button.${i + 1}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {maps.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center"
                          style={{ color: "#7a8fa8" }}
                          data-ocid="admin.maps.empty_state"
                        >
                          No maps yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </TabsContent>

          {/* Ban Players Tab */}
          <TabsContent value="ban">
            <div className="rounded-xl p-6" style={panelStyle}>
              <h2 className="text-xl font-black mb-4">Ban Players</h2>
              <div className="flex gap-3 mb-6">
                <Input
                  placeholder="Principal ID..."
                  value={banInput}
                  onChange={(e) => setBanInput(e.target.value)}
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.ban_input"
                />
                <Button
                  onClick={banPlayer}
                  style={{ background: "#FF4444", border: "none" }}
                  data-ocid="admin.ban_button"
                >
                  <Ban className="h-4 w-4 mr-2" /> Ban
                </Button>
              </div>
              <div className="space-y-2" data-ocid="admin.ban.list">
                {bannedIds.length === 0 && (
                  <p
                    style={{ color: "#7a8fa8" }}
                    data-ocid="admin.ban.empty_state"
                  >
                    No banned players
                  </p>
                )}
                {bannedIds.map((id, i) => (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg px-4 py-3"
                    style={{
                      background: "rgba(255,68,68,0.1)",
                      border: "1px solid rgba(255,68,68,0.3)",
                    }}
                    data-ocid={`admin.ban.item.${i + 1}`}
                  >
                    <span
                      className="font-mono text-sm"
                      style={{ color: "#FF6666" }}
                    >
                      {id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unban(id)}
                      style={{ color: "#7a8fa8" }}
                      data-ocid={`admin.unban_button.${i + 1}`}
                    >
                      <Edit className="h-4 w-4" /> Unban
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Character Dialog */}
      <Dialog open={charDialog} onOpenChange={setCharDialog}>
        <DialogContent
          style={{
            background: "#101A2A",
            border: "1px solid #243249",
            color: "#F2F6FF",
          }}
          data-ocid="admin.add_character_dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#F2F6FF" }}>
              Add Character
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label style={{ color: "#B7C2D6" }}>Name</Label>
              <Input
                value={charForm.name}
                onChange={(e) =>
                  setCharForm((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.character_name.input"
              />
            </div>
            <div>
              <Label style={{ color: "#B7C2D6" }}>Description</Label>
              <Input
                value={charForm.description}
                onChange={(e) =>
                  setCharForm((p) => ({ ...p, description: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.character_description.input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label style={{ color: "#B7C2D6" }}>Speed</Label>
                <Input
                  type="number"
                  value={charForm.speed}
                  onChange={(e) =>
                    setCharForm((p) => ({ ...p, speed: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.character_speed.input"
                />
              </div>
              <div>
                <Label style={{ color: "#B7C2D6" }}>Strength</Label>
                <Input
                  type="number"
                  value={charForm.strength}
                  onChange={(e) =>
                    setCharForm((p) => ({ ...p, strength: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.character_strength.input"
                />
              </div>
              <div>
                <Label style={{ color: "#B7C2D6" }}>Agility</Label>
                <Input
                  type="number"
                  value={charForm.agility}
                  onChange={(e) =>
                    setCharForm((p) => ({ ...p, agility: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.character_agility.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setCharDialog(false)}
              style={{ color: "#B7C2D6" }}
              data-ocid="admin.add_character_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addCharacter}
              style={{ background: "#2D8CFF", border: "none" }}
              data-ocid="admin.add_character_submit_button"
            >
              Add Character
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Dialog */}
      <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
        <DialogContent
          style={{
            background: "#101A2A",
            border: "1px solid #243249",
            color: "#F2F6FF",
          }}
          data-ocid="admin.add_vehicle_dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#F2F6FF" }}>Add Vehicle</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label style={{ color: "#B7C2D6" }}>Name</Label>
              <Input
                value={vehicleForm.name}
                onChange={(e) =>
                  setVehicleForm((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.vehicle_name.input"
              />
            </div>
            <div>
              <Label style={{ color: "#B7C2D6" }}>Type</Label>
              <select
                value={vehicleForm.vehicleType}
                onChange={(e) =>
                  setVehicleForm((p) => ({ ...p, vehicleType: e.target.value }))
                }
                className="w-full mt-1 rounded-md px-3 py-2"
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.vehicle_type.select"
              >
                {["car", "van", "bike", "ship", "tank", "battle", "plane"].map(
                  (t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ),
                )}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label style={{ color: "#B7C2D6" }}>Speed</Label>
                <Input
                  type="number"
                  value={vehicleForm.speed}
                  onChange={(e) =>
                    setVehicleForm((p) => ({ ...p, speed: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.vehicle_speed.input"
                />
              </div>
              <div>
                <Label style={{ color: "#B7C2D6" }}>Armor</Label>
                <Input
                  type="number"
                  value={vehicleForm.armor}
                  onChange={(e) =>
                    setVehicleForm((p) => ({ ...p, armor: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.vehicle_armor.input"
                />
              </div>
              <div>
                <Label style={{ color: "#B7C2D6" }}>Firepower</Label>
                <Input
                  type="number"
                  value={vehicleForm.firepower}
                  onChange={(e) =>
                    setVehicleForm((p) => ({ ...p, firepower: e.target.value }))
                  }
                  style={{
                    background: "#1a2a3a",
                    border: "1px solid #243249",
                    color: "#F2F6FF",
                  }}
                  data-ocid="admin.vehicle_firepower.input"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setVehicleDialog(false)}
              style={{ color: "#B7C2D6" }}
              data-ocid="admin.add_vehicle_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addVehicle}
              style={{ background: "#2D8CFF", border: "none" }}
              data-ocid="admin.add_vehicle_submit_button"
            >
              Add Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Gun Skin Dialog */}
      <Dialog open={gunDialog} onOpenChange={setGunDialog}>
        <DialogContent
          style={{
            background: "#101A2A",
            border: "1px solid #243249",
            color: "#F2F6FF",
          }}
          data-ocid="admin.add_gunskin_dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#F2F6FF" }}>Add Gun Skin</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label style={{ color: "#B7C2D6" }}>Name</Label>
              <Input
                value={gunForm.name}
                onChange={(e) =>
                  setGunForm((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.gunskin_name.input"
              />
            </div>
            <div>
              <Label style={{ color: "#B7C2D6" }}>Description</Label>
              <Input
                value={gunForm.description}
                onChange={(e) =>
                  setGunForm((p) => ({ ...p, description: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.gunskin_description.input"
              />
            </div>
            <div>
              <Label style={{ color: "#B7C2D6" }}>Rarity (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={gunForm.rarity}
                onChange={(e) =>
                  setGunForm((p) => ({ ...p, rarity: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.gunskin_rarity.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setGunDialog(false)}
              style={{ color: "#B7C2D6" }}
              data-ocid="admin.add_gunskin_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addGunSkin}
              style={{ background: "#2D8CFF", border: "none" }}
              data-ocid="admin.add_gunskin_submit_button"
            >
              Add Gun Skin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Map Dialog */}
      <Dialog open={mapDialog} onOpenChange={setMapDialog}>
        <DialogContent
          style={{
            background: "#101A2A",
            border: "1px solid #243249",
            color: "#F2F6FF",
          }}
          data-ocid="admin.add_map_dialog"
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#F2F6FF" }}>Add Map</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label style={{ color: "#B7C2D6" }}>Name</Label>
              <Input
                value={mapForm.name}
                onChange={(e) =>
                  setMapForm((p) => ({ ...p, name: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.map_name.input"
              />
            </div>
            <div>
              <Label style={{ color: "#B7C2D6" }}>Theme</Label>
              <Input
                value={mapForm.theme}
                onChange={(e) =>
                  setMapForm((p) => ({ ...p, theme: e.target.value }))
                }
                style={{
                  background: "#1a2a3a",
                  border: "1px solid #243249",
                  color: "#F2F6FF",
                }}
                data-ocid="admin.map_theme.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setMapDialog(false)}
              style={{ color: "#B7C2D6" }}
              data-ocid="admin.add_map_cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={addMap}
              style={{ background: "#2D8CFF", border: "none" }}
              data-ocid="admin.add_map_submit_button"
            >
              Add Map
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
