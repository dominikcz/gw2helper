<script>
	import '$lib/scss/gw2.scss';
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import BackToTop from '$lib/components/backToTop.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import { remindersSettings } from '$lib/stores/reminders.js';
	import Reminders from '$lib/reminders';

	import { Howl } from 'howler';

	import utils from '$lib/utils.js';

	import Navigation from '$lib/components/navigation.svelte';
	import Alert from '$lib/components/alert/alert.svelte';
	import AutoTooltip from '$lib/components/autotooltip/autoTooltip.svelte';
	import { onMount } from 'svelte';

	import { EVENTS_PARTIAL, EVENT_TEMPLATE } from '$lib/components/events/tts';
	import mustache from 'mustache';
	import eventsUtils from '$lib/components/events/eventsUtils.js';
	import clock from '$lib/stores/clock.js';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';

	export let data;

	const defaultTitle = 'GW2 Helper';
	let apiKey = data.apiKey;
	let reminders = new Reminders();
	let lastNotify = '';
	let confirmedNotify = '';

	let sounds = new Howl({
		src: [`${base}/assets/sounds/alarms.mp3`],
		sprite: {
			trumpet: [0, 5923],
			squeeze: [5924, 850],
			notif3: [6834, 1160],
			notif9: [8000, 2182],
		},
	});

	const devMode = utils.getQueryStringFlag('dev-mode');

	$: tokenInfo = data.tokenInfo;
	$: active = $page.url.pathname;
	$: title = [defaultTitle, active.replace(base, '').replaceAll('/', '')].filter(Boolean).join(' - ');

	$: navigation = [
		{ slug: `${base}/`, label: 'Home', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/daily/`, label: 'Daily', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/events/`, label: 'Events', visible: true },
		{ slug: `${base}/items/`, label: 'Items', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/materials/`, label: 'Materials', visible: tokenInfo.permissions.includes('inventories') },
		{ slug: `${base}/achievements/`, label: 'Achievements', visible: tokenInfo.permissions.includes('progression') },
		{ slug: `${base}/account/`, label: 'Account', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/characters/`, label: 'Characters', visible: tokenInfo.permissions.includes('characters') },
		{ slug: `${base}/guilds/`, label: 'Guilds', visible: tokenInfo.permissions.includes('guilds') },
	];

	$: currentPageVisible = devMode || navigation.find((x) => x.slug == active)?.visible || false;

	onMount(async () => {
		$remindersSettings = await data.remindersSettings;
	});

	async function saveApiKey() {
		if (data.apiService) {
			await data.apiService.init(apiKey);
			const _token = await data.apiService?.tokenInfo();
			if (_token.name) {
				await utils.saveApiKey(apiKey);
				invalidateAll();
			} else {
				tokenInfo.error = `Token "${apiKey}" is invalid`;
			}
		}
	}

	async function deleteApiKey() {
		apiKey = '';
		await utils.deleteApiKey();
		invalidateAll();
	}

	async function refresh() {
		if (data.apiService) {
			await data.apiService.clearCache();
		}
		location.reload(true);
	}

	let time = clock({ interval: 10 * 1000 });
	$: $time, onTimeChange();

	function onTimeChange() {
		const inAdvance = $remindersSettings.inAdvance;
		const list = reminders.activeAlarms($time, inAdvance);
		// const list = ['event 1', 'event 2']; // test
		if (list.length) {
			// we repeat alarm till it's active, unless confirmed by user (by closing associated toast message)
			playAlarm({
				time: eventsUtils.getHour($time),
				eventsList: list.join(', '),
				inAdvance,
				immediate: inAdvance == 0,
				plural: list.length > 1,
			});
		}
	}

	function playAlarm(info) {
		if (!info) return;
		let tts = mustache.render(EVENT_TEMPLATE, info, EVENTS_PARTIAL);
		// ignoring request with the same text, as we were not able to speak previous one yet and excessive queuing doesn't help ;)
		if ([lastNotify, confirmedNotify].includes(tts)) return;
		lastNotify = tts;

		toast.push(tts, {
			duration: 1000 * (tts.length / 10),
			onpop: (ev) => {
				if (ev == 2) {
					// if closed by user
					console.log('notification disabled:', tts);
					confirmedNotify = tts;
				}
			},
		});
		// console.log('tts', { info, tts });
		sounds.off('end');
		sounds.on('end', function () {
			let msg = new SpeechSynthesisUtterance();
			msg.text = tts;
			msg.volume = 1; // From 0 to 1
			msg.rate = 1; // From 0.1 to 10
			msg.pitch = 1; // From 0 to 2
			msg.lang = 'en-US';
			msg.onend = (ev) => {
				// reset last spoken text
				lastNotify = '';
			};
			window.speechSynthesis.speak(msg);
		});
		sounds.stop();
		sounds.play($remindersSettings.sound);
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<Alert />
<SvelteToast />

<div id="content-wrapper">
	<div id="content">
		<header>
			<img src="{base}/assets/heart.png" alt="logo" />
			<div class="line">
				<h1>GW2 Helper</h1>
				<small>v{data.version} - {eventsUtils.getHour($time)}</small>
			</div>
		</header>
		<Navigation items={navigation} {active} />

		<button> enable sounds </button>
		{#if currentPageVisible}
			<main>
				<slot />
			</main>
		{/if}

		<section>
			<details open={!tokenInfo.name}>
				<summary>API Settings</summary>
				<fieldset class="api-settings">
					<legend>API settings</legend>
					<p>
						In order to use this site you have to provide an API key for your account. API keys may be created or deleted at <a
							href="https://account.arena.net/applications">https://account.arena.net/applications.</a
						>.
					</p>
					<label for="api-key">Your API key:</label>
					<SearchInput
						name="api-key"
						id="api-key"
						class="apikey"
						placeholder="Paste your API key here"
						bind:value={apiKey}
						options={data.apiKeyHist}
					/>
					<button on:click={() => saveApiKey()}>Apply</button>
					<button on:click={() => deleteApiKey()}>Forget stored key</button>
					<button on:click={refresh}>Clear cache & reload</button>
					{#if tokenInfo.name}
						<p><em>Successfully loaded key "{tokenInfo.name}".</em></p>
					{/if}
					{#if tokenInfo.error}
						<p><em>{@html tokenInfo.error}</em></p>
					{/if}
				</fieldset>
			</details>
		</section>

		<BackToTop>
			<div class="waypoint" title="waypoint to top"></div>
		</BackToTop>
	</div>
	<footer>
		<p>
			This unofficial site includes art and other assets that are © 2015 ArenaNet, Inc. All rights reserved. All other trademarks are the property of
			their respective owners. This site uses also images and data from <a href="https://wiki.guildwars2.com/">Guild Wars 2 Wiki</a>
		</p>
		<p>
			© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire,
			Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or
			registered trademarks of NCSOFT Corporation.
		</p>
	</footer>
</div>

<AutoTooltip />

<style lang="scss" global>
	.line {
		display: flex;
		flex-flow: row nowrap;
		column-gap: 1em;
		align-items: baseline;
	}
	#api-key {
		margin: 0.4em 0;
	}
	em {
		color: var(--gw2helper-not-important);
	}
	header {
		margin: 0;
		background-color: #222;
		color: rgb(214, 211, 205);
		min-height: 3.375em;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		column-gap: 0.5em;
		h1 {
			margin: 0;
			text-wrap: nowrap;
		}
		img {
			margin-left: 0.625em;
			float: left;
			height: 2em;
		}
	}
	main {
		margin: 0 0.6em 1em 0.6em;
		display: flex;
		flex-flow: column nowrap;
		row-gap: 1em;
	}
	.waypoint {
		width: 4em;
		height: 4em;
		background: url(/gw2helper/assets/waypoint-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		&:hover {
			background-position-y: -4em;
		}
	}
	.autotooltip-wide {
		width: 18.75em;
	}

	#content-wrapper {
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		min-height: 100vh;
		gap: 0;
	}
	footer {
		background-color: var(--gw2helper-module-dark);
		font-size: smaller;
		padding: 0.3em 1em;
		width: 100%;
	}
</style>
