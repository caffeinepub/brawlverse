import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
export type Time = bigint;
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
export interface UserProfile {
    name: string;
    favoriteVehicle: string;
    favoriteCharacter: string;
}
export interface GunSkin {
    name: string;
    description: string;
    rarity: bigint;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
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
export type RoomStatus = { __kind__: "waiting" } | { __kind__: "playing" } | { __kind__: "finished" };
export interface RoomPlayer {
    principal: Principal;
    displayName: string;
    characterName: string;
    vehicleName: string;
    gunSkinName: string;
    isReady: boolean;
}
export interface Room {
    id: bigint;
    code: string;
    hostPrincipal: Principal;
    players: Array<RoomPlayer>;
    status: RoomStatus;
    selectedMap: string;
    createdAt: Time;
}
export interface ChatMessage {
    senderPrincipal: Principal;
    displayName: string;
    message: string;
    timestamp: Time;
}
export interface backendInterface {
    addCharacter(character: Character): Promise<bigint>;
    addGameMap(gameMap: GameMap): Promise<bigint>;
    addGunSkin(gunSkin: GunSkin): Promise<bigint>;
    addVehicle(vehicle: Vehicle): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteCharacter(id: bigint): Promise<void>;
    deleteGameMap(id: bigint): Promise<void>;
    deleteGunSkin(id: bigint): Promise<void>;
    deleteVehicle(id: bigint): Promise<void>;
    getAllCharacters(): Promise<Array<Character>>;
    getAllGunSkins(): Promise<Array<GunSkin>>;
    getAllMaps(): Promise<Array<GameMap>>;
    getAllMatchResults(): Promise<Array<MatchResult>>;
    getAllVehicles(): Promise<Array<Vehicle>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedInitialData(): Promise<void>;
    submitMatchResult(loser: Principal, mapUsed: string, characterUsed: string, vehicleUsed: string): Promise<bigint>;
    updateCharacter(id: bigint, character: Character): Promise<void>;
    updateGameMap(id: bigint, gameMap: GameMap): Promise<void>;
    updateGunSkin(id: bigint, gunSkin: GunSkin): Promise<void>;
    updateVehicle(id: bigint, vehicle: Vehicle): Promise<void>;
    // Online multiplayer
    createRoom(displayName: string): Promise<string>;
    joinRoom(code: string, displayName: string): Promise<Room>;
    joinRandomRoom(displayName: string): Promise<string>;
    leaveRoom(code: string): Promise<void>;
    setPlayerReady(code: string, characterName: string, vehicleName: string, gunSkinName: string): Promise<void>;
    startMatch(code: string): Promise<void>;
    endMatch(code: string): Promise<void>;
    setRoomMap(code: string, mapName: string): Promise<void>;
    getRoomByCode(code: string): Promise<Room | null>;
    listOpenRooms(): Promise<Array<Room>>;
    // Chat
    sendChatMessage(code: string, displayName: string, message: string): Promise<void>;
    getRoomMessages(code: string): Promise<Array<ChatMessage>>;
}
