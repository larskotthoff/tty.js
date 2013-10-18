var control = document.getElementById('control'),
    button = document.getElementById('open');

function controlVM() {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io';
    socket = io.connect(null, { resource: resource });

    control.disabled = true;

    var el = document.createElement("div");
    el.className = "output";
    document.body.appendChild(el);

    if(button.disabled) {
      socket.emit("start", function(error) {
        if(error) {
          el.innerHTML = el.innerHTML + error.replace(/\n/g, "<br/>");
        } else {
          control.innerHTML = "Stop VM";
          button.disabled = false;
        }
        control.disabled = false;
        socket.removeAllListeners("output");
      });
    } else {
      socket.emit("stop", function(error) {
        if(error) {
          el.innerHTML = el.innerHTML + error.replace(/\n/g, "<br/>");
        } else {
          control.innerHTML = "Start VM";
          button.disabled = true;
        }
        control.disabled = false;
        socket.removeAllListeners("output");
      });
    }

    socket.on("output", function(data) {
      el.innerHTML = el.innerHTML + data.replace(/\n/g, "<br/>");
    });
}

function statusVM() {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io';
    socket = io.connect(null, { resource: resource });

    control.disabled = true;

    socket.emit("status", function(error) {
      if(error) console.log(error);
      socket.removeAllListeners("output");
      control.disabled = false;
    })

    socket.on("output", function(data) {
      if(data.match("running")) {
          control.innerHTML = "Stop VM";
          button.disabled = false;
      } else if(data.match("poweroff")) {
          control.innerHTML = "Start VM";
          button.disabled = true;
      }
    });
}
