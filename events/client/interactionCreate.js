module.exports = (client, interaction) => {
  if (!interaction.guild) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        command.execute(interaction, client);
      } catch (err) {
        if (err) console.error(err);
        interaction.reply({
          content: "An error occurred while trying to execute that command.",
          ephemeral: true,
        });
      }
    };
  } else {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        command.execute(interaction, client);
      } catch (err) {
        if (err) console.error(err);
        interaction.reply({
          content: "An error occurred while trying to execute that command.",
          ephemeral: true,
        });
      }
  };
  