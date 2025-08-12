import type { Subcommand } from "@sapphire/plugin-subcommands";
import { defaultEmbed, successEmbed } from '../../utils/embeds';
import { db } from '../../utils/drizzle';
import { ActionRowBuilder, ComponentType, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import { accountTable, clientsTable } from "../../db/schema";
import { eq } from "drizzle-orm";
import numbro from "numbro";
import { generate_random_characters } from "../../utils/functions";

interface AccountInfo {
	type: string
	account_number: number
	nickname: string,
	balance: number
}

function toSentenceCase(str: string): string {
    if (!str) {
        return ""; // Handle empty or null input
    }
    // Convert the entire string to lowercase first
    let result = str.toLowerCase();
    // Capitalize the first letter of the entire string
    result = result.charAt(0).toUpperCase() + result.slice(1);
    // Capitalize the first letter after a period, exclamation mark, or question mark
    result = result.replace(/([.!?]\s*)(\w)/g, (match, p1, p2) => {
        return p1 + p2.toUpperCase();
    });
    return result;
}

export default async function accountCreationFunction(interaction: Subcommand.ChatInputCommandInteraction) {
	// Defer reply (ephemeral) for interaction
	await interaction.deferReply({ flags: "Ephemeral" });

	const productsList = await db.query.productsTable.findMany({
		columns: {
			id: true,
			name: true,
			type: true,
			description: true,
			emoji: true,
		},
	});

	const productsEmbed = defaultEmbed({
		title: 'Select a product',
		description: 'Pick one that fits your lifestyle needs!',
		fields: productsList.map((item) => ({
			name: `**${item.emoji} ${item.name}**`,
			value: `Type: ${item.type}\n${item.description}`,
		})),
	});

	const selectMenu = new StringSelectMenuBuilder()
		.setCustomId(`select_product_${interaction.id}`)
		.setPlaceholder('Select a product')
		.addOptions(
			productsList.map((item) =>
				new StringSelectMenuOptionBuilder()
					.setLabel(item.name)
					.setDescription(`${toSentenceCase(item.type)} account`)
					.setValue(item.id.toString())
			)
		);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

	const replyMessage = await interaction.editReply({
		embeds: [productsEmbed],
		components: [row],
	});

	const collector = replyMessage.createMessageComponentCollector({
		componentType: ComponentType.StringSelect,
		filter: (i) => i.user.id === interaction.user.id,
		max: 1,
		time: 60_000,
	});
	
	collector.on('collect', async (selectInteraction) => {
		const productInfo = await db.query.productsTable.findFirst({
			where(fields, operators) {
				return operators.eq(fields.id, Number(selectInteraction.values[0]))
			},
		})
		if (!productInfo) {
			throw new Error('Unexpected error occured!')
		}
		// Build modal
		const modalId = `newAccountName-${interaction.user.id}-${Date.now()}`;
		const modal = new ModalBuilder()
			.setCustomId(modalId)
			.setTitle('Account Setup');
		const nameInput = new TextInputBuilder()
			.setCustomId('name')
			.setLabel('Enter a name for your account')
			.setMinLength(6)
			.setMaxLength(64)
			.setValue(`${productInfo.type} ACCOUNT ${generate_random_characters(4)}`)
			.setStyle(TextInputStyle.Short);

		const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
		modal.addComponents(modalRow);

		// Show modal
		await selectInteraction.showModal(modal);

		const modalSubmit = await selectInteraction.awaitModalSubmit({
			filter: (m) => m.customId === modalId && m.user.id === interaction.user.id,
			time: 120_000,
		});
		
		const getUser = await db.query.clientsTable.findFirst({
			where: eq(clientsTable.discordId, interaction.user.id),
		});

		if (!getUser) {
			await modalSubmit.reply({ content: '❌ No user found in the database!', ephemeral: true });
			return;
		}

		const account = await db.transaction(async (tx) => {
			const accountRecord = await tx.insert(accountTable).values({
				id: Number(`1${numbro(productInfo.id).format("000")}${numbro(Math.floor(Math.random()*9999)).format("0000")}`),
				accountNickname: modalSubmit.fields.getField('name').value,
				primaryOwner: getUser.id,
				balance: 0,
				product: Number(selectInteraction.values[0])
			}).returning({
				account_number: accountTable.id,
				nickname: accountTable.accountNickname,
				balance: accountTable.balance,
				product: accountTable.product
			})
			if (!accountRecord[0]) {
				tx.rollback()
				throw new Error('Unexpected error occured!')
			}
			return accountRecord[0]
		})

		await interaction.deleteReply()
		await modalSubmit.reply({
			embeds: [
				successEmbed({
					title: "Account Created!",
					description: `Your new ${productInfo.name} account has been created and is ready to use!`,
					fields: [
						{
							name: "",
							value: `
								**Account Nickname**: ${account.nickname}
								**Account Number**: ${account.account_number.toString().trim().replace(/(\d{4})(\d{4})/, "$1-$2")}
								**Initial Balance**: ${numbro(account.balance).formatCurrency({ currencySymbol: '£', currencyPosition: 'prefix' })}
							`
						}
					]
				})
			],
			flags: "Ephemeral"
		});
	});

	collector.on('end', async (collected, reason) => {
		if (collected.size === 0 && reason === 'time') {
			await interaction.deleteReply();
		}
	});
}