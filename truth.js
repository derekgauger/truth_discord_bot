import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'

dotenv.config()
const prefix = '$'

const client = new DiscordJS.Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_PRESENCES,
    ]
})

client.on('ready', () => {
    console.log("The Truth will be told...")
})

client.on('messageCreate', (message) => {
    if (!message.content.startsWith(prefix)) {
        return
    }
    let command = message.content.split(" ")[0].toLowerCase()
    command = command.slice(prefix.length)

    

})

client.login(process.env.TOKEN)


