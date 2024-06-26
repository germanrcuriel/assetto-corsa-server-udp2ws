import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import ini from 'ini'

import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'

const argv = yargs(hideBin(process.argv)).argv

const configFile = argv.config || join(process.cwd(), 'udp2ws.ini')

let config = {
  hostname: '127.0.0.1',
  ACPLUGIN: {
    acFolder: '../..',
    receivePort: 11000,
    sendPort: 12000
  },
  REDIS: {
    redisEnabled: false,
    redisHost: '127.0.0.1',
    redisPort: 6379,
    redisPassword: '',
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
    origins: [],
    port: 30000,
    password: ''
  }
}

if (existsSync(configFile)) {
  const contents = ini.parse(readFileSync(configFile, 'UTF8'))
  config = Object.assign({}, config, contents)
}

console.log(config)

export default config
