import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
import { GOOGLE_IMG_SCRAP , GOOGLE_QUERY } from 'google-img-scrap'
import Jimp from 'jimp'

(async function(){
    const test = await GOOGLE_IMG_SCRAP({
        search: "nature",
        execute: function(element){
            if(!element.url.match('gstatic.com')) return element;
        }
    });
    let images = test.result
    console.log(images)
})();

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


