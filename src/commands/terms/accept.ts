import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js'
import type { ChatInputCommandInteraction } from 'discord.js'

const embed = new EmbedBuilder()
	.setTitle('Einwilligung in die Datenverarbeitung')
	.setDescription('Damit SSIO dir antworten kann, braucht es eine Zustimmung deinerseits, dass ich deine Stimme verarbeiten darf. Zur rechtlichen Sicherheit brauche ich dafür deine Einwilligung nach Art. 6 Abs. 1 lit. a DSVGO und muss dir folgende Informationen nach Art. 13 DSVGO bereitstellen.')
	.setThumbnail('https://cdn-images.dzcdn.net/images/artist/4876babd658a69344e0264c2e40f6bcd/500x500.jpg')
	.addFields(
		{
			name: 'Zweck der Verarbeitung',
			value: 'Es werden Sprachaufnahmen aus einem Discord-Sprachkanal erfasst, die danach maschinell transkribiert werden und auf benutzerdefinierte Schlüsselwörter überprüft werden. Abhängig vom Ergebnis können automatisierte Aktionen durch einen Discord-Bot ausgelöst werden. Zusätzlich wird die Zustimmung dieser Einwilligung mit einem Zeitstempel identifizierbar bis zum Widerruf gespeichert (Art.7 DSGVO).',
		},
		{
			name: 'Speicherdauer',
			value: 'Die Sprachaufnahmen und Transkripte werden nur so lange gespeichert, wie es für die Erfüllung des jeweiligen Zwecks erforderlich ist. Anschließend werden die Daten unverzüglich gelöscht.',
		},
		{
			name: 'Rechtsgrundlage der Verarbeitung',
			value: 'Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO – Einwilligung. Die Sprachdaten werden ausschließlich verarbeitet, wenn die betroffene Person zuvor ausdrücklich zugestimmt hat. Die Zustimmung wird mit dem Drücken des Knopfes "Zustimmen" erteilt. Diese Einwilligung kann jederzeit widerrufen werden, entweder mit dem Slash-Command `/revoke` oder einer E-Mail an den Vertrauten.',
		},
		{
			name: 'Weitergabe an Dritte',
			value: 'Die Daten werden in keinem Fall an Dritte oder Discord weitergegeben. Alle gesammelten Daten verbleiben ausschließlich auf dem Server des Verantwortlichen.',
		},
		{
			name: 'Maßnahmen zur Datensicherung',
			value: 'Die Daten werden vertraulich auf dem PC des Vertrauten oder einem Server, der vom Vertrauten geführt wird, gespeichert.',
		},
		{
			name: 'Betroffenenrechte',
			value: 'Du hast das Recht auf:\
- Auskunft (Art. 15 DSGVO)\
- Berichtigung (Art. 16 DSGVO)\
- Löschung (Art. 17 DSGVO)\
- Einschränkung der Verarbeitung (Art. 18 DSGVO)\
- Datenübertragbarkeit (Art. 20 DSGVO)\
- Widerruf der Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)\
- Beschwerde bei einer Datenschutzaufsichtsbehörde (Art. 77 DSGVO)',
		},
		{
			name: 'Kontaktdaten des Verantwortlichen',
			value: 'Email: [tipptop.dev@gmail.com](mailto:tipptop.dev@gmail.com?subject=[DSVGO])\
Discord: <@398926591859752960>',
		},
	)

const acceptButton = new ButtonBuilder()
	.setCustomId('terms_accept')
	.setLabel('Akzeptieren')
	.setEmoji('👍')
	.setStyle(ButtonStyle.Success)

const declineButton = new ButtonBuilder()
	.setCustomId('terms_decline')
	.setLabel('Decline')
	.setEmoji('🙅')
	.setStyle(ButtonStyle.Secondary)

const acceptOrDeclineRow = new ActionRowBuilder<ButtonBuilder>()
	.addComponents(acceptButton, declineButton)

export const data = new SlashCommandBuilder()
	.setName('accept')
	.setDescription('Accept the Terms and GDPR to let the bot listen to you.')

export async function execute(interaction: ChatInputCommandInteraction) {
	const response = await interaction.reply({
		embeds: [embed],
		components: [acceptOrDeclineRow],
		flags: MessageFlags.Ephemeral,
	})

	try {
		const accept = await response.awaitMessageComponent({
			filter: i => i.user.id === interaction.user.id,
			time: 360_000,
		})

		if (accept.customId === 'terms_accept') {
			// TODO: database update
			await accept.reply({
				content: 'Genehmigung erteilt! SSIO wird dir nun antworten.',
				flags: MessageFlags.Ephemeral,
			})
		}
		else if (accept.customId === 'terms_decline') {
			await accept.reply({
				content: 'Alles klar. SSIO wird dir nicht zuhören.',
				flags: MessageFlags.Ephemeral,
			})
		}
	}
	catch {
		await interaction.followUp({
			content: 'Keine Anwort ist auch ne Antwort.',
			flags: MessageFlags.Ephemeral,
		})
	}
}
