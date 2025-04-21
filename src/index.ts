import dotenv from 'dotenv'
dotenv.config()

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

import { Events, GatewayIntentBits } from 'discord.js'
import winston from 'winston'

import { isCommand, MyClient } from './types/myclient.js'

// Create a new client instance

const client = new MyClient({ intents: [GatewayIntentBits.Guilds] })

// import commands
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandFolder = path.join(__dirname, 'commands')

for (const file of fs.readdirSync(commandFolder, { withFileTypes: true, recursive: true })) {
	if (file.isFile() && file.name.endsWith('.ts')) {
		console.log(file)
		const filePath = path.join(file.parentPath, file.name)
		const command = await import(filePath)
		if (isCommand(command)) {
			client.commands.set(command.data.name, command)
		}
		else {
			winston.warn(`The command at ${filePath} is not a suitable command.`)
		}
	}
}

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.s
client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`)
})

client.on(Events.InteractionCreate, (interaction) => {
	if (!interaction.isChatInputCommand()) return
	console.log(interaction.client.commands)

	const command = interaction.client
})

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN)
