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
      this.tail = new Tail(this.getLastLogFile(), { follow: true })
      this.tail.on('line', this.processLine.bind(this))
    } catch (err) {}
  }

  processLine (line) {
    const lapSplit = line.match(/^Car.onSplitCompleted\s+(\d+)\s+(\d+)\s+(\d+)$/)

    if (lapSplit) return this.processLapSplit(lapSplit)
  }

  getLastLogFile () {
    const path = join(process.cwd(), `${config.ACPLUGIN.acFolder}/logs/session`)
    const files = readdirSync(path)

    files.sort((a, b) => {
      return statSync(`${path}/${a}`).mtime.getTime() - statSync(`${path}/${b}`).mtime.getTime()
    })

    return `${path}/${files.slice(-1).pop()}`
  }

  processLapSplit (data) {
    const eventName = 'lap_split'
    const eventData = {
      car_id: parseInt(data[1]),
      split_number: parseInt(data[2]),
      split_time: parseInt(data[3])
    }

    this.ws.sockets.emit(eventName, eventData)
    this.pub.publish(eventName, eventData)
  }

}
