const Discord = require('discord.js')
const TCP = require('./lib/tcp-client')

/**
 * Connects to MajorMUD and Discord API
 */
async function main () {
  this.configuration = require('./config')

  this.MajorMUD = new TCP({
    host: this.configuration.host,
    port: this.configuration.port,
    username: this.configuration.username,
    password: this.configuration.password
  })
  await this.MajorMUD.connect()

  this.client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ['TYPING_START']
  })

  this.client.on('ready', () => {
    console.info('[@] Connected as ' + this.client.user.tag)
  })

  await this.client.login(this.configuration.token).catch((error) => {
    console.error('Failed to Connect:', error.message)
  })

  this.client.on('message', async (message) => {
    if (!message.content || message.content.length === 0) return
    if (message.author.id === this.client.user.id) return

    const parameters = message.content.split(' ')
    const command = parameters.shift()
    const clean = command.slice(2, command.length)

    if (!command.startsWith(this.configuration.prefix)) return
    const target = parameters.shift()
    const response = await this.MajorMUD.request(`/${target} @${clean} ${parameters.join(' ')}`)

    const embed = new Discord.RichEmbed()
    embed.setTitle(`/${target} @${clean}`)
    embed.setDescription('MajorMUD In-Game Query')

    for (let r of response.responses) {
      r = r.split('')
      r.shift()
      r.pop()
      embed.addField('Telepathic Response', r.join(''))
    }

    console.info(`Command Executed: /${target} @${clean} ${parameters.join(' ')}`)
    return message.channel.send(embed).catch((error) => {
      console.error('Failed Embed:', error.message)
    })
  })

  // DEMO COMMANDS
  // console.info(await this.MajorMUD.request('/ashir @version'))
  // console.info(await this.MajorMUD.request('/ashir @health'))
  // console.info(await this.MajorMUD.request('/ashir @exp'))
  // console.info(await this.MajorMUD.request('/ashir @level'))
  // console.info(await this.MajorMUD.request('/ashir @status'))
  // console.info(await this.MajorMUD.request('/ashir @lives'))
  // console.info(await this.MajorMUD.request('/ashir @where'))
  // console.info(await this.MajorMUD.request('/ashir @path'))
  // console.info(await this.MajorMUD.request('/ashir @seen ashir'))
  // console.info(await this.MajorMUD.request('/ashir @who'))
  // console.info(await this.MajorMUD.request('/ashir @what'))
  // console.info(await this.MajorMUD.request('/ashir @wealth'))
  // console.info(await this.MajorMUD.request('/ashir @enc'))
  // console.info(await this.MajorMUD.request('/ashir @have golden sickle'))
  // console.info(await this.MajorMUD.request('/ashir @home mad wizard'))
}
main()
