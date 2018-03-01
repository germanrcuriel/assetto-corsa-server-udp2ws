import EventEmitter from 'events'
import dgram from 'dgram'

import { SmartBuffer } from 'smart-buffer'

import events from './events'
import types from './types'

class ACSP extends EventEmitter {

  constructor (config) {
    super()
    this.config = config
    this.events = events
    this.createClient()
    this.createServer()
  }

  createServer () {
    if (!this.config.ACPLUGIN.proxyPluginLocalPort) return

    this.server = dgram.createSocket('udp4')

    this.server
      .on('message', this.send.bind(this))
      .on('error', this.send.bind(this))
      .bind(this.config.ACPLUGIN.proxyPluginLocalPort)
  }

  createClient () {
    this.client = dgram.createSocket('udp4')

    this.client
      .on('listening', this.onSockListening.bind(this))
      .on('message', this.onSockMessage.bind(this))
      .on('error', this.onSockError.bind(this))
      .on('close', this.onSockClose.bind(this))
      .bind(this.config.ACPLUGIN.receivePort)
  }

  onSockListening (details) {
    this.emit('udp_listening')
  }

  onSockError (err) {
    this.emit('udp_error', err)
  }

  onSockClose () {
    this.emit('udp_close')
  }

  onSockMessage (buf) {
    this.sendToProxy(buf)
    buf = SmartBuffer.fromBuffer(buf)
    const id = buf.readUInt8()

    switch (id) {
      case types.ERROR:
        return this.onError(buf)
      case types.VERSION:
        return this.onVersion(buf)
      case types.NEW_SESSION:
      case types.SESSION_INFO:
        return this.onSessionInfo(buf, id)
      case types.END_SESSION:
        return this.onEndSession(buf)
      case types.CHAT:
        return this.onChat(buf)
      case types.NEW_CONNECTION:
      case types.CONNECTION_CLOSED:
        return this.onNewOrClosedConnection(buf, id)
      case types.CLIENT_LOADED:
        return this.onClientLoaded(buf)
      case types.LAP_COMPLETED:
        return this.onLapCompleted(buf)
      case types.CAR_INFO:
        return this.onCarInfo(buf)
      case types.CAR_UPDATE:
        return this.onCarUpdate(buf)
      case types.CLIENT_EVENT:
        return this.onClientEvent(buf)
      default:
        return this.onUnsupportedEvent(id)
    }
  }

  onError (buf) {
    const serverError = {
      message: this.readStringW(buf)
    }
    this.emit('server_error', serverError)
  }

  onVersion (buf) {
    const message = {
      version: buf.readUInt8()
    }
    this.emit('version', message)
  }

  onSessionInfo (buf, id) {
    const sessionInfo = {
      version: buf.readUInt8(),
      session_index: buf.readUInt8(),
      current_session_index: buf.readUInt8(),
      session_count: buf.readUInt8(),
      server_name: this.readStringW(buf),
      track: this.readString(buf),
      track_config: this.readString(buf),
      name: this.readString(buf),
      type: buf.readUInt8(),
      time: buf.readUInt16LE(),
      laps: buf.readUInt16LE(),
      wait_time: buf.readUInt16LE(),
      ambient_temp: buf.readUInt8(),
      road_temp: buf.readUInt8(),
      weather_graphics: this.readString(buf),
      elapsed_ms: buf.readInt32LE()
    }

    if ((sessionInfo.wait_time % 1000) > 0) {
      sessionInfo.wait_time += 0x10000
    }

    if (id === types.NEW_SESSION) {
      return this.emit('new_session', sessionInfo)
    }

    this.emit('session_info', sessionInfo)
  }

  onEndSession (buf) {
    const endSession = {
      filename: this.readStringW(buf)
    }
    this.emit('end_session', endSession)
  }

  onChat (buf) {
    const message = {
      car_id: buf.readUInt8(),
      message: this.readStringW(buf)
    }
    this.emit('chat', message)
  }

  onNewOrClosedConnection (buf, id) {
    const carInfo = {
      driver_name: this.readStringW(buf),
      driver_guid: this.readStringW(buf),
      car_id: buf.readUInt8(),
      car_model: this.readString(buf),
      car_skin: this.readString(buf)
    }

    if (id === types.NEW_CONNECTION) {
      return this.emit('new_connection', carInfo)
    }

    this.emit('connection_closed', carInfo)
  }

  onClientLoaded (buf) {
    const client = {
      car_id: buf.readUInt8()
    }

    this.emit('client_loaded', client)
  }

  onLapCompleted (buf) {
    const lapInfo = {
      car_id: buf.readUInt8(),
      laptime: buf.readUInt32LE(),
      cuts: buf.readUInt8(),
      cars_count: buf.readUInt8(),
      grip_level: null,
      leaderboard: []
    }

    const cars = Array(lapInfo.cars_count).fill(0)

    cars.forEach(() => {
      lapInfo.leaderboard.push({
        car_id: buf.readUInt8(),
        laptime: buf.readUInt32LE(),
        laps: buf.readUInt16LE(),
        completed: (buf.readUInt8() !== 0)
      })
    })

    lapInfo.grip_level = buf.readFloatLE()

    this.emit('lap_completed', lapInfo)
  }

  onCarInfo (buf) {
    const carInfo = {
      car_id: buf.readUInt8(),
      is_connected: (buf.readUInt8() !== 0),
      car_model: this.readStringW(buf),
      car_skin: this.readStringW(buf),
      driver_name: this.readStringW(buf),
      driver_team: this.readStringW(buf),
      driver_guid: this.readStringW(buf)
    }

    this.emit('car_info', carInfo)
  }

  onCarUpdate (buf) {
    const carInfo = {
      car_id: buf.readUInt8(),
      pos: this.readVector3f(buf),
      velocity: this.readVector3f(buf),
      gear: buf.readUInt8(),
      engine_rpm: buf.readUInt16LE(),
      normalized_spline_pos: buf.readFloatLE()
    }

    this.emit('car_update', carInfo)
  }

  onClientEvent (buf) {
    const eventType = buf.readUInt8()

    const isCarCollision = eventType === types.CE_COLLISION_WITH_CAR
    const isEnvCollision = eventType === types.CE_COLLISION_WITH_ENV

    const clientEvent = {
      eventType: eventType,
      car_id: buf.readUInt8(),
      other_car_id: isCarCollision ? buf.readUInt8() : false,
      impact_speed: buf.readFloatLE(),
      world_pos: this.readVector3f(buf),
      rel_pos: this.readVector3f(buf)
    }

    this.emit('client_event', clientEvent)

    if (isCarCollision) this.emit('collision_with_car', clientEvent)
    if (isEnvCollision) this.emit('collision_with_env', clientEvent)
  }

  onUnsupportedEvent (id) {
    this.emit('unsupported_event', id)
  }

  send (buf) {
    this.client.send(buf, 0, buf.length, this.config.ACPLUGIN.sendPort)
  }

  sendToProxy (buf) {
    if (!this.config.ACPLUGIN.proxyPluginPort) return
    this.server.send(buf, 0, buf.length, this.config.ACPLUGIN.proxyPluginPort)
  }

  requestCarInfo (id) {
    const buf = SmartBuffer.fromSize(2)
    buf.writeUInt8(types.GET_CAR_INFO, 0)
    buf.writeUInt8(id, 1)

    this.send(buf.toBuffer())
  }

  requestSessionInfo (index = 0) {
    const buf = SmartBuffer.fromSize(3)
    buf.writeUInt8(types.GET_SESSION_INFO)
    buf.writeUInt16LE(index, 1)

    this.send(buf.toBuffer())
  }

  setSessionInfo (sessionInfo) {
    const nameBuf = this.writeStringW(sessionInfo.name)
    const buf = SmartBuffer.fromSize(nameBuf.length + 15)
    buf.writeUInt8(types.SET_SESSION_INFO, 0)
    buf.writeUInt8(sessionInfo.session_index, 1)
    buf.writeBuffer(nameBuf, 2)
    buf.writeUInt8(sessionInfo.type, nameBuf.length + 2)
    buf.writeUInt32LE(sessionInfo.laps, nameBuf.length + 3)
    buf.writeUInt32LE(sessionInfo.time, nameBuf.length + 7)
    buf.writeUInt32LE(sessionInfo.wait_time, nameBuf.length + 11)

    this.send(buf.toBuffer())
  }

  enableRealtimeReport (interval) {
    const buf = SmartBuffer.fromSize(3)
    buf.writeUInt8(types.REALTIMEPOS_INTERVAL, 0)
    buf.writeInt16LE(interval, 1)

    this.send(buf.toBuffer())
  }

  sendMessage (id, message) {
    const msgBuf = this.writeStringW(message)
    const buf = SmartBuffer.fromSize(msgBuf.length + 2)
    buf.writeUInt8(types.SEND_CHAT, 0)
    buf.writeUInt8(id, 1)
    buf.writeBuffer(msgBuf, 2)

    this.send(buf.toBuffer())
  }

  broadcastMessage (message) {
    const msgBuf = this.writeStringW(message)
    const buf = SmartBuffer.fromSize(msgBuf.length + 1)
    buf.writeUInt8(types.BROADCAST_CHAT, 0)
    buf.writeBuffer(msgBuf, 1)

    this.send(buf.toBuffer())
  }

  adminCommand (command) {
    const cmdBuf = this.writeStringW(command)
    const buf = SmartBuffer.fromSize(cmdBuf.length + 1)
    buf.writeUInt8(types.ADMIN_COMMAND, 0)
    buf.writeBuffer(cmdBuf, 1)

    this.send(buf.toBuffer())
  }

  restartSession () {
    const buf = SmartBuffer.fromSize(1)
    buf.writeUInt8(types.RESTART_SESSION, 0)

    this.send(buf.toBuffer())
  }

  nextSession () {
    const buf = SmartBuffer.fromSize(1)
    buf.writeUInt8(types.NEXT_SESSION, 0)

    this.send(buf.toBuffer())
  }

  kickUser (id) {
    const buf = SmartBuffer.fromSize(2)
    buf.writeUInt8(types.KICK_USER, 0)
    buf.writeUInt8(id, 1)

    this.send(buf.toBuffer())
  }

  readString (buf) {
    const length = buf.readUInt8()
    const message = buf.readString(length)

    return message
  }

  readStringW (buf) {
    const length = buf.readUInt8()
    const message = buf.readString(length * 4, 'utf-16le')

    return message.replace(/\u0000/gi, '')
  }

  readVector3f (buf) {
    return {
      x: buf.readFloatLE(),
      y: buf.readFloatLE(),
      z: buf.readFloatLE()
    }
  }

  writeStringW (str) {
    str = '' + str
    str.substr(0, 255)

    const converted = str.split('').join('\u0000') + '\u0000'

    const buf = SmartBuffer.fromSize((str.length * 4) + 1)
    buf.writeUInt8(str.length, 0)
    buf.writeString(converted, 1, 'utf-16le')

    return buf.toBuffer()
  }

}

export default ACSP
