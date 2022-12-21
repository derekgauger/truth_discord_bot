const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js')
require('../../functions/discord_messages/createInfo')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Sends a link to bot information")
        .setDescriptionLocalizations({
            de: 'Sendet einen link zu Bot Informationen',
        }),

    async execute(interaction, client) {

        let embed = await client.createInfo()
        console.log(`'${interaction.user.username}' used /info in '${interaction.guild.name}'`)

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Vote for Truth")
              .setStyle(5)
              .setEmoji('🔮')
              .setURL('https://top.gg/bot/929121472138604614/vote'),
          );

        await interaction.reply({
            embeds: [embed],
            components: [button]
        }).catch(err => console.log(err))
    }
}
