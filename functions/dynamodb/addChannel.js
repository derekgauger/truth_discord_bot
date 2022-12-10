const AWS = require('aws-sdk');
const Discord = require('discord.js')

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
})

module.exports = (client) => {
    client.addChannel = async (guildName, guildId, channelId) => {

        const params = {
            TableName: 'truth-discord-info',
            Item: {
                id: guildId,
                name: guildName,
                channelId: channelId,
            }
        }
        
        const docClient = new AWS.DynamoDB.DocumentClient();

        docClient.put(params, (error) => {
            if (!error) {
                console.log(`Server: ${guildName} - Has been added to the list`)
            } else {
                throw "Unable to save record, err: " + error
            }
        })

    }
}

