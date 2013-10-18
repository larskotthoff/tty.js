#!/usr/bin/env node

process.title = 'tty.js';

var tty = require('../');

var conf = tty.config.readConfig()
  , app = tty.createServer({
    shell: 'vagrant',
    shellArgs: [ "ssh" ],
    static: ".",
    cwd: "vms",
    users: {
      re: 'comp'
    },
    port: 8000
  });

app.listen();
