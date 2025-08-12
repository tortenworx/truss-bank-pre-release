import type { Subcommand } from "@sapphire/plugin-subcommands";
import { db } from "../../utils/drizzle";
import { errorEmbed, infoEmbed } from "../../utils/embeds";
import numbro from "numbro";

export default async function accountInfoFunction(interaction: Subcommand.ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: ['Ephemeral'] })
    const productId = Number(interaction.options.getString("account"))
    const account = await db.query.accountTable.findFirst({
        where(fields, operators) {
            return operators.eq(fields.id, productId)
        },
        with: {
            product: true
        }
    })

    if (!account) {
        return await interaction.editReply({
            embeds: [
                errorEmbed({
                    title: 'An error occured!',
                    description: 'No account found with given ID. It is either currently suspended or has been deleted by a bank administrator.'
                })
            ],
        })
    }


    return await interaction.editReply({
        embeds: [
            infoEmbed({
                title: 'Account Details',
                fields: [
                    { name: 'Acount Nickname', value: account?.accountNickname },
                    { name: 'Account Type', value: account.product.type },
                    { name: 'Available Balance', value: numbro(account.balance).formatCurrency({ currencySymbol: '£', currencyPosition: 'prefix' }) },
                ]
            })
        ],
    })
}