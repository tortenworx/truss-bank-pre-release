import { Precondition, type ChatInputCommand } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { db } from '../utils/drizzle';

export class KYCNotVerified extends Precondition {
    public override async chatInputRun(interaction: ChatInputCommandInteraction, command: ChatInputCommand, context: Precondition.Context): Precondition.AsyncResult {
        return this.checkIfUserIsKYC(interaction.user.id)
    }

    private async checkIfUserIsKYC(userId: string): Precondition.AsyncResult {
        const data = await db.query.clientsTable.findFirst({
            where(fields, operators) {
                return operators.eq(fields.discordId, userId)
            },
        })
        return data ? this.error({ identifier: "Already registered", message: "You already have registed an account with TRUSS Bank! If you believe that this is a mistake, please open a support ticket." }) : this.ok()
    }
}