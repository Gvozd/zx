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
    this.push(line)
  }
}
