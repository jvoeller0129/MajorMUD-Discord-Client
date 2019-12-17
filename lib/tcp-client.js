class TCP {
  constructor (options) {
    this.opts = options
    this.socket = require('net')

    this.waiting = false
    this.queue = []
  }

  async connect () {
    this.connection = this.socket.connect({
      host: this.opts.host,
      port: this.opts.port
    })

    this.connection.on('close', () => {
      console.error('MajorMUD Disconnected User: Fatal Invoke')
      // eslint-disable-next-line no-process-exit, unicorn/no-process-exit
      process.exit(1)
    })

    this.connection.on('connect', async () => {
      console.info('[SYN] Server Ack Connection Request')
      this.connection.write(Buffer.from([255, 251, 3, 255, 252, 1, 255, 253, 3, 255, 253, 0]))
      console.info('[SYN] Server Recv Handshake Bytes')

      // eslint-disable-next-line unicorn/consistent-function-scoping
      const authentication = (data) => {
        if (data.toString('utf8').includes('new')) return this.connection.write(`${this.opts.username}\r`)
        if (data.toString('utf8').includes('password')) return this.connection.write(`${this.opts.password}\r`)
        if (data.toString('utf8').includes('(C)ontinue')) return this.connection.write('C\r')
        if (data.toString('utf8').includes('exit):')) return this.connection.write('M\r=A\r')
        if (data.toString('utf8').includes('Realm')) return this.connection.write('E\r')
      }
      this.connection.on('data', authentication)

      await this.wait(5)
      return setInterval(this.process, 100, this)
    })
  }

  process (reference) {
    if (reference.waiting) return
    if (reference.queue.length === 0) return

    reference.waiting = true
    const query = reference.queue.shift()
    let buf = ''

    const querier = (data) => {
      buf = buf + data.toString('utf8')
    }

    reference.connection.on('data', querier)
    reference.connection.write(`${query.request}\r`)

    setTimeout((reference2) => {
      reference2.connection.removeListener('data', querier)
      reference2.waiting = false
      const pure = []
      const resp = buf.replace(/[^\u0020-\u007E]+/, '').split('\r\n')
      for (const l in resp) {
        // eslint-disable-next-line security/detect-object-injection
        if (resp[l].includes('telepaths:') && resp[l].includes('{') && resp[l].includes('}')) {
          pure.push(require('strip-ansi')(resp[l].split('telepaths:')[1].trim()).replace('\b \b \b \b', ''))
        }
      }

      return query.resolve({ original: query, responses: pure })
    }, 2000, reference)
  }

  /**
   * Queues Request for MajorMUD Bot
   *
   * @param {string} command server valid command in `/{user} @{query} {params...}` format
   * @returns {Promise} pending resolution of queue position
   * @memberof TCP
   */
  request (command) {
    return new Promise((resolve) => {
      this.queue.push({ request: command, resolve })
    })
  }

  /**
   * Waits for Timeout to Expire
   *
   * @param {number} seconds number of seconds to wait
   * @returns {Promise} timeout of seconds to wait
   * @memberof TCP
   */
  wait (seconds) {
    return new Promise((resolve) => {
      setTimeout(resolve, seconds * 1000)
    })
  }
}

module.exports = TCP
