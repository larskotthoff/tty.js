"use strict";

function controlVM(vm) {
    var div = d3.select("#container-" + vm.name)
      , statusdiv = d3.select("#status-" + vm.name)
      , control = d3.select("#control-" + vm.name)
      , boxbutton = d3.select("#box-" + vm.name)
      , button = d3.select("#terminal-" + vm.name);

    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    var el = setupOp(vm);

    if(vm.running) {
      statusdiv.text("stopping...");
      button.attr("disabled", true);
      socket.emit("stop", { name: vm.name }, function(error) {
        if(error) {
          el.html(el.html() + error.replace(/\n|\r/g, "<br/>"));
          statusdiv.text("faulted");
        } else {
          control.text("Start VM");
          statusdiv.text("stopped");
        }
        vm.running = false;
        control.attr("disabled", null);
        boxbutton.attr("disabled", null);
        socket.removeAllListeners("output");
      });
    } else {
      statusdiv.text("starting...");
      socket.emit("start", { name: vm.name }, function(error) {
        if(error) {
          el.html(el.html() + error.replace(/\n|\r/g, "<br/>"));
          statusdiv.text("faulted");
        } else {
          control.text("Stop VM");
          statusdiv.text("running");
          button.attr("disabled", null);
          vm.running = true;
        }
        control.attr("disabled", null);
        boxbutton.attr("disabled", null);
        socket.removeAllListeners("output");
      });
    }

    socket.on("output", function(data) {
      el.html(el.html() + data.replace(/\n|\r/g, "<br/>"));
    });
}

function box(vm) {
    var div = d3.select("#container-" + vm.name)
      , statusdiv = d3.select("#status-" + vm.name)
      , control = d3.select("#control-" + vm.name)
      , controldiv = d3.select("#controldiv-" + vm.name)
      , boxbutton = d3.select("#box-" + vm.name)
      , button = d3.select("#terminal-" + vm.name);

    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    var el = setupOp(vm);

    statusdiv.text("boxing...");
    button.attr("disabled", true);
    boxbutton.attr("disabled", true);

    statusdiv.text("boxing up...");
    control.text("Start VM");
    vm.running = false;
    socket.emit("package", { name: vm.name }, function(error) {
      if(error) {
        el.html(el.html() + error.replace(/\n|\r/g, "<br/>"));
        statusdiv.text("faulted");
      } else {
        if(!vm.boxed) {
            d3.select("#new-base").append("option").text(vm.name);
            controldiv.insert("a", "*")
                      .attr("href", "vms/" + vm.name + "/" + vm.name + ".box")
                      .text("Download package");
        }
        vm.boxed = true;
        statusdiv.text("stopped");
      }
      control.attr("disabled", null);
      boxbutton.attr("disabled", null);
      socket.removeAllListeners("output");
    });

    socket.on("output", function(data) {
      el.html(el.html() + data.replace(/\n|\r/g, "<br/>"));
    });
}

function getVMStatus(vm, f) {
    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    var out = [];
    socket.emit("status", { name: vm.name }, function(error) {
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

function mkVMDiv(vm, placeholder) {
  if(d3.select("#container-" + vm.name).empty()) {
      var container = d3.select("#vms").append("div").append("fieldset")
                  .attr("class", "container")
                  .attr("id", "container-" + vm.name),
          name = container.append("legend")
                       .attr("class", "name")
                       .text(vm.name),
          statusdiv = container.append("div")
                         .attr("class", "status")
                         .attr("id", "status-" + vm.name)
                         .text(placeholder),
          controldiv = container.append("div")
                          .attr("id", "controldiv-" + vm.name)
                          .attr("class", "control"),
          sbutton = controldiv.append("button")
                              .attr("id", "control-" + vm.name)
                              .attr("disabled", true)
                              .text(placeholder)
                              .on("click", function() {
                                controlVM(vm);
                              }),
          tbutton = controldiv.append("button")
                              .attr("id", "terminal-" + vm.name)
                              .attr("disabled", true)
                              .text("Open Terminal"),
          bbutton = controldiv.append("button")
                              .attr("id", "box-" + vm.name)
                              .text("Box up")
                              .on("click", function() {
                                box(vm);
                              });
    if(vm.boxed) {
      controldiv.insert("a", "*")
                .attr("href", "vms/" + vm.name + "/" + vm.name + ".box")
                .text("Download package");
    }
  }
}

function setupOp(vm) {
    var div = d3.select("#container-" + vm.name)
      , control = d3.select("#control-" + vm.name)
      , boxbutton = d3.select("#box-" + vm.name)
      , button = d3.select("#terminal-" + vm.name);

    control.attr("disabled", true);
    button.attr("disabled", true);
    boxbutton.attr("disabled", true);

    div.selectAll(".output").remove();
    var el = div.append("div").attr("class", "output");

    return el;
}

var vms;

listVMs(function(_vms) {
  vms = _vms;
  vms.forEach(function(vm) {
      if(vm.boxed) d3.select("#new-base").append("option").text(vm.name);

      mkVMDiv(vm, "Checking status...");
      makeTTY(vm.name);

      var div = d3.select("#container-" + vm.name)
        , statusdiv = d3.select("#status-" + vm.name)
        , control = d3.select("#control-" + vm.name)
        , button = d3.select("#terminal-" + vm.name);

      getVMStatus(vm, function(data) {
          control.attr("disabled", null);
          if(data.match("running")) {
              statusdiv.text("running");
              control.text("Stop VM");
              button.attr("disabled", null);
              vm.running = true;
          } else if(data.match("poweroff")) {
              statusdiv.text("stopped");
              control.text("Start VM");
              button.attr("disabled", true);
              vm.running = false;
          } else {
              statusdiv.text("Failed to determine!");
              console.log(data);
              control.text("Start VM");
              control.attr("disabled", true);
              button.attr("disabled", true);
          }
      })
  });
});

function create() {
    var ct = d3.select("#new")
      , name = d3.select("#new-name")[0][0].value.replace(/(^\s+|\s+$)/g, '')
      , base = d3.select("#new-base").selectAll("option:checked").text();

    ct.selectAll(".error").remove();
    if(name.match(/^[a-zA-Z0-9-_]+$/) === null) {
        ct.append("div").attr("class", "error").text("Invalid name!");
        return;
    }
    if(vms.map(function(d) { return d.name; }).indexOf(name) != -1 || name == "precise64") {
        ct.append("div").attr("class", "error").text("VM already exists!");
        return;
    }
    if(base == "Based on...") {
        ct.append("div").attr("class", "error").text("Please select a base VM!");
        return;
    }

    var vm = { 'name': name, 'boxed': false, 'running': false };
    vms.push(vm);
    mkVMDiv(vm, "Creating...");
    makeTTY(name);

    var parts = document.location.pathname.split('/')
      , pathBase = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = pathBase.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true })
      , statusdiv = d3.select("#status-" + vm.name)
      , control = d3.select("#control-" + vm.name);

    var el = setupOp(vm);

    socket.emit("createVM", { 'name': name, 'base': base }, function(error) {
      if(error) {
        el.html(el.html() + error.replace(/\n|\r/g, "<br/>"));
        statusdiv.text("faulted");
      } else {
        control.text("Start VM");
        control.attr("disabled", null);
        statusdiv.text("Stopped");
      }
      socket.removeAllListeners("output");
    });

    socket.on("output", function(data) {
      el.html(el.html() + data.replace(/\n|\r/g, "<br/>"));
    });
}
