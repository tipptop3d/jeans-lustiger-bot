import dotenv from 'dotenv'
dotenv.config()

import fs from 'node:fs'
import path from 'node:path'
import readline from 'readline'
import { Key } from 'node:readline'
import { DatabaseSync } from 'node:sqlite'

import { Client, Collection, Events, GatewayIntentBits, MessageFlags } from 'discord.js'
import logger from '@utils/logging.js'
import { Command, isCommand } from '@typings/command'

// Create a new client instance

const databaseFolder = path.resolve(import.meta.dirname, '..')
logger.info(databaseFolder)
const db = new DatabaseSync(path.join(databaseFolder, 'jeans_lustiger_bot.db'))

db.exec(`--sql
	CREATE TABLE users (
		id TEXT PRIMARY KEY,
		terms_accept_date TEXT
	)
`)

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Command>
	}
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })
client.commands = new Collection<string, Command>()

// import commands
const commandFolder = path.join(import.meta.dirname, 'commands')

async function loadCommands(cacheBust: boolean) {
	client.commands.clear()
	for (const file of fs.readdirSync(commandFolder, { withFileTypes: true, recursive: true })) {
		if (file.isFile() && file.name.endsWith('.ts')) {
			const filePath = path.join(file.parentPath, file.name)
			const command = await import(`${filePath}${cacheBust ? Date.now() : ''}`)
			if (isCommand(command)) {
				client.commands.set(command.data.name, command)
			}
			else {
				logger.warn(`The command at ${filePath} is not a suitable command.`)
			}
		}
	}
}

await loadCommands(false)

const commandsArray = Array.from(client.commands)

// Find the longest command name length
const maxLength = Math.max(...commandsArray.map(([name]) => name.length))

// Build the padded log string
const commandList = commandsArray
	.map(([name, cmd]) => {
		const paddedName = name.padEnd(maxLength, ' ')
		return `${paddedName} | ${cmd.data.description}`
	})
	.join('\n')

logger.info(
	`Registered ${client.commands.size} Command${client.commands.size !== 1 ? 's' : ''}:\n${commandList}`, commandsArray,
)

// When the client is ready, run this code (only once).
// The distinction between `client: Client<boolean>` and `readyClient: Client<true>` is important for TypeScript developers.
// It makes some properties non-nullable.s
client.once(Events.ClientReady, (readyClient) => {
	logger.info(`Ready! Logged in as ${readyClient.user.tag}`)
})

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return

	const command = interaction.client.commands.get(interaction.commandName)

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`)
		return
	}

	logger.info(`Got command ${command.data.name}`)

	try {
		await command.execute(interaction)
	}
	catch (error) {
		logger.error(`Error while executing command ${command.data.name}`, error)
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
		}
		else {
			await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral })
		}
	}
})

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)

process.stdin.on('keypress', async (_, key: Key) => {
	if (key.name === 'r') {
		logger.info('Reloading commands...')
		await loadCommands(true)
	}

	if (key.ctrl && key.name === 'c') {
		// Handle Ctrl+C manually to exit
		console.log('\nGracefully shutting down...')
		process.kill(process.pid, 'SIGINT')
	}
})

// Log in to Discord with your client's token
client.login(process.env.BOT_TOKEN)
db.close()
