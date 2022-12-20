const { SlashCommandBuilder } = require('discord.js')
const fs = require('fs')
require('../../functions/discord_messages/createMonth')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('displaymonth')
        .setDescription("Display all the current month's fun national celebrations")
        .setDescriptionLocalizations({
            de: 'Zeigt alle nationalen Feiertage des aktuellen Monats an',
        }),

    async execute(interaction, client) {

        let embed = await client.createMonth()
        console.log(`'${interaction.user.username}' used /displaymonth in '${interaction.guild.name}'`)

        await interaction.reply({
            content: "Hope you have a nice month!",
            embeds: [embed]
        }).catch(err => console.log(err))
    }
}

