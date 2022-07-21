import  { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js'
require('dotenv').config()
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const data = require("./holidays.json");
const cron = require('node-cron')
let message_channel = null

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
const prefix = '$'

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.Guild_Messages,
        GatewayIntentBits.Guild_Members,
        GatewayIntentBits.Guild_Presences,
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
        message_channel = message.channel
        message_channel.send("Display Message Channel Set")
    }

    if (command == 'display') {
        display_holidays()
    }
})


function display_holidays() {

    const today = new Date()

    if (message_channel == null) {
        console.log("Invalid Channel: Must $setchannel before")
        return
    }

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
        color: 'Red',
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

    message_channel.send({ embeds: [embed] });

}

client.login(process.env.TOKEN)


