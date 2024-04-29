import { readdirSync, statSync } from 'fs'
import { join } from 'path'

import { Tail } from 'tail'

import config from './config'

export class LogReader {

  start (ws, pub) {
    if (this.tail) this.tail.unwatch()

    this.ws = ws
    this.pub = pub
    this.tail = null

    try {
      this.tail = new Tail(this.getLastLogFile(), { follow: true, useWatchFile: true })
      this.tail.on('line', this.processLine.bind(this))
    } catch (err) {}
  }

  processLine (line) {
    const lapSplit = line.match(/CarID: (\d+) just completed split index: (\d+) with time (.+s) \(.+$/)

    if (lapSplit) return this.processLapSplit(lapSplit)
  }

  getLastLogFile () {
    const path = join(process.cwd(), config.ACPLUGIN.acFolder, 'logs', 'session')
    const files = readdirSync(path)

    files.sort((a, b) => {
      const fileA = join(path, a)
      const fileB = join(path, b)
      return statSync(fileA).mtime.getTime() - statSync(fileB).mtime.getTime()
    })

    return join(path, files.slice(-1).pop())
  }

  processLapSplit (data) {
    const eventName = 'lap_split'

    const splitTime = data[3].match(/(?:(.+)h)?(?:(.+)m)?(.+)s/)
    let ms = 0

    const hours = splitTime[1] || 0
    const minutes = splitTime[2] || 0
    const seconds = splitTime[3] || 0

    ms += parseInt(hours) * 3600000
    ms += parseInt(minutes) * 60000
    ms += parseFloat(seconds) * 1000

    const eventData = {
      car_id: parseInt(data[1]),
      split_number: parseInt(data[2]),
      split_time: ms
    }

    this.ws.sockets.emit(eventName, eventData)
    this.pub.publish(eventName, eventData)
  }

}
