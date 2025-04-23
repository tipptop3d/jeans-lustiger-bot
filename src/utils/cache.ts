import { Database } from 'better-sqlite3'
import { Collection } from 'discord.js'

export const cache = {
	users: new Collection<string, Date>(),
}

export function populateUsersCache(db: Database) {
	const stmt = db.prepare<never[], { id: string, terms_accept_date: string }>('SELECT id, terms_accept_date FROM users')
	const result = stmt.all()
	cache.users.clear()
	result.forEach(({ id, terms_accept_date }) => {
		cache.users.set(id, new Date(terms_accept_date))
	})
}
