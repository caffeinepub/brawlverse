import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Time "mo:core/Time";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type VehicleType = {
    #van;
    #car;
    #bike;
    #tank;
    #plane;
    #ship;
    #battle;
  };

  public type Character = {
    name : Text;
    description : Text;
    speed : Nat;
    strength : Nat;
    agility : Nat;
  };

  public type Vehicle = {
    name : Text;
    vehicleType : VehicleType;
    speed : Nat;
    armor : Nat;
    firepower : Nat;
  };

  public type GunSkin = {
    name : Text;
    description : Text;
    rarity : Nat;
  };

  public type GameMap = {
    name : Text;
    theme : Text;
  };

  module Character {
    public func compare(c1 : Character, c2 : Character) : Order.Order {
      Text.compare(c1.name, c2.name);
    };
  };

  module Vehicle {
    public func compare(v1 : Vehicle, v2 : Vehicle) : Order.Order {
      Text.compare(v1.name, v2.name);
    };
  };

  module GunSkin {
    public func compare(g1 : GunSkin, g2 : GunSkin) : Order.Order {
      Text.compare(g1.name, g2.name);
    };
  };

  module GameMap {
    public func compare(m1 : GameMap, m2 : GameMap) : Order.Order {
      Text.compare(m1.name, m2.name);
    };
  };

  public type MatchResult = {
    winner : Principal;
    loser : Principal;
    mapUsed : Text;
    characterUsed : Text;
    vehicleUsed : Text;
    timestamp : Time.Time;
  };

  module MatchResult {
    public func compare(m1 : MatchResult, m2 : MatchResult) : Order.Order {
      Text.compare(m1.mapUsed, m2.mapUsed);
    };
  };

  public type UserProfile = {
    name : Text;
    favoriteCharacter : Text;
    favoriteVehicle : Text;
  };

  // --- Online Multiplayer Types ---

  public type RoomStatus = { #waiting; #playing; #finished };

  public type PlayerSession = {
    principal : Principal;
    displayName : Text;
    characterName : Text;
    vehicleName : Text;
    gunSkinName : Text;
    isReady : Bool;
    health : Nat;
    positionX : Int;
    positionY : Int;
    score : Nat;
    coins : Nat;
    status : { #alive; #dead };
  };

  public type GodModeFlags = {
    invincibility : Bool;
    flyMode : Bool;
    extraCoins : Nat;
  };

  public type RoomPlayer = {
    principal : Principal;
    displayName : Text;
    characterName : Text;
    vehicleName : Text;
    gunSkinName : Text;
    isReady : Bool;
  };

  public type Room = {
    id : Nat;
    code : Text;
    hostPrincipal : Principal;
    players : [RoomPlayer];
    status : RoomStatus;
    selectedMap : Text;
    createdAt : Time.Time;
  };

  public type ChatMessage = {
    senderPrincipal : Principal;
    displayName : Text;
    message : Text;
    timestamp : Time.Time;
  };

  let characterStore = Map.empty<Nat, Character>();
  let vehicleStore = Map.empty<Nat, Vehicle>();
  let gunSkinStore = Map.empty<Nat, GunSkin>();
  let mapStore = Map.empty<Nat, GameMap>();
  let matchResultStore = Map.empty<Nat, MatchResult>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let roomStore = Map.empty<Text, Room>();
  let chatStore = Map.empty<Text, [ChatMessage]>();
  let bannedPlayers = Map.empty<Principal, Bool>();
  let playerSessions = Map.empty<Principal, PlayerSession>();
  let godModeFlags = Map.empty<Principal, GodModeFlags>();

  var characterCounter = 0;
  var vehicleCounter = 0;
  var gunSkinCounter = 0;
  var mapCounter = 0;
  var matchResultCounter = 0;
  var roomCounter = 0;

  // Simple 6-char code using counter
  func makeCode(id : Nat) : Text {
    let base = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let arr : [Char] = base.toArray();
    let l = arr.size();
    var result = "";
    var n = id;
    var i = 0;
    while (i < 6) {
      result := Text.fromChar(arr[n % l]) # result;
      n := n / l + 1;
      i += 1;
    };
    result;
  };

  // Append an element to an array
  func arrayAppend<T>(arr : [T], item : T) : [T] {
    Array.tabulate<T>(arr.size() + 1, func(i) { if (i < arr.size()) arr[i] else item });
  };

  // Check if player is banned
  func isPlayerBanned(principal : Principal) : Bool {
    switch (bannedPlayers.get(principal)) {
      case (?true) { true };
      case (_) { false };
    };
  };

  // --- Ban Management (Admin only) ---
  public shared ({ caller }) func banPlayer(player : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can ban players");
    };
    bannedPlayers.add(player, true);
  };

  public shared ({ caller }) func unbanPlayer(player : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can unban players");
    };
    bannedPlayers.remove(player);
  };

  public query ({ caller }) func listBannedPlayers() : async [Principal] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list banned players");
    };
    bannedPlayers.keys().toArray();
  };

  public query ({ caller }) func checkIfBanned(player : Principal) : async Bool {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can check ban status");
    };
    isPlayerBanned(player);
  };

  // --- God Mode Management (Admin only) ---
  public shared ({ caller }) func setGodMode(player : Principal, flags : GodModeFlags) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can set god mode");
    };
    godModeFlags.add(player, flags);
  };

  public shared ({ caller }) func removeGodMode(player : Principal) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can remove god mode");
    };
    godModeFlags.remove(player);
  };

  public query ({ caller }) func getGodMode(player : Principal) : async ?GodModeFlags {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view god mode");
    };
    godModeFlags.get(player);
  };

  // --- Player Session Management (User only) ---
  public shared ({ caller }) func updatePlayerSession(session : PlayerSession) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update player sessions");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    playerSessions.add(caller, session);
  };

  public query ({ caller }) func getPlayerSession(player : Principal) : async ?PlayerSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view player sessions");
    };
    playerSessions.get(player);
  };

  // --- Room APIs (User only) ---
  public shared ({ caller }) func createRoom(displayName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create rooms");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    let code = makeCode(roomCounter);
    let player : RoomPlayer = {
      principal = caller;
      displayName;
      characterName = "";
      vehicleName = "";
      gunSkinName = "";
      isReady = false;
    };
    let room : Room = {
      id = roomCounter;
      code;
      hostPrincipal = caller;
      players = [player];
      status = #waiting;
      selectedMap = "Jungle";
      createdAt = Time.now();
    };
    roomStore.add(code, room);
    chatStore.add(code, []);
    roomCounter += 1;
    code;
  };

  public shared ({ caller }) func joinRoom(code : Text, displayName : Text) : async Room {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    switch (roomStore.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.status != #waiting) { Runtime.trap("Room is not open") };
        if (room.players.size() >= 20) { Runtime.trap("Room is full") };
        // Check if already in room
        for (p in room.players.vals()) {
          if (p.principal == caller) { return room };
        };
        let newPlayer : RoomPlayer = {
          principal = caller;
          displayName;
          characterName = "";
          vehicleName = "";
          gunSkinName = "";
          isReady = false;
        };
        let updatedPlayers = arrayAppend(room.players, newPlayer);
        let updatedRoom : Room = {
          id = room.id;
          code = room.code;
          hostPrincipal = room.hostPrincipal;
          players = updatedPlayers;
          status = room.status;
          selectedMap = room.selectedMap;
          createdAt = room.createdAt;
        };
        roomStore.add(code, updatedRoom);
        updatedRoom;
      };
    };
  };

  public shared ({ caller }) func joinRandomRoom(displayName : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join rooms");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    var found : ?Text = null;
    for ((code, room) in roomStore.entries()) {
      if (found == null and room.status == #waiting and room.players.size() < 20) {
        var alreadyIn = false;
        for (p in room.players.vals()) {
          if (p.principal == caller) { alreadyIn := true };
        };
        if (not alreadyIn) { found := ?code };
      };
    };
    switch (found) {
      case (?code) {
        ignore await joinRoom(code, displayName);
        code;
      };
      case (null) {
        await createRoom(displayName);
      };
    };
  };

  public shared ({ caller }) func leaveRoom(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave rooms");
    };
    switch (roomStore.get(code)) {
      case (null) {};
      case (?room) {
        let remaining = room.players.filter(func(p : RoomPlayer) : Bool { p.principal != caller });
        if (remaining.size() == 0) {
          roomStore.remove(code);
          chatStore.remove(code);
        } else {
          let newHost = if (room.hostPrincipal == caller) remaining[0].principal else room.hostPrincipal;
          let updatedRoom : Room = {
            id = room.id;
            code = room.code;
            hostPrincipal = newHost;
            players = remaining;
            status = room.status;
            selectedMap = room.selectedMap;
            createdAt = room.createdAt;
          };
          roomStore.add(code, updatedRoom);
        };
      };
    };
  };

  public shared ({ caller }) func setPlayerReady(code : Text, characterName : Text, vehicleName : Text, gunSkinName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set ready status");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    switch (roomStore.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        let updated = room.players.map(
          func(p : RoomPlayer) : RoomPlayer {
            if (p.principal == caller) {
              { principal = p.principal; displayName = p.displayName; characterName; vehicleName; gunSkinName; isReady = true };
            } else { p };
          },
        );
        let updatedRoom : Room = {
          id = room.id;
          code = room.code;
          hostPrincipal = room.hostPrincipal;
          players = updated;
          status = room.status;
          selectedMap = room.selectedMap;
          createdAt = room.createdAt;
        };
        roomStore.add(code, updatedRoom);
      };
    };
  };

  public shared ({ caller }) func startMatch(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start matches");
    };
    switch (roomStore.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.hostPrincipal != caller) { Runtime.trap("Only host can start match") };
        let updatedRoom : Room = {
          id = room.id;
          code = room.code;
          hostPrincipal = room.hostPrincipal;
          players = room.players;
          status = #playing;
          selectedMap = room.selectedMap;
          createdAt = room.createdAt;
        };
        roomStore.add(code, updatedRoom);
      };
    };
  };

  public shared ({ caller }) func setRoomMap(code : Text, mapName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set room map");
    };
    switch (roomStore.get(code)) {
      case (null) { Runtime.trap("Room not found") };
      case (?room) {
        if (room.hostPrincipal != caller) { Runtime.trap("Only host can set map") };
        let updatedRoom : Room = {
          id = room.id;
          code = room.code;
          hostPrincipal = room.hostPrincipal;
          players = room.players;
          status = room.status;
          selectedMap = mapName;
          createdAt = room.createdAt;
        };
        roomStore.add(code, updatedRoom);
      };
    };
  };

  public shared ({ caller }) func endMatch(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can end matches");
    };
    switch (roomStore.get(code)) {
      case (null) {};
      case (?room) {
        // Only host or admin can end match
        if (room.hostPrincipal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Only host or admin can end match");
        };
        let updatedRoom : Room = {
          id = room.id;
          code = room.code;
          hostPrincipal = room.hostPrincipal;
          players = room.players;
          status = #finished;
          selectedMap = room.selectedMap;
          createdAt = room.createdAt;
        };
        roomStore.add(code, updatedRoom);
      };
    };
  };

  public query ({ caller }) func getRoomByCode(code : Text) : async ?Room {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view rooms");
    };
    roomStore.get(code);
  };

  public query ({ caller }) func listOpenRooms() : async [Room] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list rooms");
    };
    roomStore.values().toArray().filter(
      func(r : Room) : Bool { r.status == #waiting and r.players.size() < 20 },
    );
  };

  // --- Chat APIs (User only) ---
  public shared ({ caller }) func sendChatMessage(code : Text, displayName : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send chat messages");
    };
    if (isPlayerBanned(caller)) {
      Runtime.trap("Banned: You are banned from the game");
    };
    if (message.size() == 0) { Runtime.trap("Empty message") };
    let msg : ChatMessage = {
      senderPrincipal = caller;
      displayName;
      message;
      timestamp = Time.now();
    };
    let existing = switch (chatStore.get(code)) {
      case (?msgs) { msgs };
      case (null) { [] };
    };
    let updated = if (existing.size() >= 100) {
      // Drop oldest, keep last 99 + new
      Array.tabulate(100, func(i) {
        if (i < 99) existing[existing.size() - 99 + i] else msg
      });
    } else {
      arrayAppend(existing, msg);
    };
    chatStore.add(code, updated);
  };

  public query ({ caller }) func getRoomMessages(code : Text) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view chat messages");
    };
    switch (chatStore.get(code)) {
      case (?msgs) { msgs };
      case (null) { [] };
    };
  };

  // User profile management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Character management (admin)
  public shared ({ caller }) func addCharacter(character : Character) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add characters");
    };
    characterStore.add(characterCounter, character);
    characterCounter += 1;
    characterCounter - 1;
  };

  public shared ({ caller }) func updateCharacter(id : Nat, character : Character) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update characters");
    };
    if (not characterStore.containsKey(id)) {
      Runtime.trap("Character does not exist");
    };
    characterStore.add(id, character);
  };

  public shared ({ caller }) func deleteCharacter(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete characters");
    };
    if (not characterStore.containsKey(id)) {
      Runtime.trap("Character does not exist");
    };
    characterStore.remove(id);
  };

  // Vehicle management (admin)
  public shared ({ caller }) func addVehicle(vehicle : Vehicle) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add vehicles");
    };
    vehicleStore.add(vehicleCounter, vehicle);
    vehicleCounter += 1;
    vehicleCounter - 1;
  };

  public shared ({ caller }) func updateVehicle(id : Nat, vehicle : Vehicle) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update vehicles");
    };
    if (not vehicleStore.containsKey(id)) {
      Runtime.trap("Vehicle does not exist");
    };
    vehicleStore.add(id, vehicle);
  };

  public shared ({ caller }) func deleteVehicle(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete vehicles");
    };
    if (not vehicleStore.containsKey(id)) {
      Runtime.trap("Vehicle does not exist");
    };
    vehicleStore.remove(id);
  };

  // Gun skin management (admin)
  public shared ({ caller }) func addGunSkin(gunSkin : GunSkin) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add gun skins");
    };
    gunSkinStore.add(gunSkinCounter, gunSkin);
    gunSkinCounter += 1;
    gunSkinCounter - 1;
  };

  public shared ({ caller }) func updateGunSkin(id : Nat, gunSkin : GunSkin) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update gun skins");
    };
    if (not gunSkinStore.containsKey(id)) {
      Runtime.trap("Gun skin does not exist");
    };
    gunSkinStore.add(id, gunSkin);
  };

  public shared ({ caller }) func deleteGunSkin(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete gun skins");
    };
    if (not gunSkinStore.containsKey(id)) {
      Runtime.trap("Gun skin does not exist");
    };
    gunSkinStore.remove(id);
  };

  // Map management (admin)
  public shared ({ caller }) func addGameMap(gameMap : GameMap) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add maps");
    };
    mapStore.add(mapCounter, gameMap);
    mapCounter += 1;
    mapCounter - 1;
  };

  public shared ({ caller }) func updateGameMap(id : Nat, gameMap : GameMap) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update maps");
    };
    if (not mapStore.containsKey(id)) {
      Runtime.trap("Game map does not exist");
    };
    mapStore.add(id, gameMap);
  };

  public shared ({ caller }) func deleteGameMap(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete maps");
    };
    if (not mapStore.containsKey(id)) {
      Runtime.trap("Game map does not exist");
    };
    mapStore.remove(id);
  };

  // Match result management (user)
  public shared ({ caller }) func submitMatchResult(loser : Principal, mapUsed : Text, characterUsed : Text, vehicleUsed : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit match results");
    };
    let matchResult : MatchResult = {
      winner = caller;
      loser;
      mapUsed;
      characterUsed;
      vehicleUsed;
      timestamp = Time.now();
    };
    matchResultStore.add(matchResultCounter, matchResult);
    matchResultCounter += 1;
    matchResultCounter - 1;
  };

  // Queries (user access required)
  public query ({ caller }) func getAllCharacters() : async [Character] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read game data");
    };
    characterStore.values().toArray().sort();
  };

  public query ({ caller }) func getAllVehicles() : async [Vehicle] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read game data");
    };
    vehicleStore.values().toArray().sort();
  };

  public query ({ caller }) func getAllGunSkins() : async [GunSkin] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read game data");
    };
    gunSkinStore.values().toArray().sort();
  };

  public query ({ caller }) func getAllMaps() : async [GameMap] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read game data");
    };
    mapStore.values().toArray().sort();
  };

  public query ({ caller }) func getAllMatchResults() : async [MatchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can read game data");
    };
    matchResultStore.values().toArray().sort();
  };

  // Initial data seed (admin)
  public shared ({ caller }) func seedInitialData() : async () {
    // Allow anyone to seed initial data (idempotent - only adds if empty)
    ignore caller;
    let initialCharacters : [Character] = [
      { name = "Warrior"; description = "Strong melee fighter"; speed = 6; strength = 9; agility = 5 },
      { name = "Assassin"; description = "Stealthy and agile"; speed = 9; strength = 6; agility = 8 },
      { name = "Tankman"; description = "High defense fighter"; speed = 4; strength = 8; agility = 3 },
      { name = "Swordsman"; description = "Balanced fighter"; speed = 6; strength = 7; agility = 8 },
      { name = "Ninja"; description = "Quick and deadly"; speed = 11; strength = 6; agility = 11 },
    ];
    let initialVehicles : [Vehicle] = [
      { name = "Van"; vehicleType = #van; speed = 7; armor = 6; firepower = 5 },
      { name = "Car"; vehicleType = #car; speed = 8; armor = 4; firepower = 6 },
      { name = "Bike"; vehicleType = #bike; speed = 9; armor = 3; firepower = 7 },
      { name = "Tank"; vehicleType = #tank; speed = 5; armor = 9; firepower = 11 },
      { name = "Plane"; vehicleType = #plane; speed = 8; armor = 6; firepower = 5 },
      { name = "Ship"; vehicleType = #ship; speed = 6; armor = 7; firepower = 7 },
      { name = "Battle Vehicle"; vehicleType = #battle; speed = 8; armor = 8; firepower = 8 },
      { name = "Submarine"; vehicleType = #ship; speed = 5; armor = 10; firepower = 9 },
      { name = "Speedboat"; vehicleType = #ship; speed = 11; armor = 3; firepower = 7 },
      { name = "Warship"; vehicleType = #ship; speed = 4; armor = 12; firepower = 13 },
      { name = "Yacht"; vehicleType = #ship; speed = 7; armor = 5; firepower = 5 },
    ];
    let initialGunSkins : [GunSkin] = [
      { name = "Golden Rifle"; description = "Rare golden weapon skin"; rarity = 8 },
      { name = "Camo Shotgun"; description = "Stealthy camo design"; rarity = 5 },
      { name = "Neon Pistol"; description = "Bright neon design"; rarity = 5 },
      { name = "Red Dot SMG"; description = "Red dot scope skin"; rarity = 7 },
      { name = "Tiger AK-47"; description = "Rare tiger stripes for assault rifle"; rarity = 9 },
      { name = "Battle Skin"; description = "Military skin"; rarity = 4 },
    ];
    let initialMaps : [GameMap] = [
      { name = "Jungle"; theme = "Dense jungle environment" },
      { name = "City"; theme = "Urban cityscape" },
      { name = "Castle"; theme = "Medieval castle theme" },
      { name = "Space Station"; theme = "Sci-fi space theme" },
      { name = "Seas"; theme = "Ocean seas and naval combat" },
    ];
    for (character in initialCharacters.vals()) {
      characterStore.add(characterCounter, character);
      characterCounter += 1;
    };
    for (vehicle in initialVehicles.vals()) {
      vehicleStore.add(vehicleCounter, vehicle);
      vehicleCounter += 1;
    };
    for (gunSkin in initialGunSkins.vals()) {
      gunSkinStore.add(gunSkinCounter, gunSkin);
      gunSkinCounter += 1;
    };
    for (gameMap in initialMaps.vals()) {
      mapStore.add(mapCounter, gameMap);
      mapCounter += 1;
    };
  };
};
