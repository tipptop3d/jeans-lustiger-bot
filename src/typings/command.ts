import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js'

export interface Command {
	data: SlashCommandBuilder
	execute: (interaction: ChatInputCommandInteraction) => Promise<never>
}

export function isCommand(command: unknown): command is Command {
	return (
		typeof command === 'object'
		&& command !== null
		&& 'data' in command
		&& (command as Command).data instanceof SlashCommandBuilder
		&& typeof (command as Command).execute === 'function'
	)
}
