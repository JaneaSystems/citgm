'use strict';
const uuid = require('node-uuid');
const path = require('path');
const fs = require('fs');
const which = require('which').sync;
const escape = require('querystring').escape;

function VerifyNodeGyp(context) {
  if (!(this instanceof VerifyNodeGyp))
    return new VerifyNodeGyp(context);
  this.verifyNodeGyp = context.module.verifyNodeGyp;
  if (!this.verifyNodeGyp)
    return;
  const id = uuid.v4();
  const scriptFilename = id + ".js";
  this.script = path.resolve(context.path, scriptFilename);  
  this.marker =  path.resolve(context.path, id + ".tmp");

  const nodeBin = which('node');
  const npmLocation = which('npm');
  const nodeGypBinary = path.resolve(path.dirname(npmLocation), 'node_modules', 'npm', 'node_modules', 'node-gyp', 'bin', 'node-gyp.js');
  const script = `require('fs').writeFileSync('${this.marker.replace(/\\/g, '\\\\')}', '.');\n` + 
                 `require('child_process').fork('${nodeGypBinary.replace(/\\/g, '\\\\')}', process.argv.slice(1)).on('close', function(code) { process.exit(code); });\n`;
  fs.writeFileSync(this.script, script);
      
}

VerifyNodeGyp.prototype.setOptions = function(options) {
  options.env['npm_config_node_gyp'] = this.script;
}

VerifyNodeGyp.prototype.validate = function() {
  return fs.existsSync(this.marker);
}

module.exports = VerifyNodeGyp;
