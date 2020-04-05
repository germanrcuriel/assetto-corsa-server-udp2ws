import { existsSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import ini from 'ini'

const configFile = join(dirname(process.execPath), 'udp2ws.ini')

let config = {
  hostname: '127.0.0.1',
  ACPLUGIN: {
    receivePort: 11000,
    sendPort: 12000
  },
  REDIS: {
    enabled: false,
    host: '127.0.0.1',
    port: 6379,
    password: '',
    publishChannel: 'udp2ws.events',
    eventsToPublish: [
      'car_info',
      'chat',
      'client_loaded',
      'connection_closed',
      'end_session',
      'error',
      'lap_completed',
      'new_connection',
      'new_session',
      'session_info'
    ],
    subscribeChannel: 'udp2ws.commands.*'
  },
  WEBSOCKETS: {
    origins: '',
    port: 30000,
    password: ''
  }
}

if (existsSync(configFile)) {
  const contents = ini.parse(readFileSync(configFile, 'UTF8'))
  config = Object.assign({}, config, contents)
}

export default config
