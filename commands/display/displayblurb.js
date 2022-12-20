const { SlashCommandBuilder } = require('discord.js')
require('../../functions/discord_messages/createBlurb')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('displayblurb')
        .setDescription("Display all the current day's fun national celebrations")
        .setDescriptionLocalizations({
            de: 'Zeigt alle aktuellen nationalen Feiertage an',
        }),

    async execute(interaction, client) {

        const message = client.createBlurb()
        console.log(`'${interaction.user.username}' used /displayblurb in '${interaction.guild.name}'`)

        await interaction.reply({
            content: message
        }).catch(err => console.log(err))
    }
}

