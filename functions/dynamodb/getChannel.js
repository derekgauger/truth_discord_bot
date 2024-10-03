const AWS = require('aws-sdk');
const Discord = require('discord.js');

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
});

module.exports = (client) => {
    client.getChannel = async (guildId) => {
        if (!guildId) {
            throw new Error('Missing required parameter: guildId');
        }

        const params = {
            Key: {
                id: `${guildId}`
            },
            TableName: 'truth-discord-info'
        };
        
        const docClient = new AWS.DynamoDB.DocumentClient();

        try {
            const result = await docClient.get(params).promise();
            
            if (result.Item !== undefined && result.Item !== null) {
                console.log(`Channel found for guild ID: ${guildId}`);
                return true;
            } else {
                console.log(`No channel found for guild ID: ${guildId}`);
                return false;
            }
        } catch (error) {
            console.error(`Error checking channel for guild ID ${guildId}:`, error);
            throw new Error(`Failed to check channel existence: ${error.message}`);
        }
    };
};