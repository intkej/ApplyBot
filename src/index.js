require("dotenv").config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

client.on("messageCreate", async message => {
    if (message.channel.id === process.env.APPLY_CHANNEL) {
    if (!message.content.includes(process.env.APPLY_COMMAND)) {
      await message.author.send("Käytä '!teehakemus' -komentoa tehdäksesi hakemuksen!");
      message.delete();
      return;
    }
      try {
        message.delete();
        const code = Math.floor(Math.random() * 1000000);
        const mention = message.author.toString();
        const application = `Käyttäjän: ${mention} WL-hakemus (koodilla ${code}):\n\n${message.content}`
        const channel = client.channels.cache.get(process.env.APPLY_SEND_TO_CHANNEL);
        channel.send(application);
        const firstMention = message.content.match(/<@!?(\d+)>/);
        if (firstMention) {
          const user = await client.users.fetch(firstMention[1]);
          user.send(process.env.MESSAGE_TO_AUTHOR);
        }
      } catch (error) {
        console.log(error);
        message.author.send(process.env.ERROR_MESSAGE);
      }
    } else if (message.content.startsWith(process.env.ACCEPT_COMMAND)) {
      const code = message.content.split(" ")[1];
      const archiveChannel = client.channels.cache.get(process.env.ARCHIVE_CHANNEL);
      const applySendToChannel = client.channels.cache.get(process.env.APPLY_SEND_TO_CHANNEL);
      const messages = await applySendToChannel.messages.fetch();
      const application = messages.find(m => m.content.includes(`koodilla ${code}`));
      if (!application) {
        await message.reply(process.env.NO_APPLICATION);
        return;
      }
      const userMention = application.content.match(/<@!?(\d+)>/)[0];
      const user = await client.users.fetch(userMention.slice(2, -1));
      const member = await message.guild.members.fetch(user);
      await member.roles.add(process.env.ROLE_ADD_TO_ACCEPTED_USERS);
      await message.delete();
      await application.delete();
      user.send('Whitelist hakemuksesi **palvelin** hyväksytty!')
      const archivedMessage = await archiveChannel.send(`**HAKEMUSARKISTO** (hyväksytty)\n\n${application.content}`);
      await archivedMessage.react('✅');
    } else if (message.content.startsWith(process.env.DECLINE_COMMAND)) {
        const code = message.content.split(" ")[1];
        const archiveChannel = client.channels.cache.get(process.env.ARCHIVE_CHANNEL);
        const applySendToChannel = client.channels.cache.get(process.env.APPLY_SEND_TO_CHANNEL);
        const messages = await applySendToChannel.messages.fetch();
        const application = messages.find(m => m.content.includes(`koodilla ${code}`));
        if (!application) {
                await message.reply(process.env.NO_APPLICATION);
          return;
        }
        const userMention = application.content.match(/<@!?(\d+)>/)[0];
        const user = await client.users.fetch(userMention.slice(2, -1));
        await message.delete();
        await application.delete();
        user.send('Whitelist hakemuksesi **palvelin** hylätty!')
        const archivedMessage = await archiveChannel.send(`**HAKEMUSARKISTO** (hylätty)\n\n${application.content}`);
        await archivedMessage.react('❌');
      }
});

client.login(process.env.TOKEN)
