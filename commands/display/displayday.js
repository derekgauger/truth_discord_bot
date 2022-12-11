const Discord = require('discord.js')
const fs = require('fs')
require('../../functions/discord_messages/createDay')

module.exports = {
    data: new Discord.SlashCommandBuilder().setName('displayday').setDescription("Display all the current day's fun national celebrations"),

    async execute(interaction, client) {
        
        let embed = await client.createDay()
        interaction.channel.send({embeds: [embed]})
        console.log(`'${interaction.user.username}' used /displayday in '${interaction.guild.name}'`)

        await interaction.reply({
            content: "Enjoy your day!"
        })
    }
}