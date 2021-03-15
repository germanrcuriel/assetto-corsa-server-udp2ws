$(document).ready(function () {

  var socket = io('http://cloud.germix.net:30000')
  var server = 'http://cloud.germix.net:8081/INFO'
  var current_session = 0
  var last_track

  socket.on('connect_error', function () {
    renderOffline()
  })

  socket.on('disconnect', function () {
    renderOffline()
  })

  function renderOffline () {
    $('.online').hide()
    $('.offline').show()
  }

  function renderOnline () {
    $('.offline').hide()
    $('.online').show()
  }

  socket.on('connect', function () {

    renderOnline()

    function getSessionInfo (cb) {
      socket.on('session_info', function parse (data) {
        if (data.session_index === data.current_session_index) {
          socket.off(parse)
          return cb(data)
        }

        socket.emit('get_session_info', data.current_session_index)
      })
    }

    function renderStatus (status) {
      current_session = status.current_session_index

      $('.server-name').html(status.server_name)
      $('.server-session').html(status.name)
      $('.ambient-temp').html(status.ambient_temp + '℃')
      $('.road-temp').html(status.road_temp + '℃')
      $('.weather').html(status.weather_graphics)

      var trackPath = '/assets/assetto/tracks/' + status.track

      if (status.track !== last_track) {
        $.getJSON(trackPath + '/ui/ui_track.json', function (data) {
          $('.track-preview').attr('src', trackPath + '/ui/preview.png')
          $('.track-outline').attr('src', trackPath + '/ui/outline.png')

          $('.track-name').html(data.name)
          $('.track-description').html(data.description)
          $('.track-city').html(data.city)
          $('.track-country').html(data.country)
          $('.track-length').html(data.length / 1000 + ' km')
          $('.track-width').html(data.width + ' m')

          $('.server-name').html(status.server_name)
          $('.server-session').html(status.name)
          $('.ambient-temp').html(status.ambient_temp + '℃')
          $('.road-temp').html(status.road_temp + '℃')
        })

        last_track = status.track
      }
    }

    getSessionInfo(function (data) {
      renderStatus(data)
      socket.on('new_session', renderStatus)
    })

    socket.emit('get_session_info')

  })

})
