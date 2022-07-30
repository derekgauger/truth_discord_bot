import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const data = require("./holidays.json");
const cron = require('node-cron')
let servers = require("./channels.json")
let fs = require('fs')

// Ignore this code for now. It will be used later in the project.

// import { GOOGLE_IMG_SCRAP , GOOGLE_QUERY } from 'google-img-scrap'
// import Jimp from 'jimp'

// (async function(){
//     const test = await GOOGLE_IMG_SCRAP({
//         search: "nature",
//         execute: function(element){
//             if(!element.url.match('gstatic.com')) return element;
//         }
//     });
//     let images = test.result
//     console.log(images)
// })();

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
    const job = cron.schedule("0 1 0 * * *", function () {
        display_holidays()
    });
})

client.on('messageCreate', (message) => {
    if (!message.content.startsWith(prefix)) {
        return
    }

    let command = message.content.split(" ")[0].toLowerCase()
    command = command.slice(prefix.length)
    console.log(message.author.username + " executed the command: '" + command + "'")

    if (command == 'setchannel') {
        servers[message.guild.id] = message.channel.id
        message.channel.send("Display Message Channel Set")
        var json = JSON.stringify(servers)
        fs.writeFile('channels.json', json, 'utf-8', (err) => {
            if (err) throw err
        })
    }

    if (command == 'display') {
        
        display_holidays_in_channel(message.channel)
    }
})


function display_holidays() {
    for (let server in servers) {
        let channelId = servers[server]

        let channel = client.guilds.cache.get(server).channels.cache.get(channelId)
        
        display_holidays_in_channel(channel)

    }
}


function display_holidays_in_channel(channel) {

    const today = new Date()

    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()

    const date = mm + '/' + dd + '/' + yyyy

    const month = today.toLocaleString('default', { month: 'long' })
    const day = today.getDate()

    var holidays = data[month][day]
    var holiday_text = ""

    holidays.forEach(holiday => {
        holiday_text += "\n - " + holiday
    })

    const embed = {
        color: 0xFF0000,
        title: 'National Holidays',
        url: 'https://nationaldaycalendar.com/',
        author: {
            name: 'Truth - ' + date,
            icon_url: 'https://images.albertsons-media.com/is/image/ABS/960131507?$ecom-pdp-desktop$&defaultImage=Not_Available',
            url: 'https://nationaldaycalendar.com/',
        },
        thumbnail: {
            url: 'https://images.albertsons-media.com/is/image/ABS/960131507?$ecom-pdp-desktop$&defaultImage=Not_Available',
        },
        fields: [
            {
                name: 'Current National Holidays',
                value: holiday_text,
            },
        ],
        timestamp: today,
        footer: {
            text: 'Truth by Dirk',
            icon_url: 'https://images.albertsons-media.com/is/image/ABS/960131507?$ecom-pdp-desktop$&defaultImage=Not_Available',
        },
    };

    channel.send({ embeds: [embed] });

}


function print(value) {
    console.log(value)
}

client.login(process.env.TOKEN)


