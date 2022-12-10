const fs = require('fs')

module.exports = (client) => {
    client.handleCommands = async () => {
        const commandFolders = fs.readdirSync("./commands")

        for (const folder of commandFolders) {
            const commandFiles = fs.readdirSync(`./commands/${folder}`).filter((file) => file.endsWith(".js"))

            for (const file of commandFiles) {
                const command = require(`../../commands/${folder}/${file}`)

                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON())
                console.log("Command Registered: " + command.data.name)
            }
        }
    }
}