const AWS = require('aws-sdk');
const Discord = require('discord.js');
const createDay = require('../discord_messages/createDay');

require('dotenv').config();

AWS.config.update({
    region: "us-east-2",
    accessKeyId: process.env.db_key_id,
    secretAccessKey: process.env.db_secret_access_key,
});

module.exports = (client) => {
    client.displayDays = async () => {
        try {
            const guild_id_list = client.guilds.cache.map(guild => guild.id);
            const docClient = new AWS.DynamoDB.DocumentClient();

            const promises = guild_id_list.map(async (guildId) => {
                const params = {
                    TableName: 'truth-discord-info',
                    Key: {
                        id: guildId
                    }
                };

                try {
                    const data = await docClient.get(params).promise();
                    if (data.Item !== undefined) {
                        const channel_id = data.Item.channelId;
                        const channel = client.channels.cache.get(channel_id);

                        if (!channel) {
                            console.error(`Channel not found for guild ${guildId}`);
                            return;
                        }

                        const embed = await client.createDay();
                        if (!embed) {
                            console.error(`Failed to create embed for guild ${guildId}`);
                            return;
                        }

                        await channel.send({embeds: [embed]});
                    }
                } catch (err) {
                    console.error(`Error processing guild ${guildId}:`, err);
                }
            });

            await Promise.all(promises);
        } catch (err) {
            console.error('Error in displayDays:', err);
        }
    };

    // Assign createDay to client
    client.createDay = createDay;
};