// node modules
var path = require('path');

// npm modules
var stripAnsi = require('strip-ansi');

// local modules
var createOptions = require('../../create-options');
var spawn = require('../../spawn');

function runTestScript(nodeBin, npmBin, context, testScript, next) {
  var options = createOptions(context.path, context);
  var lookupPath = process.cwd();
  if (typeof context.options.lookup === 'string') {
    lookupPath = path.dirname(path.resolve(process.cwd(), context.options.lookup));
  }
  var _path = path.resolve(lookupPath, testScript);
  console.log(_path);
  var proc = spawn(_path, [nodeBin, npmBin], options);
  proc.stdout.on('data', function (data) {
    if (context.module.stripAnsi) {
      data = stripAnsi(data.toString());
      data = data.replace(/\r/g, '\n');
    }
    context.testOutput += data;
    context.emit('data', 'verbose', 'npm-test:', data.toString());
  });
  proc.stderr.on('data', function (data) {
    context.testError += data;
    context.emit('data', 'verbose', 'npm-error:', data.toString());
  });
  proc.on('error', function(err) {
    next(err);
  });
  proc.on('close', function(code) {
    if (code > 0) {
      return next(Error('The canary is dead.'));
    }
    context.emit('data', 'verbose','script-end', _path);
    return next(null, context);
  });
}

module.exports = runTestScript;
