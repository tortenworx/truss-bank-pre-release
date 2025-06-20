import { relations } from "drizzle-orm";
import { text, date, integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const clientsTable = pgTable("clients", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    discordId: text().notNull().unique(),
    minecraftIGN: varchar({ length: 16 }).notNull().unique(),
    dateCreated: date().defaultNow(),
})

export const clientsAccountsPrimaryRelationship = relations(clientsTable, ({ many }) => ({
    accounts: many(accountTable)
}))

export const accountTable = pgTable("accounts", {
    accountNickname: varchar({ length: 64 }).notNull(),
    primaryOwner: integer('client_id')
})