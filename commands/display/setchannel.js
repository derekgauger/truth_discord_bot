const { SlashCommandBuilder, PermissionFlagsBits, } = require('discord.js')
require('../../functions/dynamodb/addChannel')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription("Set the display channel for the automated messages")
        .setDescriptionLocalizations({
            de: 'Setzt den Kanal für die automatischen Nachrichten',
        }),

    async execute(interaction, client) {
        const name = interaction.guild.name
        const id = interaction.guild.id
        const channel_id = interaction.channel.id

        console.log(`'${interaction.user.username}' used /setchannel in '${name}'`)

        let reply = ""
        try {
            if (
                interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)
              ) {
            client.addChannel(name, id, channel_id)
            reply = "This channel has been successfully set to receive automated messages. Use /displayday, /displayblurb, and /displaymonth"
            } else {
            reply = "You do not have permission to use this command. You need the **'Manage Server'** permission to proceed."
            }
        } catch (error) {
            reply = "There was an error :( - Contact: Dirk#8540"
        }

        await interaction.reply({
            content: reply
        }).catch(err => console.log(err))
    }
}
