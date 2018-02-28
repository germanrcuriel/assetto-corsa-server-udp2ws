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
  WEBSOCKETS: {
    origins: '',
    port: 30000
  }
}

if (existsSync(configFile)) {
  const contents = ini.parse(readFileSync(configFile, 'UTF8'))
  config = Object.assign({}, config, contents)
}

export default config
