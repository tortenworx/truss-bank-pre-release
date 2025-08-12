import { infoEmbed } from '../../utils/embeds';
import { db } from '../../utils/drizzle';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import numbro from 'numbro';

export default async function accountsListFunction(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" })
    const getClient = await db.query.clientsTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.discordId, interaction.user.id)
        },
        columns: {
            id: true
        }
    })
    if (!getClient) return;
    const getClientAccounts = await db.query.accountTable.findMany({
        where(fields, operators) {
            return operators.eq(fields.primaryOwner, getClient?.id)
        },
        with: {
            product: true,
        }
    })
    
    const embed = infoEmbed({
        title: "Account List",
        description: "List of accounts that you can manage.",
    })

    for (const account of getClientAccounts) {
        embed.addFields({
            name: account.product.name,
            value: `
                **Account Nickname**: ${account.accountNickname}
                **Account Number**: ${account.id.toString().trim().replace(/(\d{4})(\d{4})/, "$1-$2")}
                **Available Balance**: ${numbro(account.balance).formatCurrency({ currencySymbol: '£', currencyPosition: 'prefix' })}
            `
        })
    }
    await interaction.followUp({ embeds: [embed], flags: ["Ephemeral"] })
}