module.exports = function cliWrapper(usageExampleStr, buildObjFunc) {
  (async function run() {
    // parse args
    const prettyPrint = process.argv.find(arg => /-?-min/i.test(arg));
    
    // read from stdin
    console.error('Reading from stdin...');
    const stdinData = await readStdin();
    
    if (!stdinData) {
      console.error('Nothing piped to stdin.');
      console.error(`Usage:\n${usageExampleStr}`);
      process.exit(1);
    }
    
    const obj = buildObjFunc(stdinData, prettyPrint);
    if (obj) {
      console.log(JSON.stringify(obj, null, prettyPrint? '  ' : null));
    }
  })()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
};

async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  
  let stdinData = '';
  for await (const chunk of process.stdin) {
    stdinData += chunk;
  }
  
  return stdinData;
}