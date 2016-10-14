// node modules
const path = require('path');
const spawn = require('child_process').spawn;

// npm modules
const stripAnsi = require('strip-ansi');

// local modules
const createOptions = require('../../create-options');

function runTestCommand(nodeBin, npmBin, context, command, type, next) {
  const workDir = path.join(context.path, context.module.name);  
  const options = createOptions(workDir, context);
  if (context.options.testPath) {
    options.env.PATH = context.options.testPath + ':' + process.env.PATH;
  }
  let lookupPath = process.cwd();
  if (typeof context.options.lookup === 'string') {
    lookupPath = path.dirname(path.resolve(process.cwd(), context.options.lookup));
  }

  let proc;
  if (type === 'shell') {
    options.shell = true;
    proc = spawn(command, [], options); 
  } else if (type === 'script') {
    const scriptFilename = path.join(lookupPath, command);
    options.shell = true;
    proc = spawn(command, [nodeBin, npmBin], options);
  } else {
    return next(Error(`Unknow command type '${type}'`));
  }

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
    context.emit('data', 'verbose','script-end', command);
    return next(null, context);
  });
}

module.exports = runTestCommand;
