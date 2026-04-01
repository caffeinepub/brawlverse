import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PlayerSession {
    status: Variant_alive_dead;
    vehicleName: string;
    principal: Principal;
    displayName: string;
    characterName: string;
    coins: bigint;
    score: bigint;
    isReady: boolean;
    positionX: bigint;
    positionY: bigint;
    gunSkinName: string;
    health: bigint;
}
export interface Room {
    id: bigint;
    status: RoomStatus;
    selectedMap: string;
    code: string;
    createdAt: Time;
    players: Array<RoomPlayer>;
    hostPrincipal: Principal;
}
export interface Character {
    name: string;
    description: string;
    speed: bigint;
    strength: bigint;
    agility: bigint;
}
export interface Vehicle {
    vehicleType: VehicleType;
    armor: bigint;
    firepower: bigint;
    name: string;
    speed: bigint;
}
export interface GameMap {
    theme: string;
    name: string;
}
export interface MatchResult {
    vehicleUsed: string;
    mapUsed: string;
    characterUsed: string;
    winner: Principal;
    loser: Principal;
    timestamp: Time;
}
export interface GodModeFlags {
    flyMode: boolean;
    extraCoins: bigint;
    invincibility: boolean;
}
export interface RoomPlayer {
    vehicleName: string;
    principal: Principal;
    displayName: string;
    characterName: string;
    isReady: boolean;
    gunSkinName: string;
}
export interface ChatMessage {
    displayName: string;
    senderPrincipal: Principal;
    message: string;
    timestamp: Time;
}
export interface GunSkin {
    name: string;
    description: string;
    rarity: bigint;
}
export interface UserProfile {
    name: string;
    favoriteVehicle: string;
    favoriteCharacter: string;
}
export enum RoomStatus {
    playing = "playing",
    finished = "finished",
    waiting = "waiting"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_alive_dead {
    alive = "alive",
    dead = "dead"
}
export enum VehicleType {
    car = "car",
    van = "van",
    bike = "bike",
    ship = "ship",
    tank = "tank",
    battle = "battle",
    plane = "plane"
}
export interface backendInterface {
    addCharacter(character: Character): Promise<bigint>;
    addGameMap(gameMap: GameMap): Promise<bigint>;
    addGunSkin(gunSkin: GunSkin): Promise<bigint>;
    addVehicle(vehicle: Vehicle): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banPlayer(player: Principal): Promise<void>;
    checkIfBanned(player: Principal): Promise<boolean>;
    createRoom(displayName: string): Promise<string>;
    deleteCharacter(id: bigint): Promise<void>;
    deleteGameMap(id: bigint): Promise<void>;
    deleteGunSkin(id: bigint): Promise<void>;
    deleteVehicle(id: bigint): Promise<void>;
    endMatch(code: string): Promise<void>;
    getAllCharacters(): Promise<Array<Character>>;
    getAllGunSkins(): Promise<Array<GunSkin>>;
    getAllMaps(): Promise<Array<GameMap>>;
    getAllMatchResults(): Promise<Array<MatchResult>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getGodMode(player: Principal): Promise<GodModeFlags | null>;
    getPlayerSession(player: Principal): Promise<PlayerSession | null>;
    getRoomByCode(code: string): Promise<Room | null>;
    getRoomMessages(code: string): Promise<Array<ChatMessage>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinRandomRoom(displayName: string): Promise<string>;
    joinRoom(code: string, displayName: string): Promise<Room>;
    leaveRoom(code: string): Promise<void>;
    listBannedPlayers(): Promise<Array<Principal>>;
    listOpenRooms(): Promise<Array<Room>>;
    removeGodMode(player: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedInitialData(): Promise<void>;
    sendChatMessage(code: string, displayName: string, message: string): Promise<void>;
    setGodMode(player: Principal, flags: GodModeFlags): Promise<void>;
    setPlayerReady(code: string, characterName: string, vehicleName: string, gunSkinName: string): Promise<void>;
    setRoomMap(code: string, mapName: string): Promise<void>;
    startMatch(code: string): Promise<void>;
    submitMatchResult(loser: Principal, mapUsed: string, characterUsed: string, vehicleUsed: string): Promise<bigint>;
    unbanPlayer(player: Principal): Promise<void>;
    updateCharacter(id: bigint, character: Character): Promise<void>;
    updateGameMap(id: bigint, gameMap: GameMap): Promise<void>;
    updateGunSkin(id: bigint, gunSkin: GunSkin): Promise<void>;
    updatePlayerSession(session: PlayerSession): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
}
