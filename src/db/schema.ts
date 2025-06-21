import { relations } from "drizzle-orm";
import { primaryKey, text, date, integer, pgTable, varchar, pgEnum, json } from "drizzle-orm/pg-core";

export const ProductTypeEnum = pgEnum("productType", ["SAVINGS", "CHECKING", "TIMEDEPOSIT"])

export const clientsTable = pgTable("clients", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    discordId: text().notNull().unique(),
    minecraftIGN: varchar({ length: 16 }).notNull().unique(),
    dateCreated: date().defaultNow(),
})

export const accountTable = pgTable("accounts", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    accountNickname: varchar({ length: 64 }).notNull(),
    primaryOwner: integer("mainOwnerId").references(() => clientsTable.id)
})

export const accountsRelations = relations(accountTable, ({ many }) => ({
    product: many(productsToAccounts)
}))

export const productsTable = pgTable("products", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    emoji: varchar({ length: 1 }).default("💵").notNull(),
    name: text().notNull().unique(),
    description: varchar({ length: 256 }),
    type: ProductTypeEnum().default("CHECKING").notNull(),
    chargesMatrix: json().notNull()
})

export const productsRelations = relations(productsTable, ({ many }) => ({
    accounts: many(productsToAccounts)
}))

export const productsToAccounts = pgTable(
    "prodcuts_to_accounts",
    {
        accountsId: integer('account_id').notNull().references(() => accountTable.id),
        productId: integer('product_id').notNull().references(() => productsTable.id)
    },
    (t) => [
        primaryKey({ columns: [t.accountsId, t.productId] })
    ],
)

export const productsToAccountsRelations = relations(productsToAccounts, ({ one }) => ({
    account: one(accountTable, {
        fields: [productsToAccounts.accountsId],
        references: [accountTable.id]
    }),
    product: one(productsTable, {
        fields: [productsToAccounts.productId],
        references: [productsTable.id]
    })
}))
