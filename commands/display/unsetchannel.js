const { SlashCommandBuilder, PermissionFlagsBits, BaseGuildTextChannel, } = require('discord.js')
require('../../functions/firestore/removeChannel')
require('../../functions/firestore/getChannel')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unsetchannel')
        .setDescription("Unsets the display channel for automated messages")
        .setDMPermission(false)
        .setDescriptionLocalizations({
            de: 'Deaktiviert den Anzeigekanal für die automatischen Nachrichten',
        }),

    async execute(interaction, client) {
        const name = interaction.guild.name
        const id = interaction.guild.id
        const channel_id = interaction.channel.id

        console.log(`'${interaction.user.username}' used /unsetchannel in '${name}'`)

        let reply = ""

        try {
            if (interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
                let channel = await client.getChannel(id)

                if (channel === true) {
                    await client.removeChannel(id, name)
                    reply = "Removed automated messages from this channel!"

                } else {
                    reply = "Your server is currently not setup to receive automated messages!"

                }

            } else {
                reply = "You do not have permission to use this command. You need the **'Manage Server'** permission to proceed."
                
            }

        } catch (error) {
            reply = "There was an error :( - Contact: Dirk#8540"
            console.log(error)
        }

        await interaction.reply({
            content: reply
        }).catch(err => console.log(err))
    }
}
