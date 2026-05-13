# GW2Helper

## What is it?

GW2 Helper is an unofficial companion app for Guild Wars 2 that makes everyday gameplay easier by keeping your dailies, achievements, events, inventory, and trading post activity all in one place.

It is built for players who want less menu-hopping and more actual gameplay. Instead of checking multiple places in game (and on wiki), you get a clear view of what to do, what you already finished, and what is worth focusing on next.

What it helps with:

- quickly seeing your daily priorities and current account progress,
- planning goals like achievements, legendary unlocks, and material farming,
- finding useful event timings and setting reminders,
- tracking trading post activity and delivery box pickups,
- reducing inventory chaos with practical inventory cleanup advice.

Key functionality includes:

- daily and account progress overview,
- achievements browsing with detailed progress and reward breakdowns,
- event timers and reminder support,
- inventory and materials visibility,
- inventory cleanup advice (including where duplicate/stackable items are spread),
- fast item lookup across storage sources with filtering options,
- trading post and delivery tracking,
- legendary armory progress tracking.

Data returned by API, as well as your API key, are cached in browser data. Default cache timeout is 15 minutes. You can, however, ignore that by providing parameter `ignore-cache=1` in browser's query string. There are more options like that described in the [Debugging section](#debugging).

### What is it not?

It is not meant to replace great tools like: [GW2Wiki](https://wiki.guildwars2.com/), [GW2BLTC](https://www.gw2bltc.com/) or [gw2efficiency](https://gw2efficiency.com/).

You can use it locally or try the publicly hosted version at [jdcsolutions.rocks/gw2helper](https://jdcsolutions.rocks/gw2helper/).

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

## Debugging

For debugging purposes you can use the following query string params:

- `debug-mode=1` - lets you see additional logging information in console
- `show-api-links=1` - lets you see ids from API in parts of user interface (like achievements)
- `ignore-cache=1` - ignores browser cache and forces new requests to the official API - please use with caution!
- `dev-mode=1` - switches API client to mock API (`/api`) for local development/debugging
- `real-api=1` - when `dev-mode=1` is enabled, forces using real Guild Wars 2 API instead of mock API
- `key=<API_KEY>` - provides API key directly from query string (useful for quick local debugging or sharing)

## Legal notice

This project contains source code of an unofficial site and is not affiliated with Guild Wars 2, ArenaNet, or NCSoft.

Project uses data from official [Guild Wars 2 API](https://wiki.guildwars2.com/wiki/API:Main) as well as data and images from [Guild Wars 2 Wiki](https://wiki.guildwars2.com/)

© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation.
