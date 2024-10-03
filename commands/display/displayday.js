const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
require('../../functions/discord_messages/createDay');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('displayday')
        .setDescription("Display all the current day's fun national celebrations")
        .setDMPermission(true)
        .setDescriptionLocalizations({
            de: 'Zeigt alle aktuellen lustigen nationalen Feiertage an',
        }),

    async execute(interaction, client) {
        let interactionHandled = false;

        try {
            if (!client.createDay) {
                throw new Error('createDay function is not defined on the client');
            }

            console.log(`'${interaction.user.username}' used /displayday in '${interaction.guild ? interaction.guild.name : 'DM'}'`);

            await interaction.deferReply();
            interactionHandled = true;

            let embed;
            try {
                embed = await client.createDay();
                if (!embed || !(embed instanceof EmbedBuilder)) {
                    throw new Error('Invalid embed returned');
                }
            } catch (embedError) {
                console.error('Error creating day embed:', embedError);
                embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Failed to create day information. Please try again later.');
            }

            // Edit the deferred reply with the embed
            await interaction.editReply({
                content: "Enjoy your day!",
                embeds: [embed]
            });

        } catch (error) {
            console.error('Error in displayday command:', error);

            const errorMessage = 'An error occurred while processing your request. Please try again later.';

            if (!interactionHandled) {
                try {
                    await interaction.reply({ content: errorMessage, ephemeral: true });
                } catch (replyError) {
                    console.error('Failed to send error message:', replyError);
                    // If we can't reply, try to send a follow-up
                    try {
                        await interaction.followUp({ content: errorMessage, ephemeral: true });
                    } catch (followUpError) {
                        console.error('Failed to send follow-up error message:', followUpError);
                    }
                }
            } else {
                try {
                    await interaction.editReply({ content: errorMessage });
                } catch (editReplyError) {
                    console.error('Failed to edit reply with error message:', editReplyError);
                }
            }
        }
    }
};