import repl from 'repl';
import {promisify} from 'util';
import {Readable, Duplex} from 'stream';
import {join} from 'path';
import {homedir} from 'os';

const {eval: originalEval, _domain} = getDefaultReplServer();
const runBound = promisify(originalEval);
const stdin = new Readable();
stdin.wrap(process.stdin);
// Error.stackTraceLimit = 23;
// Error.stackTraceLimit = 100;
// Error.stackTraceLimit = 0;


const replServer = _domain.run(() => repl.start({
    prompt: '$ ',
    eval: myEval,
    // eval: originalEval,
    // eval: function (cmd, context, filename, callback) {
    //     return (function() {
    //         return originalEval.apply(this, arguments)
    //     })();
    //     // return _domain.run(() => originalEval.apply(this, ...arguments));
    //     // return (() => {
    //     //     return originalEval.apply(this, ...args)
    //     // })();
    // },
    input: stdin,
    output: process.stdout,
    useGlobal: true,
}));

await promisify(replServer.setupHistory)
    .call(replServer, join(homedir(), '.zx_history'));
// TODO patch replServer.context

async function myEval(cmd, context, filename, callback) {
    console.log('>>> ', new Date());
    try {
        // await new Promise(resolve => setTimeout(resolve, 100));
        stdin.pause();
        // const _runBound = replServer._domain.bind(runBound);
        const result = await new Promise(function executor(resolve, reject) {
            // Обычный promisify не подходит, потому что получаются(в выводе) более длинные стеки для СИНХРОННЫХ ошибок
            // это работает из-за дополнительной обертки-функции вокруг промиса
            // оказывается это так работает, из-за того что Promise executor безымянный, а repl ориентируется на это при отсечении стека в domain.on('error')
            originalEval.call(this, cmd, context, filename, (err, res) => {
                if (err) {
                    return reject(err);
                }
                resolve(res);
            })
        });
        callback(null, result);
    } catch(e) {
        e = e.context || e;
        callback(e.context || e);
    } finally {
        stdin.resume();
        console.log('<<< ', new Date());
    }
}



function getDefaultReplServer() {
    const socket = Object.assign(new Duplex(), {
        _write: noop,
        _read: noop,
    });
    const replServer = repl.start({
        input: socket,
        output: socket,
        useGlobal: true,
    });
    replServer.close();

    replServer.eval.domain.removeAllListeners('error');
    return replServer;
}

function noop() {
}
