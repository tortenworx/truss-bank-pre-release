import { infoEmbed } from '../../utils/embeds';
import { db } from '../../utils/drizzle';
import type { Subcommand } from '@sapphire/plugin-subcommands';
import numbro from 'numbro';
import { format_amounts } from '../../utils/functions';

export default async function accountsTransactionsFunction(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: "Ephemeral" })
    const account = Number(interaction.options.getString("account"))
    const get_transactions = await db.query.transaction.findMany({
        where(fields, operators) {
            return operators.eq(fields.account, account)
        },
    })
    const embed = infoEmbed({
        title: "Account Transactions",
        description: "List of transaction of your selected account..",
    })

    for (const transaction of get_transactions) {
        embed.addFields({
            name: `${transaction.description}`,
            value: `
                **Transaction Type**: ${transaction.type}
                **Amount**: ${format_amounts(transaction.amount)}
                **Transaction Time**: ${transaction.date_created ? `<t:${Math.floor(transaction.date_created.getTime()/1000)}>` : "N/A"}
            `
        })
    }
    await interaction.followUp({ embeds: [embed], flags: ["Ephemeral"] })
}