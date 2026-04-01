# BrawlVerse

## Current State
New build -- no existing application files.

## Requested Changes (Diff)

### Add
- Full multiplayer fighting game with local and online modes
- Online multiplayer: room creation with shareable codes, random matchmaking, up to 20 players per room
- In-game chat for online matches
- Maps: Jungle, City, Castle, Space Station
- Selectable fighter roster
- 7 vehicle types: bike, car, van, tank, plane, ship, battle vehicle -- each with unique stats
- 6 gun skins
- Admin panel: CRUD for maps/settings, player ban
- Owner god mode: invincibility (G), fly (T), vehicle spawner (V), instant +500 coins (C), cannot be killed
- Internet Identity login for owner/admin features
- Backend: room state management, player sessions, chat messages, match management

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: rooms, players, chat, matchmaking, admin/owner RBAC via authorization component
2. Frontend: main menu, character select, map select, lobby with chat, game canvas, admin panel, owner HUD
3. Game engine: Canvas-based 2D fighting with keyboard controls, vehicle system, gun skins
4. Online sync: polling-based room state updates for up to 20 players
