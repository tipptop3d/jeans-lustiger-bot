import { createRiotFetch } from 'riot-games-fetch-typed'
import { ofetch } from 'ofetch'

export const riotFetch = createRiotFetch(ofetch, { apiKey: process.env.RIOT_API_KEY ?? '' })
