const AWS = require('aws-sdk');
const Discord = require('discord.js');

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
});

module.exports = (client) => {
    client.addChannel = async (guildName, guildId, channelId) => {
        return new Promise((resolve, reject) => {
            if (!guildName || !guildId || !channelId) {
                reject(new Error('Missing required parameters: guildName, guildId, or channelId'));
                return;
            }

            const params = {
                TableName: 'truth-discord-info',
                Item: {
                    id: guildId,
                    name: guildName,
                    channelId: channelId,
                }
            };
            
            const docClient = new AWS.DynamoDB.DocumentClient();

            docClient.put(params, (error) => {
                if (!error) {
                    console.log(`Server: '${guildName}' has been added to the database`);
                    resolve(`Server: '${guildName}' has been successfully added to the database`);
                } else {
                    console.error(`Error adding server '${guildName}' to the database:`, error);
                    reject(new Error(`Unable to save record for server '${guildName}'. Error: ${error.message}`));
                }
            });
        });
    };
};