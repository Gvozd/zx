import {Readable} from 'stream'

export default class SplittedReadable extends Readable {
  constructor() {
    super()
    process.stdin.on('data', this.onLine)
    process.stdin.on('end', () => {
      this.emit('end')
    })
  }

  _read() {
  }

  setRawMode(mode) {
    if (process.stdin.setRawMode)
      process.stdin.setRawMode(mode)
    return this
  }

  pause() {
    process.stdin.pause()
    return super.pause()
  }

  resume() {
    process.stdin.resume()
    return super.resume()
  }

  onLine = (line) => {
    while (true) {
      const idx = line.indexOf('\n', 0, 'utf8')
      if (idx === -1) {
        this.push(line)
        break
      } else {
        this.push(line.slice(0, idx))
        this.push(line.slice(idx, idx + 1))
        line = line.slice(idx + 1)
      }
    }
  }
}
