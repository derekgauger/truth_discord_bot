module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
      if (!interaction.isCommand()) return;
  
      const { commandName } = interaction;
      const command = client.commands.get(commandName);
  
      if (!command) {
        console.error(`No command matching ${commandName} was found.`);
        await interaction.reply({ content: 'An error occurred while processing this command.', ephemeral: true });
        return;
      }
  
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error executing ${commandName} command:`, error);
  
        const errorMessage = 'There was an error while executing this command!';
  
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(console.error);
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true }).catch(console.error);
        }
      }
    }
  };