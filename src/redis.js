import Redis from 'ioredis'
import config from './config'

const redisOptions = {
  host: config.REDIS.redisHost,
  port: config.REDIS.redisPort,
  password: config.REDIS.redisPassword,
  lazyConnect: true,
  retryStrategy: (times) => {
    if (times > 2) return null
    return times * 1000
  }
}

class BaseClass {

  constructor () {
    this.getInstance()
    this.connect()
  }

  getInstance () {
    if (!this.instance) {
      this.instance = new Redis(redisOptions)
    }

    return this.instance
  }

  async connect () {
    if (!config.REDIS.redisEnabled) return

    try {
      this.attachEvents()
      await this.instance.connect()
    } catch (error) {
      console.log('error')
    }
  }

  attachEvents () {
    return null
  }

}

export class RedisPublisher extends BaseClass {

  attachEvents () {
    this.instance.on('error', this.onError.bind(this))
  }

  onError (error) {
    console.log('RedisPublisher', error.code)
  }

  publish (eventName, message) {
    const channel = `${config.REDIS.redisPublishChannel}.${eventName}`

    if (this.instance.status !== 'ready') return
    if (!config.REDIS.redisEvents.includes(eventName)) return
    this.instance.publish(channel, JSON.stringify(message))
  }

}

export class RedisSubscriber extends BaseClass {

  constructor (options = {}) {
    super(options)
    this.onReceiveMessage = options.onMessage || this.onReceiveMessage
  }

  attachEvents () {
    this.instance.on('error', this.onError.bind(this))
    this.instance.on('ready', this.onReady.bind(this))
  }

  onError (error) {
    console.log('RedisSubscriber', error.code)
  }

  onReady () {
    this.instance.psubscribe(config.REDIS.redisSubscribeChannel)
    this.instance.on('pmessage', this.onMessage.bind(this))
  }

  onMessage (pattern, channel, message) {
    const channelPrefix = pattern.replace('*', '')
    const command = channel.replace(channelPrefix, '')
    this.onReceiveMessage(command, message)
  }

  onReceiveMessage (command, message) {
    console.log(command, message)
  }

}
