const {SlashCommandBuilder, REST, Routes, PermissionFlagsBits} = require("discord.js")

const commands = [
    new SlashCommandBuilder()
        .setName('티켓')
        .setDescription('티켓 설정을 시작합니다.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(command => command.toJSON());

module.exports = {
    registerCommands : (token, clientId, guildId) => {
        const rest = new REST({version: '10'}).setToken(token);
    
        rest.put(Routes.applicationGuildCommands(clientId, guildId), {body: commands})
            .then(() => console.log('Successfully registered application commands.'))
            .catch(console.error);
    }
}