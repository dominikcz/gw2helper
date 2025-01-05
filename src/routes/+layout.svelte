<script>
	import '$lib/scss/gw2.scss';
	import { base } from '$app/paths';
	import { beforeNavigate, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';

	import languages from '$lib/locales/languages.json';
	import { t as _, locale } from '$lib/services/i18n.js';

	import BackToTop from '$lib/components/backToTop.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Reminders from '$lib/reminders';

	import { Howl } from 'howler';

	import utils from '$lib/utils.js';

	import Navigation from '$lib/components/navigation.svelte';
	import Alert from '$lib/components/alert/alert.svelte';
	import AutoTooltip from '$lib/components/autotooltip/autoTooltip.svelte';
	import { onMount } from 'svelte';

	import eventsUtils from '$lib/components/events/eventsUtils.js';
	import Clock from '$lib/services/clock.svelte';
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import LocaleSwitch from '$lib/components/localeSwitch.svelte';

	/** @type {{data: any, children?: import('svelte').Snippet}} */
	let { data, children } = $props();

	const defaultTitle = 'GW2 Helper';
	let apiKey = $state(data.apiKey);
	let reminders = new Reminders();
	let lastNotify = '';
	let confirmedNotify = '';
	let noAudio = 0;
	let apiLang = $state(data.apiLang);

	const apiLanguages = {
		en: 'English',
		fr: 'Français',
		de: 'Deutsch',
		es: 'Español',
		zh: '中国人',
	};

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




	onMount(async () => {
		checkIfAudioPlayable();
	});

	function checkIfAudioPlayable(dummmy) {
		let dummyAudio = new AudioContext();
		if (dummyAudio.state == 'suspended' && reminders.hasAny()) {
			noAudio = toast.push(
				$_('layout.no_audio'),
				{
					initial: 0,
				}
			);
		} else {
			toast.pop(noAudio);
		}
	}

	async function saveApiSettings() {
		if (data.apiService) {
			await data.apiService.init(apiKey, { apiLang });
			const _token = await data.apiService?.tokenInfo();
			if (_token.name) {
				await utils.saveApiKey(apiKey);
				await utils.saveApiLang(apiLang);
				invalidateAll();
			} else {
				tokenInfo.error = $_('layout.invalid_token');
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

	let time = new Clock({ interval: 10 * 1000 });

	function onTimeChange() {
		const inAdvance = data.remindersSettings.inAdvance;
		const list = reminders.activeAlarms(time.value, inAdvance);
		// const list = ['event 1', 'event 2']; // test
		if (list.length) {
			// we repeat alarm till it's active, unless confirmed by user (by closing associated toast message)
			playAlarm({
				time: eventsUtils.getHour(time.value),
				eventsList: list.join(', '),
				inAdvance,
				immediate: inAdvance == 0,
				plural: list.length > 1,
			});
		}
	}

	function hndNotificationTest(ev) {
		const sound = ev.detail.sound;
		sounds.stop();
		sounds.play(sound);
	}

	function playAlarm(info) {
		if (!info) return;
		// console.log('info', info)
		let tts = $_('events.tts', {...info})
		// ignoring request with the same text, as we were not able to speak previous one yet and excessive queuing doesn't help ;)
		if ([lastNotify, confirmedNotify].includes(tts)) return;
		lastNotify = tts;

		toast.push(tts, {
			duration: 1000 * (tts.length / 10),
			onpop: (id, details) => {
				// console.log('onpop', details);
				if (details.event != undefined) {
					// if closed by user
					console.log('notification disabled:', tts);
					confirmedNotify = tts;
				}
				toast.pop(noAudio);
			},
		});

		if (!sounds) return;

		// console.log('tts', { info, tts });
		sounds.off('end');
		sounds.on('end', function () {
			let msg = new SpeechSynthesisUtterance();
			msg.text = tts;
			msg.volume = 1; // From 0 to 1
			msg.rate = 1; // From 0.1 to 10
			msg.pitch = 1; // From 0 to 2
			msg.lang = $locale;
			msg.onend = (ev) => {
				// reset last spoken text
				lastNotify = '';
			};
			window.speechSynthesis.speak(msg);
		});
		sounds.stop();
		sounds.play(data.remindersSettings.sound);
	}
	let tokenInfo = $derived(data.tokenInfo);
	let active = $derived($page.url.pathname);
	let title = $derived([defaultTitle, active.replace(base, '').replaceAll('/', '')].filter(Boolean).join(' - '));
	let navigation = $derived([
		{ slug: `${base}/`, label: $_('layout.nav.home'), visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/daily/`, label: $_('layout.nav.daily'), visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/events/`, label: $_('layout.nav.events'), visible: true },
		{ slug: `${base}/items/`, label: $_('layout.nav.items'), visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/materials/`, label: $_('layout.nav.materials'), visible: tokenInfo.permissions.includes('inventories') },
		{ slug: `${base}/achievements/`, label: $_('layout.nav.achievements'), visible: tokenInfo.permissions.includes('progression') },
		{ slug: `${base}/account/`, label: $_('layout.nav.account'), visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/characters/`, label: $_('layout.nav.characters'), visible: tokenInfo.permissions.includes('characters') },
		{ slug: `${base}/guilds/`, label: $_('layout.nav.guilds'), visible: tokenInfo.permissions.includes('guilds') },
		{ slug: `${base}/trading-post/`, label: $_('layout.nav.trading-post'), visible: tokenInfo.permissions.includes('progression') },
	]);
	let currentPageVisible = $derived(devMode || navigation.find((x) => x.slug == active)?.visible || false);
	$effect(() => {
		onTimeChange();
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<svelte:window onnotification-test={hndNotificationTest} />

<Alert />
<SvelteToast />

<div id="content-wrapper">
	<div id="content">
		<header>
			<img src="{base}/assets/heart.png" alt="logo" />
			<div class="line">
				<h1>GW2 Helper</h1>
				<small>v{data.version} <LocaleSwitch {languages} bind:value={$locale} keysOnly={true} /></small>
			</div>
		</header>
		<Navigation items={navigation} {active} />

		{#if currentPageVisible}
			<main>
				{@render children?.()}
			</main>
		{/if}

		<section>
			<details open={!tokenInfo.name} class="secondary">
				<summary>{$_('layout.api_settings')}</summary>
				<fieldset class="api-settings">
					<legend>{$_('layout.api_settings')}</legend>
					<p>
						{@html $_('layout.api_key_required')}
					</p>
					<label for="api-key">{$_('layout.your_api_key')}</label>
					<SearchInput
						name="api-key"
						id="api-key"
						class="apikey"
						placeholder={$_('layout.paste_your_api_key_here')}
						bind:value={apiKey}
						options={data.apiKeyHist}
					/>
					<label for="api-lang">{$_('layout.api_language')}</label>
					<select name="api-lang" id="api-lang" bind:value={apiLang}>
						{#each Object.entries(apiLanguages) as [key, label]}
							<option value={key}>{label}</option>
						{/each}
					</select>
					<p>
						<button onclick={() => saveApiSettings()}>{$_('layout.apply')}</button>
						<button onclick={() => deleteApiKey()}>{$_('layout.forget_stored_key')}</button>
						<button onclick={refresh}>{$_('layout.clear_cache')}</button>
					</p>
					{#if tokenInfo.name}
						<p><em>{$_('layout.token_ok', {token: tokenInfo.name})}</em></p>
					{/if}
					{#if tokenInfo.error}
						<p><em>{@html tokenInfo.error}</em></p>
					{/if}
				</fieldset>
			</details>
		</section>

		<BackToTop>
			<div class="waypoint" title={$_('layout.waypoint_to_top')}></div>
		</BackToTop>
	</div>
	<footer>
		<p>{@html $_('layout.legal.unofficial_site')}</p>
		<p>{$_('layout.legal.copyright')}</p>
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

	:root {
		--toastContainerTop: auto;
		--toastContainerRight: auto;
		--toastContainerBottom: 1em;
		--toastContainerLeft: calc(50vw - 8rem);
	}
</style>
