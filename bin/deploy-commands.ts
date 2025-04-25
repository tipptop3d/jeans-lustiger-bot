import dotenv from 'dotenv'
dotenv.config()

import pjson from '../package.json'

import path from 'path'
import fs from 'node:fs'
import readline from 'node:readline'

import { Command as CommandLineInterface, Option } from 'commander'
import { RequestMethod, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes } from 'discord.js'
import {
	RESTPutAPIApplicationCommandsResult,
	RESTPostAPIApplicationCommandsResult,
	RESTGetAPIApplicationCommandsResult,
} from 'discord-api-types/v10'

import { isCommand } from '../src/typings/command.ts'

type GuildOrGlobal = {
	guildId: string
	global: false
}	|	{
	guildId: undefined
	global: true
}

interface BaseOptions {
	botToken: string
	applicationId: string
}

async function handleFiles(action: RequestMethod, files: string[], options: BaseOptions & GuildOrGlobal) {
	const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
	for (const file of files) {
		const command = await import(path.resolve(file))
		if (isCommand(command)) {
			commands.push(command.data.toJSON())
		}
	}

	if (commands.length === 0) {
		console.log('No commands found.')
		return
	}

	const route = options.global
		? Routes.applicationCommands(options.applicationId)
		: Routes.applicationGuildCommands(options.applicationId, options.guildId)

	const rest = new REST().setToken(options.botToken)

	if (action === RequestMethod.Put) {
		try {
			const data = (await rest.put(route, {
				body: commands,
			})) as RESTPutAPIApplicationCommandsResult
			console.log(`Successfully overwrote ${data.length} application commands.`)
		}
		catch (e) {
			console.error(`Failed to overwrite application commands.\nReason: ${e}`)
		}
	}
	else if (action === RequestMethod.Post) {
		const data: RESTPostAPIApplicationCommandsResult[] = []
		for (const command of commands) {
			try {
				data.push(await rest.post(route, {
					body: command,
				}) as RESTPostAPIApplicationCommandsResult)
				console.log(`Successfully created/overwrote ${command.name} command.`)
			}
			catch (e) {
				console.error(`Failed to create/overwrite ${command.name} command.\nReason: ${e}`)
			}
		}
		console.log(`Successfully created/overwrote ${data.length} application commands.`)
	}
}

const program = new CommandLineInterface()
	.name('deploy-commands')
	.description('Deploy discord commands using their REST API')
	.version(pjson.version)

program
	.action(() => {
		console.log('Hello!!')
	})

program
	.command('bulk')
	.argument('[files...]', '.js/.ts files containing the desired commands.')
	.description(
		'Bulk overwrites all commands found in files for the specified scope',
	)
	.addOption(
		new Option('-b --bot-token <bot_token>', 'The bot token to use.')
			.makeOptionMandatory(true)
			.env('BOT_TOKEN'),
	)
	.addOption(
		new Option('-a, --application-id <application_id>', 'The application ID of the bot.')
			.makeOptionMandatory(true)
			.env('APPLICATION_ID'),
	)
	.addOption(
		new Option('-g, --guild-id [guild_id]', 'Replaces all commands of a specified guild scope.')
			.conflicts('global')
			.env('DEPLOY_GUILD_ID'),
	)
	.addOption(
		new Option('-G, --global', 'Replaces all commands of the global scope.')
			.conflicts('guild-id')
			.default(true),
	)
	.action(handleFiles.bind(null, RequestMethod.Put))

program
	.command('create')
	.argument('[files...]', '.js/.ts files containing the desired commands.')
	.description(
		'Creates all commands found in files for the specified scope',
	)
	.addOption(
		new Option('-b --bot-token <bot_token>', 'The bot token to use.')
			.makeOptionMandatory(true)
			.env('BOT_TOKEN'),
	)
	.addOption(
		new Option('-a, --application-id <application_id>', 'The application ID of the bot.')
			.makeOptionMandatory(true)
			.env('APPLICATION_ID'),
	)
	.addOption(
		new Option('-g, --guild-id [guild_id]', 'Replaces all commands of a specified guild scope.')
			.conflicts('global')
			.env('DEPLOY_GUILD_ID'),
	)
	.addOption(
		new Option('-G, --global', 'Replaces all commands of the global scope.')
			.conflicts('guild')
			.default(true),
	)
	.action(handleFiles.bind(null, RequestMethod.Post))

interface GetOptions extends BaseOptions {
	output?: string
	filter?: string
	info?: boolean
}

program
	.command('get')
	.description('Get all commands for the specified scope')
	.addOption(
		new Option('-b --bot-token <bot_token>', 'The bot token to use.')
			.makeOptionMandatory(true)
			.env('BOT_TOKEN'),
	)
	.addOption(
		new Option('-a, --application-id <application_id>', 'The application ID of the bot.')
			.makeOptionMandatory(true)
			.env('APPLICATION_ID'),
	)
	.addOption(
		new Option('-g, --guild-id [guild_id]', 'Replaces all commands of a specified guild scope.')
			.conflicts('global')
			.env('DEPLOY_GUILD_ID'),
	)
	.addOption(
		new Option('-G, --global', 'Replaces all commands of the global scope.')
			.conflicts('guild')
			.default(true),
	)
	.option('-o, --output [file]', 'Output file to save the commands to.')
	.option('-f, --filter [filter]', 'Filter the commands by name.')
	.option('-I --info', 'Prints more information about the command.')
	.action(async (options: GetOptions & GuildOrGlobal) => {
		const route = options.global
			? Routes.applicationCommands(options.applicationId)
			: Routes.applicationGuildCommands(options.applicationId, options.guildId)

		const rest = new REST().setToken(options.botToken)

		let data: RESTGetAPIApplicationCommandsResult
		try {
			data = (await rest.get(route)) as RESTGetAPIApplicationCommandsResult
			if (options.filter) {
				const filter = options.filter
				data = data.filter(command => command.name.includes(filter))
			}
		}
		catch (e) {
			console.error(`Failed to get application commands.\nReason: ${e}`)
			return
		}

		// If the output option is set, write to the file
		if (options.output) {
			const outputFile = path.resolve(options.output)
			data.forEach(async (command) => {
				if (options.info)
					await fs.promises.appendFile(outputFile, `Name: ${command.name}, id: ${command.id}, description: ${command.description}\n`)
				else
					await fs.promises.appendFile(outputFile, `${command.id}\n`)
			})
		}
		// otherwise print to stdout
		else {
			data.forEach((command) => {
				if (options.info)
					console.log(`Name: ${command.name}, id: ${command.id}, description: ${command.description}`)
				else
					console.log(command.id)
			})
		}
	})

async function deleteCommand(rest: REST, id: string, options: BaseOptions & GuildOrGlobal) {
	const route = options.global
		? Routes.applicationCommand(options.applicationId, id)
		: Routes.applicationGuildCommand(options.applicationId, options.guildId, id)

	try {
		await rest.delete(route)
		console.log(`Successfully deleted command with ID ${id}.`)
	}
	catch (e) {
		console.error(`Failed to delete application command with ID ${id}.\nReason: ${e}`)
	}
}

program
	.command('delete')
	.description('Delete all specified commands for the specified scope')
	.argument('[ids...]', 'IDs of the commands to delete. Alternatively reads from stdin.')
	.addOption(
		new Option('-b --bot-token <bot_token>', 'The bot token to use.')
			.makeOptionMandatory(true)
			.env('BOT_TOKEN'),
	)
	.addOption(
		new Option('-a, --application-id <application_id>', 'The application ID of the bot.')
			.makeOptionMandatory(true)
			.env('APPLICATION_ID'),
	)
	.addOption(
		new Option('-g, --guild-id [guild_id]', 'Replaces all commands of a specified guild scope.')
			.conflicts('global')
			.env('DEPLOY_GUILD_ID'),
	)
	.addOption(
		new Option('-G, --global', 'Replaces all commands of the global scope.')
			.conflicts('guild')
			.default(true),
	)
	.action(async (ids: string[], options: BaseOptions & GuildOrGlobal) => {
		const rest = new REST().setToken(options.botToken)

		if (ids.length === 0) {
			const stdin = process.stdin
			const rl = readline.createInterface({
				input: stdin,
				output: process.stdout,
				terminal: false,
			})

			rl.on('line', async (line) => {
				if (line.trim() === '') {
					rl.close()
					return
				}
				const id = line.trim()
				await deleteCommand(rest, id, options)
			})

			// Handle error properly by listening for stream close or error events.
			rl.on('close', () => {
				console.log('Finished processing stdin input.')
			})

			rl.on('error', (err) => {
				console.error('Error reading from stdin:', err)
			})
		}
		else {
			for (const id of ids) {
				await deleteCommand(rest, id, options)
			}
		}
	})

program.parseAsync(process.argv)
