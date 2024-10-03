const { SlashCommandBuilder } = require('discord.js');
require('../../functions/discord_messages/createBlurb');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('displayblurb')
        .setDescription("Display all the current day's fun national celebrations")
        .setDMPermission(true)
        .setDescriptionLocalizations({
            de: 'Zeigt alle aktuellen nationalen Feiertage an',
        }),

    async execute(interaction, client) {
        try {
            if (!client.createBlurb) {
                throw new Error('createBlurb function is not defined on the client');
            }

            const message = client.createBlurb();
            
            if (!message) {
                throw new Error('Failed to create blurb message');
            }

            console.log(`'${interaction.user.username}' used /displayblurb in '${interaction.guild ? interaction.guild.name : 'DM'}'`);

            await interaction.deferReply();

            await interaction.editReply({
                content: message
            });

        } catch (error) {
            console.error('Error in displayblurb command:', error);

            const errorMessage = 'An error occurred while displaying the blurb. Please try again later.';

            if (error.code === 10062) {
                try {
                    await interaction.followUp({
                        content: 'The blurb took too long to generate. Here it is:',
                        ephemeral: true
                    });
                    await interaction.followUp({
                        content: client.createBlurb(),
                        ephemeral: true
                    });
                } catch (followUpError) {
                    console.error('Error sending follow-up message:', followUpError);
                }
            } else {
                try {
                    if (interaction.deferred) {
                        await interaction.editReply({ content: errorMessage });
                    } else {
                        await interaction.reply({ content: errorMessage, ephemeral: true });
                    }
                } catch (replyError) {
                    console.error('Error sending error message:', replyError);
                }
            }
        }
    }
};