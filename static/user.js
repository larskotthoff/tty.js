var control = document.getElementById('control'),
    button = document.getElementById('open');

function mkDiv(content) {
  el = document.createElement("div");
  el.className = "output";
  el.innerHTML = content.replace(/\n/g, "<br/>");
  document.body.appendChild(el);
}

function controlVM() {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io';
    socket = io.connect(null, { resource: resource });

    control.disabled = true;

    if(button.disabled) {
      socket.emit("start", function(error, res) {
        if(error) {
          res = error;
        } else {
          control.innerHTML = "Stop VM";
          button.disabled = false;
        }
        control.disabled = false;
        mkDiv(res);
      });
    } else {
      socket.emit("stop", function(error, res) {
        if(error) {
          res = error;
        } else {
          control.innerHTML = "Start VM";
          button.disabled = true;
        }
        control.disabled = false;
        mkDiv(res);
      });
    }
}
