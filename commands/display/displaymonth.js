const Discord = require('discord.js')
const fs = require('fs')
require('../../functions/discord_messages/createMonth')

module.exports = {
    data: new Discord.SlashCommandBuilder().setName('displaymonth').setDescription("Display all the current month's fun national celebrations"),

    async execute(interaction, client) {
        
        let embed = await client.createMonth()
        interaction.channel.send({embeds: [embed]})
        console.log(`'${interaction.user.username}' used /displaymonth in '${interaction.guild.name}'`)

        await interaction.reply({
            content: "Hope you have a nice month!"
        })
    }
}

