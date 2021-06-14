import {start as replStart} from 'repl'
import {promisify} from 'util'
import {Duplex} from 'stream'
import {join} from 'path'
import {homedir} from 'os'

const useGlobal = true
const {eval: _eval} = getDonorReplServer()
const promisifiedEval = promisify(_eval)

const replServer = replStart({
  prompt: '$ ',
  eval: myEval,
  useGlobal,
})
export const done = new Promise(resolve => {
  replServer.once('exit', resolve)
})

await promisify(replServer.setupHistory)
  .call(replServer, join(homedir(), '.zx_history'))

async function myEval(cmd, context, filename, callback) {
  try {
    const result = await promisifiedEval.call(this, cmd, context, filename)

    callback(null, result)
  } catch (e) {
    callback(e)
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
