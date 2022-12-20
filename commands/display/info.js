const { SlashCommandBuilder } = require('discord.js')
require('../../functions/discord_messages/createInfo')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Sends a link to bot information")
        .setDescriptionLocalizations({
            de: 'Sendet einen Link zu Bot-Informationen',
        }),

    async execute(interaction, client) {

        let embed = await client.createInfo()
        console.log(`'${interaction.user.username}' used /info in '${interaction.guild.name}'`)

        await interaction.reply({
            embeds: [embed]
        }).catch(err => console.log(err))
    }
}
