# Sol Lite

A thinking partner in your pocket. Built on the [Lycheetah Framework](https://github.com/Lycheetah).

## What it is

Sol Lite is the gateway product in the Sol ecosystem — a single-screen AI conversation app designed to make the Lycheetah Framework *felt*, not just known.

Pick your path. Talk to Sol. Come back tomorrow.

**Three paths:**
- **Think Clearly** — untangle complex problems and examine your beliefs
- **Know Yourself** — understand your patterns, reactions, and motivations
- **Build Something** — pressure-test ideas and work through real problems

## What makes it different

Sol doesn't give you five mediocre questions. It gives you one good one.

It notices what's unsaid. It reflects truth back without sugarcoating or lectures. It ends every response with either a precise observation or a single question that opens the next layer — never both.

The framework behind this has 1,400+ pages of development and 250+ files on GitHub. Sol Lite is the door to that cathedral.

## Features

- Dynamic opening messages based on your path, streak, and time of day
- Daily question card — a new question every day, tap to explore
- Quick-tap thinking prompts per path
- Conversation persistence — your history is there when you return
- Notebook — long-press any Sol message to save it as a reflection
- Field state glyphs — visual indicator of the conversation's epistemic mode
- 15 free messages/day via proxy — add your own DeepSeek key to remove the limit
- Streak tracking

## Stack

- Expo SDK 55 / React Native
- Expo Router v5
- AsyncStorage for local persistence
- Cloudflare Worker as DeepSeek proxy with KV rate limiting
- BYOK (bring your own key) upgrade path

## Running locally

```bash
git clone https://github.com/Lycheetah/Sol-Lite.git
cd Sol-Lite
npm install --legacy-peer-deps
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Backend

The Cloudflare Worker proxy lives at `sol-lite-worker.js` in the root of this repo. Deploy it to your own Cloudflare account with a `DEEPSEEK_API_KEY` secret and a `RATE_LIMIT_KV` KV namespace binding.

## The broader ecosystem

| Product | Purpose |
|---|---|
| **Sol Lite** | Gateway — mass market, one persona, free tier |
| **Sol (full)** | Sanctuary — full framework, four personas, deep mode switching |
| **CASCADE PC Tool** | Workshop — desktop knowledge tool with epistemic scoring |
| **Lycheetah** | Public artefacts — validators, benchmarks, visualizers |
| **CODEX AURA PRIME** | Source of record — 1,400+ pages, 9 frameworks, proofs |

## Author

Mackenzie Conor James Clark — [Lycheetah](https://github.com/Lycheetah)

---

*The door, not the cathedral.*
