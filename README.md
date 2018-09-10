# udp2ws

This Assetto Corsa Dedicated Server plugin creates an UDP Relay (to chain plugins) and proxies all the communication through WebSockets.


## Requirements

- Assetto Corsa Dedicated Server
- Any Linux x64 distro or Windows x64 (can be built for other OS, architectures)

## Live example

You can try this websockets service at [http://udp2ws.sim-racing.es/](http://udp2ws.sim-racing.es/).

Just click connect to play with a real Assetto Corsa Test Server.

You can also join the server to see the results of specific events. Server name is "udp2ws plugin test".

If is not up, you can always use your installation address to try it.

## Installation

Grab the last release from the  [releases](https://github.com/germanrcuriel/assetto-corsa-server-udp2ws/releases) page.

Unzip and place the files in the same host you have Assetto Corsa Dedicated Server.

Open `udp2ws.ini` file with your favorite editor and modify as you need.

```bash
nohup ./udp2ws 2>&1 &
```

This will keep the application running in the background.

## Usage example

You can connect through the websocket server ([socket.io](https://socket.io) server)

```html
<script src="http://localhost:30000/socket.io/socket.io.js"></script>
<script>
  var socket = io('http://localhost:30000');
  socket.emit('broadcast_message', 'Message sent from udp2ws');
</script>
```

Replace `localhost` by the server IP running `udp2ws`.

This specific command sends a message to everyone connected to the server.

## Authentication

This is only necessary if you set a password in `udp2ws.ini` file.

```js
socket.emit('authenticate', 'password')
```

Answer to that request will be sent to `console` event. See [WebSocket Errors and Info messages](#webSocket-errors-and-info-messages) for more info.

## WebSocket Errors and Info messages

In order to get error and information messages, you can subscribe to `console` event.

```js
socket.on('console', (messageObject) => { ... })
```

Each message received will contain:

- `type`. Message type (`error` or `success`)
- `level`. Context (`auth` or `permission`)
- `key`. Action identifier (each [WebSocket Command](#websocket-commands) name including `authenticate`)
- `message`. Human readable message

Assetto Corsa Dedicated Server errors are pending to implement in `console` event. They are being sent to `server_error` for now.

## WebSocket Events

### Car Information

```js
socket.on('car_info', (data) => { ... })
```

Triggered as a response of `get_car_info` command.

#### Definition

- `car_id`. **Integer**. Car ID.
- `is_connected`. **Boolean**.
- `car_model`. **String**. Car model.
- `car_skin`. **String**. Car skin.
- `driver_name`. **String**. Driver's name.
- `driver_team`. **String**. Driver's team.
- `driver_guid`. **String**. Driver's GUID.

---

### Car Update

```js
socket.on('car_update', (data) => { ... })
```

Triggered as a response of `enable_realtime_report` command.

#### Definition

- `car_id`. **Integer**. Car ID.
- `pos`. **Vector**. 3D Position vector.
- `velocity`. **Vector**. 3D velocity vector.
- `gear`. **Integer**. Gear.
- `engine_rpm`. **String**. Engine RPM.
- `normalized_spline_pos`. **Float**. Spline position.

---

### Chat

```js
socket.on('chat', (data) => { ... })
```

A message has been sent to the chat.

#### Definition

- `car_id`. **Integer**. Car ID.
- `message`. **String**. Message sent.

---

### Client event

```js
socket.on('client_event', (data) => { ... })
```

When a car hits other car or the environment

#### Definition

- `eventType`. **Integer**. Event Type.
- `car_id`. **Integer**. Car ID causing the collision.
- `other_car_id`. **Integer**. Car ID hit or `false` if collision with environment.
- `impact_speed`. **Float**. Speed of the collision.
- `world_pos`. **Vector**. Position of the collision.
- `rel_pos`. **Vector**. No clue.

`eventType` can be:
- `10`. **Collision** with car.
- `11`. **Collision** with environment.
- Others? No idea.

---

### Client Loaded

```js
socket.on('client_loaded', (data) => { ... })
```

A new driver joined the server

#### Definition

- `car_id`. **Integer**. Car ID.

---

### Collision with car

```js
socket.on('collision_with_car', (data) => { ... })
```

When a car hits other car

#### Definition

- `eventType`. **Integer**. Event Type (used by `client_event` event).
- `car_id`. **Integer**. Car ID causing the collision.
- `other_car_id`. **Integer**. Car ID hit.
- `impact_speed`. **Float**. Speed of the collision.
- `world_pos`. **Vector**. Position of the collision.
- `rel_pos`. **Vector**. No clue.

---

### Collision with environment

```js
socket.on('collision_with_env', (data) => { ... })
```

When a car hits the environment

#### Definition

- `eventType`. **Integer**. Event Type (used by `client_event` event).
- `car_id`. **Integer**. Car ID causing the collision.
- `other_car_id`. **Boolean**. Falsy value. (used by `collision_with_car` event).
- `impact_speed`. **Float**. Speed of the collision.
- `world_pos`. **Vector**. Position of the collision.
- `rel_pos`. **Vector**. No clue.

---

### Connection closed

```js
socket.on('connection_closed', (data) => { ... })
```

When a driver quits the server

#### Definition

- `driver_name`. **String**. Driver's name.
- `driver_guid`. **String**. Driver's GUID.
- `car_id`. **Integer**. Car ID.
- `car_model`. **String**. Car model.
- `car_skin`. **String**. Car skin.

---

### End session

```js
socket.on('end_session', (data) => { ... })
```

When a session ends. (Practice, Qualify...)

#### Definition

- `filename`. **String**. Path of the results file.

---

### Error

```js
socket.on('server_error', (data) => { ... })
```

Fired when an error occurs

#### Definition

- `message`. **String**. The error message.

---

### Lap completed

```js
socket.on('lap_completed', (data) => { ... })
```

When a lap is completed by a driver

#### Definition

- `car_id`. **Integer**. Car ID
- `laptime`. **Integer**. Time of the lap.
- `cuts`. **Integer**. Number of cuts.
- `cars_count`. **Integer**. Number of cars.
- `grip_level`. **Float**. Grip level.
- `leaderboard`. **Array**.

The `leaderboard` array contains, for each car:
- `car_id`. **Integer**. Car ID.
- `laptime`. **Integer**. Time of the lap.
- `laps`. **Integer**. Laps driven.
- `completed`. **Boolean**. Completed session.

---

### New connection

```js
socket.on('new_connection', (data) => { ... })
```

When a driver is joining the server

#### Definition

- `driver_name`. **String**. Driver's name.
- `driver_guid`. **String**. Driver's GUID.
- `car_id`. **Integer**. Car ID.
- `car_model`. **String**. Car model.
- `car_skin`. **String**. Car skin.

---

### New session

```js
socket.on('new_session', (data) => { ... })
```

A new session has been loaded. (Practice, Qualify...)

#### Definition

- `version`. **Integer**. Protocol Version.
- `session_index`. **Integer**. Session index.
- `current_session_index`. **Integer**. Current session index.
- `session_count`. **Integer**. Number of sessions.
- `server_name`. **String**. Server name.
- `track`. **String**. Track loaded.
- `track_config`. **String**. Track layout loaded.
- `name`. **String**. Session name.
- `type`. **String**. [Session type](#session-types).
- `time`. **Integer**. Session time.
- `laps`. **Integer**. Session laps.
- `wait_time`. **Integer**. Wait time until session.
- `ambient_temp`. **Integer**. Ambient temperature.
- `road_temp`. **Integer**. Road temperature.
- `weather_graphics`. **String**. Weather.
- `elapsed_ms`. **Integer**. Time elapsed.

---

### Session information

```js
socket.on('session_info', (data) => { ... })
```

As a response to `get_session_info` command.

#### Definition

Same as `new_session` event.

---

### Version

```js
socket.on('version', (data) => { ... })
```

#### Definition

- `version`. **Integer**. Protocol version.

---

## WebSocket Commands

### Admin command

```js
socket.emit('admin_command', command)
```

Will execute the command sent.

If `password` is set, this command will require to [authenticate](#authentication) first.

---

### Broadcast message

```js
socket.emit('broadcast_message', message)
```

Sends a message to the chat

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

### Enable realtime report

```js
socket.emit('enable_realtime_report', milliseconds)
```

Enables the realtime report by sending `car_update` events on an interval (in milliseconds).

---

### Get car info

```js
socket.emit('get_car_info', carId)
```

Fires the `car_info` event for the car id (integer).

---

### Get session info

```js
socket.emit('get_session_info', sessionIndex)
```

Fires the `session_info` event. `sessionIndex` is optional.

---

### Kick user

```js
socket.emit('kick_user', carId)
```

Kicks the `carId` from the server.

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

### Next session

```js
socket.emit('next_session')
```

Loads the next session.

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

### Restart session

```js
socket.emit('restart_session')
```

Restarts the current session.

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

### Send message

```js
socket.emit('send_message', carId, message)
```

Sends a private message to `carId`.

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

### Set session info

```js
socket.emit('set_session_info', sessionInfo)
```

Sets the session information.

`sessionInfo` is an Object with:

- `session_index`. **Integer**. Session index.
- `name`. **String**. Name of the session.
- `type`. **Integer**. [Type of the session](#session-types).
- `laps`. **Integer**. Number of laps.
- `time`. **Integer**. Session time in seconds.
- `wait_time`. **Integer**. Wait time in seconds.

If `password` is set in `udp2ws.ini` file, this command will require to [authenticate](#authentication) first.

---

## Session types

- `1` for Practice.
- `2` for Qualify.
- `3` for Race.
- `4` for Drag.
- `5` for Drift.
