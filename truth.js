import DiscordJS, { Intents } from 'discord.js'
import dotenv from 'dotenv'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require('dotenv').config();
import nationalDays from "./national_days.json" assert { type: "json" }
const nationalMonths = require("./national_months.json");

const cron = require('node-cron')
let fs = require('fs')

import servers from "./channels.json" assert { type: "json" }

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

    const dayJob = cron.schedule("0 1 0 * * *", function () {
        display_days()
    });

    const monthJob = cron.schedule("0 1 0 1 * *", function () {
        display_months()
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

    if (command == 'displayday') {
        let channelId = servers[message.guild.id]
        if (channelId == undefined) {
            message.channel.send("You must set the display channel using '$setchannel' before using that command.")
            return
        }
        
        let channel = client.guilds.cache.get(message.guild.id).channels.cache.get(channelId)

        display_days_in_channel(channel)
    }

    if (command == 'displaymonth') {
        let channelId = servers[message.guild.id]
        if (channelId == undefined) {
            message.channel.send("You must set the display channel using '$setchannel' before using that command.")
            return
        }
        
        let channel = client.guilds.cache.get(message.guild.id).channels.cache.get(channelId)

        display_months_in_channel(channel)
    }

    if (command == 'help') {
        message.channel.send("Go to 'https://github.com/derekgauger/truth_discord_bot' to learn more about this discord bot")
    }
})


function display_days() {
    for (let server in servers) {

        try {
            let channelId = servers[server]

            let channel = client.guilds.cache.get(server).channels.cache.get(channelId)
            
            display_days_in_channel(channel)
    
        } catch(err)  {
            print(err)
        }
    }
}


function display_months() {
    for (let server in servers) {

        try {
            let channelId = servers[server]

            let channel = client.guilds.cache.get(server).channels.cache.get(channelId)
            
            display_months_in_channel(channel)
    
        } catch(err)  {
            print(err)
        }
    }
}


function getDateString(today) {

    const dd = String(today.getDate()).padStart(2, '0')
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const yyyy = today.getFullYear()

    const date = mm + '/' + dd + '/' + yyyy

    return date;
}


function display_days_in_channel(channel) {

    const today = new Date()

    let date = getDateString(today)

    const month = today.toLocaleString('default', { month: 'long' })
    const day = today.getDate()

    var days = nationalDays[month][day]
    var text = ""

    days.forEach(day => {
        text += "\n - " + day
    })

    const embed = {
        color: 0xFF0000,
        title: 'National Days',
        url: 'https://nationaldaycalendar.com/',
        author: {
            name: 'Truth - ' + date,
            icon_url: "https://i.imgur.com/1wyNxV5.jpg",
            url: 'https://nationaldaycalendar.com/',
        },
        thumbnail: {
            url: "https://i.imgur.com/1wyNxV5.jpg",
        },
        fields: [
            {
                name: 'Current National Days',
                value: text,
            },
        ],
        timestamp: today,
        footer: {
            text: 'Truth by Dirk',
            icon_url: "https://i.imgur.com/1wyNxV5.jpg",
        },
    };

    channel.send({ embeds: [embed] });

}


function display_months_in_channel(channel) {

    const today = new Date()

    const month = today.toLocaleString('default', { month: 'long' })

    var months = nationalMonths[month]
    var text = ""

    months.forEach(month => {
        text += "\n - " + month
    })

    const embed = {
        color: 0xFF0000,
        title: 'National Months',
        url: 'https://nationaldaycalendar.com/',
        author: {
            name: 'Truth - ' + month,
            icon_url: "https://i.imgur.com/1wyNxV5.jpg",
            url: 'https://nationaldaycalendar.com/',
        },
        thumbnail: {
            url: "https://i.imgur.com/1wyNxV5.jpg",
        },
        fields: [
            {
                name: 'Current National Months',
                value: text,
            },
        ],
        timestamp: today,
        footer: {
            text: 'Truth by Dirk',
            icon_url: "https://i.imgur.com/1wyNxV5.jpg",
        },
    };

    channel.send({ embeds: [embed] });
}


function print(value) {
    console.log(value)
}


client.login(process.env.token).then(() => {
    client.user.setActivity("Straight Facts", {
        type: "LISTENING"
    })
})
