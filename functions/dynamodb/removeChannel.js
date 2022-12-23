const AWS = require('aws-sdk');
const Discord = require('discord.js')

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
})

module.exports = (client) => {
    client.removeChannel = async (guildId, guildName) => {

        const params = {
            Key: {
                id: `${guildId}`
            },
            TableName: 'truth-discord-info'
        }
        
        const docClient = new AWS.DynamoDB.DocumentClient();

        await docClient.delete(params, (error) => {
            if (!error) {
                console.log(`Server: '${guildName}' has been removed from the database`)
            } else {
                throw "Unable to delete the record, err: " + error
            }
        })
    }
}
