import io from 'socket.io'
import ACSP from './udp/acsp'

import config from './config'
import actions from './actions'

const ws = io(config.WEBSOCKETS)
const udp = new ACSP(config)

ws.on('connection', (socket) => {

  actions.forEach((action) => {
    socket.on(action.name, (data) => {
      udp[action.command](data)
    })
  })

  udp.events.forEach((eventName) => {
    udp.on(eventName, (data) => socket.emit(eventName, data))
  })

})

ws.listen(config.WEBSOCKETS.port)
