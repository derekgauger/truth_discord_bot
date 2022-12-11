const Discord = require('discord.js')
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
require('dotenv').config();
const AWS = require('aws-sdk')

const cron = require('node-cron')
const fs = require('fs')

require("./functions/automation/day_automation")
require("./functions/automation/month_automation")
require("./functions/automation/blurb_automation")

const nationalMonths = require("./national_months.json");
const nationalDays = require("./national_days.json");

const token = process.env.token
const bot_id = process.env.bot_id 

const client = new Discord.Client({
    intents: Discord.GatewayIntentBits.Guilds
});

client.commands = new Discord.Collection()
client.commandArray = []

const functionFolders = fs.readdirSync('./functions')
for (const folder of functionFolders) {
    const functionFiles = fs.readdirSync(`./functions/${folder}`).filter((f) => f.endsWith('.js'));

    for (const file of functionFiles) {
        require(`./functions/${folder}/${file}`)(client)
    }
}

client.handleEvents()
client.login(token).then(() => {
    client.user.setPresence({
        activities: [{ name: `Straight Facts`, type: Discord.ActivityType.Listening }],
        status: 'Online',
      })
})

client.handleCommands()

var guild_id_list = []
client.once('ready', () => {
    guild_id_list = client.guilds.cache.map(guild => guild.id)
    guild_id_list.forEach((guildId) => {
        console.log(client.guilds.cache.get(guildId).name + " : " + guildId)
    })
    
    console.log("The Truth will be told...")

    const dayJob = cron.schedule("0 1 6 * * *", function () {
        client.displayDays()
        client.displayBlurb()
    });

    const monthJob = cron.schedule("0 1 6 1 * *", function () {
        client.displayMonths()
    });
    const rest = new REST({ version: "9" }).setToken(process.env.token);
    try {
        guild_id_list.forEach((guildId) => {
            rest.put(Routes.applicationGuildCommands(bot_id, guildId), {
                body: client.commandArray,
            });
        });
    } catch (e) {
        console.error(e);
    }
})