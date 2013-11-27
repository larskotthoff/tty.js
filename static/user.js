function controlVM(vm) {
    var div = document.getElementById("container-" + vm),
        statusdiv = document.getElementById("status-" + vm),
        control = document.getElementById("control-" + vm),
        button = document.getElementById("terminal-" + vm);

    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    control.disabled = true;

    var el = document.createElement("div");
    el.className = "output";
    div.appendChild(el);

    if(button.disabled) {
      statusdiv.innerHTML = "starting...";
      socket.emit("start", { name: vm }, function(error) {
        if(error) {
          el.innerHTML = el.innerHTML + error.replace(/\n/g, "<br/>");
          statusdiv.innerHTML = "faulted";
        } else {
          control.innerHTML = "Stop VM";
          statusdiv.innerHTML = "running";
          button.disabled = false;
        }
        control.disabled = false;
        socket.removeAllListeners("output");
      });
    } else {
      statusdiv.innerHTML = "stopping...";
      button.disabled = true;
      socket.emit("stop", { name: vm }, function(error) {
        if(error) {
          el.innerHTML = el.innerHTML + error.replace(/\n/g, "<br/>");
          statusdiv.innerHTML = "faulted";
        } else {
          control.innerHTML = "Start VM";
          statusdiv.innerHTML = "stopped";
        }
        control.disabled = false;
        socket.removeAllListeners("output");
      });
    }

    socket.on("output", function(data) {
      el.innerHTML = el.innerHTML + data.replace(/\n/g, "<br/>");
    });
}

function getVMStatus(vm, f) {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    var out = [];
    socket.emit("status", { name: vm }, function(error) {
      if(error) console.log(error);
      socket.removeAllListeners("output");
      f(out.join(" "));
    })

    socket.on("output", function(data) {
      out.push(data);
    });
}

function listVMs(f) {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource });

    socket.emit("list", function(error, data) {
      if(error) console.log(error);
      socket.removeAllListeners("output");
      f(data);
    })
}
