const Discord = require('discord.js')
require('../../functions/discord_messages/createBlurb')

module.exports = {
    data: new Discord.SlashCommandBuilder().setName('displayblurb').setDescription("Display all the current day's fun national celebrations"),

    async execute(interaction, client) {

        const message = client.createBlurb()

        await interaction.reply({
            content: message
        })
    }
}

