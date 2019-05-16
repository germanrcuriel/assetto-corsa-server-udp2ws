import io from 'socket.io'
import ACSP from './udp/acsp'

import config from './config'
import actions from './actions'

const ws = io(config.WEBSOCKETS)
const udp = new ACSP(config)
const adminPassword = config.WEBSOCKETS.password

const postAuthenticate = (socket) => {
  actions.private.forEach((action) => {
    socket.on(action.name, (...data) => {
      if (adminPassword && !socket.isAdmin) {
        socket.emit('console', {
          type: 'error',
          level: 'permission',
          key: action.name,
          message: 'Unauthorized'
        })
        return
      }
      udp[action.command](...data)
    })
  })
}

ws.on('connection', (socket) => {

  actions.public.forEach((action) => {
    socket.on(action.name, (...data) => {
      udp[action.command](...data)
    })
  })

  if (adminPassword) {
    socket.on('authenticate', (password) => {
      if (password !== adminPassword) {
        socket.isAdmin = false
        socket.emit('console', {
          type: 'error',
          level: 'auth',
          key: 'authenticate',
          message: 'Login failed'
        })
        return
      }

      socket.isAdmin = true
      socket.emit('console', {
        type: 'success',
        level: 'auth',
        key: 'authenticate',
        message: 'Logged in'
      })
    })
  }

  postAuthenticate(socket)
})

udp.events.forEach((eventName) => {
  udp.on(eventName, (data) => ws.sockets.emit(eventName, data))
})

ws.listen(config.WEBSOCKETS.port)
