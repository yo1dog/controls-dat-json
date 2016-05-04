module.exports = function wrapper(usageExampleStr, buildObjFunc) {
  // parse args
  var prettyPrint = true;
  if (process.argv[2]) {
    if (process.argv[2].toLowerCase() === '-min') {
      prettyPrint = false;
    }
    else {
      console.error('Unknown argument "' + process.argv[2] + '".');
      console.error('Usage:\n' + usageExampleStr);
      process.exit(1);
    }
  }
  
  // read from stdin
  readStdin(function(err, stdinData) {
    try {
      if (err) {
        console.error('Error reading from stdin.');
        throw err;
      }
      if (!stdinData) {
        console.error('Nothing piped to stdin.');
        console.error('Usage:\n' + usageExampleStr);
        process.exit(1);
      }
      
      var obj = buildObjFunc(stdinData);
      
      console.log(JSON.stringify(obj, null, prettyPrint? '  ' : null));
    }
    catch(err) {
      console.error(err.stack);
      process.exit(1);
    }
    
    process.exit(0);
  });
};


function readStdin(cb) {
  if (process.stdin.isTTY) {
    process.nextTick(cb);
  }
  
  var stdinData = '';
  
  process.stdin.on('error', cb);
  process.stdin.on('data', function(chunk) {
    stdinData += chunk;
  });
  process.stdin.on('end', function() {
    cb(null, stdinData);
  });
}