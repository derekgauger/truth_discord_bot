const Discord = require("discord.js");
require('../../functions/dynamodb/addChannel')
module.exports = {
    data: new Discord.SlashCommandBuilder().setName('setchannel').setDescription("Set the display channel for the automated messages"),
    
    async execute(interaction, client) {
        const name = interaction.guild.name
        const id = interaction.guild.id
        const channel_id = interaction.channel.id

        console.log(`'${interaction.user.username}' used /setchannel in '${name}'`)

        let reply = ""
        try {
            client.addChannel(name, id, channel_id)
            reply = "This channel has been successfully set to receive automated messages. Use /displayday, /displayblurb, and /displaymonth"
        } catch(error) {
            reply = "There was an error :( - Contact: Dirk#8540"
        }

        await interaction.reply({
            content: reply
        })
    }
}