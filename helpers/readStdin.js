/**
 * Reads stdin as a string
 * 
 * @returns {Promise<string>}
 */
module.exports = async function readStdin() {
  if (process.stdin.isTTY) {
    return null;
  }
  
  let stdinStr = '';
  for await (const chunk of process.stdin) {
    stdinStr += chunk;
  }
  
  return stdinStr;
};