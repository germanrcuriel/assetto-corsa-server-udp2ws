$(document).ready(function () {

  var socket
  var events = [
    'car_info',
    'car_update',
    'chat',
    'client_event',
    'client_loaded',
    'collision_with_car',
    'collision_with_env',
    'connection_closed',
    'end_session',
    'server_error',
    'lap_completed',
    'new_connection',
    'new_session',
    'session_info',
    'udp_close',
    'udp_error',
    'udp_listening',
    'unsupported_event',
    'version'
  ]

  function showResponse (eventType, message) {
    $('#socket-event-type').html('Event type: <code>' + eventType + '</code>')

    if (typeof message === "object") {
      message = utils.prettyPrint(message)
    }

    $('#socket-messages code').html(message)
  }

  function showDisconnectButton () {
    $('#server-connect')
      .removeClass('btn-success')
      .addClass('btn-danger')
      .html('Disconnect')
  }

  function showConnectButton () {
    $('#server-connect')
      .removeClass('btn-danger')
      .addClass('btn-success')
      .html('Connect')
  }

  function disableSend () {
    $('#server-request')
      .removeClass('btn-primary')
      .addClass('btn-secondary')
      .prop('disabled', 'disabled')
  }

  function enableSend () {
    if (!socket) return
    $('#server-request')
      .removeClass('btn-secondary')
      .addClass('btn-primary')
      .removeAttr('disabled')
  }

  function disableInput (input) {
    $('#server-message').prop('disabled', 'disabled')
  }

  function enableInput (input) {
    $('#server-message').removeAttr('disabled')
  }

  function setPlaceholder(input, message) {
    input.attr('placeholder', message)
  }

  function hideSecondaryInput () {
    $('#server-message-2').val('').parent().hide()
  }

  function showSecondaryInput () {
    $('#server-message-2').val('').parent().show()
  }

  function prepareSocket () {
    events.forEach(function (ev) {
      socket.on(ev, function (data) {
        console.log(ev, data)
        showResponse(ev, data)
      })
    })

    socket.on('connect', function () {
      showDisconnectButton()
      enableSend()
      showResponse(null, 'Connected to server')
    })

    socket.on('reconnecting', function () {
      disableSend()
      showResponse(null, 'Reconnecting to server')
    })

    socket.on('disconnect', function () {
      showConnectButton()
      disableSend()
      showResponse(null, 'Disconnected from server')
    })

    socket.on('connect_error', function () {
      showConnectButton()
      disableSend()
      showResponse(null, 'Can\'t connect to server')
    })
  }

  $('#server-action').on('change', function () {
    var input = $('#server-message')
    var secondaryInput = $('#server-message-2')

    input.val('')
    secondaryInput.val('')

    enableSend()
    enableInput()
    hideSecondaryInput()

    switch ($(this).val()) {
      case 'admin_command':
        setPlaceholder(input, '/kick_user 0')
        break;
      case 'broadcast_message':
        setPlaceholder(input, 'Message')
        break;
      case 'enable_realtime_report':
        setPlaceholder(input, 'Time in milliseconds, 0 to disable')
        break;
      case 'get_car_info':
      case 'kick_user':
        setPlaceholder(input, 'Car ID')
        break;
      case 'get_session_info':
        setPlaceholder(input, 'Session index')
        break;
      case 'next_session':
      case 'restart_session':
        disableInput(input)
        break;
      case 'send_message':
        showSecondaryInput()
        setPlaceholder(input, 'Car ID')
        setPlaceholder(secondaryInput, 'Message')
        break;
      case 'set_session_info':
        setPlaceholder(input, 'Not implemented here yet!')
        disableInput()
        disableSend()
        break;
      default:
        disableInput()
        disableSend()
    }

  })

  $('#server-request').on('click', function () {
    if (!socket) return

    var action = $('#server-action').val()
    var message = $('#server-message').val()
    var message2 = $('#server-message-2').val()

    if (action === 'send_message') {
      socket.emit(action, message, message2)
    } else {
      socket.emit(action, message)
    }

    $('#server-message').val('')
  })

  $('#server-connect').on('click', function () {
    if (socket) {
      socket.disconnect()
      showConnectButton()
      disableSend()
      return socket = null
    }

    socket = io($('#server-address').val())
    prepareSocket()
  })

})
