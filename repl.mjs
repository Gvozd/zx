import {start as replStart} from 'repl'
import {promisify} from 'util'
import {Duplex} from 'stream'
import {join} from 'path'
import {homedir} from 'os'

const useGlobal = true
const {eval: _eval, _domain} = getDonorReplServer()
const promisifiedEval = promisify(_eval)

const replServer = replStart({
  prompt: '$ ',
  eval: myEval,
  useGlobal,
})
_domain.on('error', (error) => {
  replServer._domain.emit('error', error)
})

await promisify(replServer.setupHistory)
  .call(replServer, join(homedir(), '.zx_history'))

async function myEval(cmd, context, filename, callback) {
  try {
    const result = await new Promise(function executor(resolve, reject) {
      _eval.call(this, cmd, context, filename, function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
    })

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
