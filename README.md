# gw2helper

This project contains source of unofficial site and is not affiliated with GuildWars2, ArenaNet, or NCSoft.

Project uses data from official [Guild Wars 2 API](https://wiki.guildwars2.com/wiki/API:Main) as well as data and images from [Guild Wars 2 Wiki](https://wiki.guildwars2.com/)
Data returned by API, as well as your API-KEY are cached in browser's data. Default cache timeout is 15 minutes. You can, however, ignore that by providing parameter `ignore-cache=1` in browser's query string.

### Legal notice:
© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation.

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
- `show-api-links=1` - lets you see ids from API in parts of user inerface (like achievements)
- `ignore-cache=1` - ignores brwoser's cache and forces new request fo the official API - pease use with caution!

