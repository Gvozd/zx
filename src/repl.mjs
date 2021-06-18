import {start as replStart} from 'repl'
import {promisify} from 'util'
import {Duplex} from 'stream'
import {join} from 'path'
import {homedir} from 'os'
import {processTopLevelAwait} from 'node-repl-await'
import SplittedReadable from './SplittedReadable.mjs'

const useGlobal = true
const {eval: _eval, _domain} = getDonorReplServer()

const replServer = replStart({
  prompt: '$ ',
  input: new SplittedReadable(),
  output: process.stdout,
  eval: myEval,
  useGlobal,
})
_domain.on('error', (error) => {
  replServer._domain.emit('error', error)
})

await promisify(replServer.setupHistory)
  .call(replServer, join(homedir(), '.zx_history'))

async function myEval(cmd, context, filename, callback) {
  replServer.pause()
  try {
    const results = await new Promise(function executor(resolve) {
      const command = processTopLevelAwait(cmd) || cmd
      _eval.call(this, command, context, filename, function (...results) {
        resolve(Promise.all(results))
      })
    })
    if (results[0]) {
      throw results[0]
    }

    callback(...results)
  } catch (e) {
    callback(e)
  } finally {
    replServer.resume()
  }
}

function getDonorReplServer() {
  const socket = Object.assign(new Duplex(), {
    _write: noop,
    _read: noop,
  })
  const replServer = replStart({
    input: socket,
    output: socket,
    useGlobal,
  })
  replServer.eval.domain.removeAllListeners('error')
  replServer.close()

  return replServer
}

function noop() {
}
