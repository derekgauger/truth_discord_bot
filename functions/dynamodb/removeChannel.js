const AWS = require('aws-sdk');
const Discord = require('discord.js');

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
});

module.exports = (client) => {
    client.removeChannel = async (guildId, guildName) => {
        if (!guildId || !guildName) {
            throw new Error('Missing required parameters: guildId or guildName');
        }

        const params = {
            Key: {
                id: `${guildId}`
            },
            TableName: 'truth-discord-info'
        };
        
        const docClient = new AWS.DynamoDB.DocumentClient();

        try {
            await docClient.delete(params).promise();
            console.log(`Server: '${guildName}' has been removed from the database`);
            return `Server: '${guildName}' has been successfully removed from the database`;
        } catch (error) {
            console.error(`Error removing server '${guildName}' from the database:`, error);
            throw new Error(`Unable to delete the record for server '${guildName}'. Error: ${error.message}`);
        }
    };
};