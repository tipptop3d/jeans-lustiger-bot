import dotenv from 'dotenv'
dotenv.config()

import pjson from '../package.json'

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

import { Command as CommandLineInterface } from 'commander'
import { REST, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'

import { isCommand } from '../src/typings/command'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const commandFolder = path.join(__dirname, '../src/commands')

interface getCommandsOptions {
	filter?: string
	regex?: RegExp
	folder?: string
}

async function getCommands(specified_path: string, options: getCommandsOptions) {
	const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
	for (const file of fs.readdirSync(specified_path, { withFileTypes: true, recursive: true })) {
		if (file.isFile() && file.name.endsWith('.ts')) {
			const filePath = path.join(file.parentPath, file.name)
			const command = await import(filePath)
			if (isCommand(command)) {
				if (
					!(options.filter && command.data.name.includes(options.filter))
					|| !(options.regex && command.data.name.match(options.regex))
					|| !(options.folder && filePath.split(path.sep).includes(options.folder))
				)
					commands.push(command.data.toJSON())
			}
			else {
				console.warn(`The command at ${filePath} is not a suitable command.`)
			}
		}
	}
	return commands
}

function ValidateIdOrGlobal(value?: string) {
	if (value === undefined)
		return null

	if (!isNaN(Number(value)) || value === 'global')
		return value
	else
		throw new Error('error: destination is not id or "global"')
}

const program = new CommandLineInterface()
	.name('deploy-commands')
	.description('Deploy discord commands using their REST API')
	.version(pjson.version)

program
	.command('deploy')
	.argument('[destination]', 'Deploy commands to guild_id or in global space.', ValidateIdOrGlobal)
	.description('Deploys commands to the specified guild_id or [DEV_]GUILD_ID in environment.')
	.option('-F, --filter [pattern]', 'Only add commands that includes the pattern.')
	.option('-R, --regex [regex]', 'Only add commands that match the Regex pattern.')
	.option('--foldername [foldername]', 'Only add commands that are in a specific folder.')
	.option('-p, --path [path]', 'Only add commands that are in this Path. Defaults to __dirname/../src/commands')
	.action(async (guild_id: string | undefined, options) => {
		if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID) {
			console.error('No authorization set in environment. Exiting')
			process.exit(1)
		}

		guild_id ??= process.env.GUILD_ID ?? process.env.DEV_GUILD_ID
		if (guild_id === undefined) {
			console.error('No guild_id specified or found in environment.')
			process.exit(1)
		}

		const command_path = path.resolve(options.path ?? commandFolder)

		const commands = await getCommands(command_path,
			{
				filter: options.filter,
				regex: RegExp(options.regex),
				folder: options.folder,
			})

		const rest = new REST().setToken(process.env.BOT_TOKEN)
		console.log(
			`Started deploying ${commands.length} application (/) command${commands.length !== 1 ? 's' : ''} in ${command_path} to ${guild_id}`,
		)
		const data = await rest.put(
			// Routes.applicationGuildCommands(process.env.CLIENT_ID, guild_id),
			guild_id !== 'global'
				? `/applications/${process.env.CLIENT_ID}/guilds/${guild_id}/commands`
				: `/applications/${process.env.CLIENT_ID}/commands`,
			{ body: commands },
		) as { length: number } & Record<string, unknown>
		console.log(`Sucessfully deployed ${data.length} application command${commands.length !== 1 ? 's' : ''}.`)
		console.log(data)
		process.exit(0)
	})

console.log(process.argv)
program.parse(process.argv)
