# BrawlVerse

## Current State
- Local multiplayer fighting game (2 players, same screen)
- 5 characters, 7 vehicles, 6 gun skins, 4 maps
- Admin panel for managing game assets
- Owner god mode (invincibility, fly, vehicle spawn, coins)
- No online/network multiplayer
- No chat

## Requested Changes (Diff)

### Add
- Online multiplayer lobby system with room creation and shareable room codes
- Random matchmaking (join any open room)
- Up to 20 players per room
- In-room chat (messages tied to a room, displayed during lobby and match)
- New backend data: Room, RoomPlayer, ChatMessage types
- Backend APIs: createRoom, joinRoom, joinRandomRoom, leaveRoom, getRoomState, sendChatMessage, getRoomMessages, listOpenRooms
- Online lobby page (create/join room, see players in room, chat, start match when ready)
- Online game flow: host selects map, all players pick characters/loadouts, then game starts

### Modify
- App.tsx: add new views for online lobby ("lobby", "online-setup", "online-game")
- LandingPage: add "Play Online" button alongside existing "Play Local" button
- GameSetup: keep as-is for local play

### Remove
- Nothing removed

## Implementation Plan
1. Add Room, RoomPlayer, ChatMessage types to Motoko backend
2. Implement room CRUD, join/leave, matchmaking, chat message APIs in backend
3. Regenerate frontend bindings (backend.d.ts)
4. Add OnlineLobby page: create room (get code), join by code, join random, show players list, chat panel
5. Add OnlineGameSetup page: each player picks character/vehicle/gun skin before match starts
6. Wire new views into App.tsx routing
7. Poll backend every 2-3 seconds for room state updates (no WebSockets needed)
