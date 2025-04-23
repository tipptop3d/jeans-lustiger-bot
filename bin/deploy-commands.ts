import pjson from '../package.json'

import fs from 'node:fs'
import path from 'node:path'

import { Command as CommandLineInterface, Option } from 'commander'
import { RequestMethod, REST, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord.js'

import { isCommand } from '../src/typings/command.ts'

interface getCommandsOptions {
	limit?: number
	filter?: string
	regex?: RegExp
	folder?: string
}

async function getCommands(specified_path: string, options: getCommandsOptions) {
	const limit = (options.limit && options.limit > 0) ? options.limit : Infinity

	const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
	for (const file of fs.readdirSync(specified_path, { withFileTypes: true, recursive: true })) {
		if (file.isFile() && file.name.endsWith('.command.ts')) {
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
		if (commands.length >= limit) {
			break
		}
	}
	return commands
}

interface ProgramOptions {
	guild?: string
	global?: boolean
	search?: string
	filter?: string
	regex?: string
}

async function handleProgram(files: string[], options: ProgramOptions) {

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
	.command('replace')
	.argument('[files...]', '.ts files containing the desired commands.')
	.description(
		'Either replaces all given commands or found commands in the specified scope',
	)
	.addOption(
		new Option('-g, --guild [guild_id]', 'Replaces all commands of a specified guild scope.')
			.conflicts('global')
			.env('DEPLOY_GUILD_ID'),
	)
	.addOption(
		new Option('-G, --global', 'Replaces all commands of the global scope.')
			.conflicts('guild')
			.default(true),
	)
	.option('-S --search [path]', 'Search for `.command.ts` files in the specified path.', '.')
	.addOption(
		new Option('-F, --filter [pattern]', 'Only replace commands that includes the pattern.')
			.implies({ search: true }),
	)
	.addOption(
		new Option('-R, --regex [regex]', 'Only replace commands that match the Regex pattern.')
			.implies({ search: true }),
	)
	.action(handleProgram)

program.parseAsync(process.argv)
