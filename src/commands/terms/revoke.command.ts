import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
	.setName('revoke')
	.setDescription('Widerrufe die Zustimmung zu den AGB und der Datenschutzerklärung.')

export async function execute(interaction: ChatInputCommandInteraction) {
	const info = interaction.client.db.prepare('DELETE FROM users WHERE user_id = ?')
		.run(interaction.user.id)

	if (info.changes === 0) {
		await interaction.reply({
			content: 'Nichts zu widerrufen. Du hast die Datenschutzerklärung nicht akzeptiert.',
			flags: MessageFlags.Ephemeral,
		})
		return
	}

	await interaction.reply({
		content: 'Widerruf erfolgreich. SSIO wird dir nicht zuhören.',
		flags: MessageFlags.Ephemeral,
	})
}
