const { SlashCommandBuilder } = require('discord.js')
const fs = require('fs')
require('../../functions/discord_messages/createDay')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('displayday')
        .setDescription("Display all the current day's fun national celebrations")
        .setDescriptionLocalizations({
            de: 'Zeigt alle aktuellen lustigen nationalen Feiertage an',
        }),

    async execute(interaction, client) {

        let embed = await client.createDay()
        console.log(`'${interaction.user.username}' used /displayday in '${interaction.guild.name}'`)

        await interaction.reply({
            content: "Enjoy your day!",
            embeds: [embed]
        }).catch(err => console.log(err))
    }
}