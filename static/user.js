"use strict";

function controlVM(vm) {
    var div = d3.select("#container-" + vm)
      , statusdiv = d3.select("#status-" + vm)
      , control = d3.select("#control-" + vm)
      , button = d3.select("#terminal-" + vm);

    var parts = document.location.pathname.split('/')
      , base = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = base.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    control.attr("disabled", true);

    div.selectAll(".output").remove();
    var el = div.append("div").attr("class", "output");

    if(button.attr("disabled")) {
      statusdiv.text("starting...");
      socket.emit("start", { name: vm }, function(error) {
        if(error) {
          el.html(el.html() + error.replace(/\n/g, "<br/>"));
          statusdiv.text("faulted");
        } else {
          control.text("Stop VM");
          statusdiv.text("running");
          button.attr("disabled", null);
        }
        control.attr("disabled", null);
        socket.removeAllListeners("output");
      });
    } else {
      statusdiv.text("stopping...");
      button.attr("disabled", true);
      socket.emit("stop", { name: vm }, function(error) {
        if(error) {
          el.html(el.html() + error.replace(/\n/g, "<br/>"));
          statusdiv.text("faulted");
        } else {
          control.text("Start VM");
          statusdiv.text("stopped");
        }
        control.attr("disabled", null);
        socket.removeAllListeners("output");
      });
    }

    socket.on("output", function(data) {
      el.html(el.html() + data.replace(/\n/g, "<br/>"));
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

var vms;

listVMs(function(_vms) {
  vms = _vms;
  vms.forEach(function(vm) {
      if(vm.boxed) d3.select("#new-base").append("option").text(vm.name);

      var container = d3.select("#vms").append("div").append("fieldset")
                  .attr("class", "container")
                  .attr("id", "container-" + vm.name),
          name = container.append("legend")
                       .attr("class", "name")
                       .text(vm.name),
          statusdiv = container.append("div")
                         .attr("class", "status")
                         .attr("id", "status-" + vm.name)
                         .text("Checking status..."),
          controldiv = container.append("div")
                          .attr("class", "control"),
          sbutton = controldiv.append("button")
                              .attr("id", "control-" + vm.name)
                              .attr("disabled", true)
                              .text("Checking status...")
                              .on("click", function() {
                                controlVM(vm.name);
                              }),
          tbutton = controldiv.append("button")
                              .attr("id", "terminal-" + vm.name)
                              .attr("disabled", true)
                              .text("Open Terminal");

      makeTTY(vm.name);

      getVMStatus(vm.name, function(data) {
          sbutton.attr("disabled", null);
          if(data.match("running")) {
              statusdiv.text("running");
              sbutton.text("Stop VM");
              tbutton.attr("disabled", null);
          } else if(data.match("poweroff")) {
              statusdiv.text("stopped");
              sbutton.text("Start VM");
              tbutton.attr("disabled", true);
          } else {
              statusdiv.text("Failed to determine!");
              console.log(data);
              sbutton.text("Start VM");
              tbutton.attr("disabled", true);
              sbutton.attr("disabled", true);
          }
      })
  });
});

function create() {
    var ct = d3.select("#new")
      , name = d3.select("#new-name")[0][0].value.replace(/(^\s+|\s+$)/g, '')
      , base = d3.select("#new-base").selectAll("option:checked").text();

    ct.selectAll(".error").remove();
    if(name.length == 0) {
        ct.append("div").attr("class", "error").text("Please enter a name!");
        return;
    }
    if(vms.indexOf(name) != -1 || name == "precise64") {
        ct.append("div").attr("class", "error").text("VM already exists!");
        return;
    }
    if(base == "Based on...") {
        ct.append("div").attr("class", "error").text("Please select a base VM!");
        return;
    }

    var container = d3.select("#vms").append("div").append("fieldset")
                .attr("class", "container")
                .attr("id", "container-" + name),
        legend = container.append("legend")
                     .attr("class", "name")
                     .text(name),
        statusdiv = container.append("div")
                       .attr("class", "status")
                       .attr("id", "status-" + name)
                       .text("Creating..."),
        controldiv = container.append("div")
                        .attr("class", "control"),
        sbutton = controldiv.append("button")
                            .attr("id", "control-" + name)
                            .attr("disabled", true)
                            .text("Creating...")
                            .on("click", function() {
                              controlVM(name);
                            }),
        tbutton = controldiv.append("button")
                            .attr("id", "terminal-" + name)
                            .attr("disabled", true)
                            .text("Open Terminal");

    makeTTY(name);
    vms.push({ 'name': name, 'boxed': false});

    var parts = document.location.pathname.split('/')
      , pathBase = parts.slice(0, parts.length - 1).join('/') + '/'
      , resource = pathBase.substring(1) + 'socket.io'
      , socket = io.connect(null, { resource: resource, 'force new connection': true });

    var el = container.append("div").attr("class", "output");

    socket.emit("createVM", { 'name': name, 'base': base }, function(error) {
      if(error) {
        el.html(el.html() + error.replace(/\n/g, "<br/>"));
        statusdiv.text("faulted");
      } else {
        sbutton.text("Start VM");
        sbutton.attr("disabled", null);
        statusdiv.text("Stopped");
      }
      socket.removeAllListeners("output");
    });

    socket.on("output", function(data) {
      el.html(el.html() + data.replace(/\n/g, "<br/>"));
    });
}
