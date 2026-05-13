<script lang="ts">
	import { asset } from '$app/paths';
	import { onMount } from 'svelte';
	import { toast } from '@zerodevx/svelte-toast';
	import { t as _ } from '$lib/services/i18n';
	import ShareMenu from '$lib/components/ui/shareMenu.svelte';

	interface Props {
		apiKey: string;
	}

	let { apiKey }: Props = $props();

	let showShareMenu = $state(false);
	let shareHeadline = $state('');
	let autoShareHeadline = '';
	let shareMenuWrapRef: HTMLElement | null = $state(null);

	function getShareUrl() {
		const keyToShare = String(apiKey || '').trim();
		const url = new URL(window.location.href);
		url.searchParams.set('key', keyToShare);
		return url.toString();
	}

	function getShareText() {
		const shareUrl = getShareUrl();
		return `${shareHeadline}\n${shareUrl}`;
	}

	function toggleShareMenu(event: MouseEvent) {
		event.stopPropagation();
		const keyToShare = String(apiKey || '').trim();
		if (!keyToShare) {
			toast.push($_('layout.share_link_missing_key'));
			return;
		}
		showShareMenu = !showShareMenu;
	}

	function closeShareMenu() {
		showShareMenu = false;
	}

	async function copyShareLink() {
		const keyToShare = String(apiKey || '').trim();
		if (!keyToShare) {
			toast.push($_('layout.share_link_missing_key'));
			return;
		}
		const shareUrl = getShareUrl();

		try {
			if (navigator.clipboard?.writeText) {
				await navigator.clipboard.writeText(getShareText());
				toast.push($_('layout.share_link_copied'));
				showShareMenu = false;
				return;
			}

			window.prompt($_('layout.share_page_prompt'), `${shareHeadline}\n${shareUrl}`);
			showShareMenu = false;
		} catch (error) {
			if ((error as { name?: string })?.name === 'AbortError') {
				return;
			}
			toast.push($_('layout.share_link_failed'));
		}
	}

	function shareHref(channel: 'mail' | 'whatsapp' | 'x' | 'facebook') {
		const shareUrl = encodeURIComponent(getShareUrl());
		const text = encodeURIComponent(getShareText());
		const subject = encodeURIComponent(shareHeadline);
		if (channel === 'mail') return `mailto:?subject=${subject}&body=${text}`;
		if (channel === 'whatsapp') return `https://wa.me/?text=${text}`;
		if (channel === 'x') return `https://x.com/intent/tweet?text=${encodeURIComponent(shareHeadline)}&url=${shareUrl}`;
		return `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
	}

	function openShareTarget(url: string) {
		window.open(url, '_blank', 'noopener,noreferrer');
		closeShareMenu();
	}

	async function shareInstagram() {
		await copyShareLink();
		window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
		toast.push($_('layout.share_instagram_hint'));
	}

	let shareOptions = $derived([
		{ id: 'copy', label: $_('layout.share_copy'), onClick: copyShareLink },
		{ id: 'mail', label: $_('layout.share_email'), onClick: () => openShareTarget(shareHref('mail')) },
		{
			id: 'whatsapp',
			label: $_('layout.share_whatsapp'),
			onClick: () => openShareTarget(shareHref('whatsapp')),
		},
		{ id: 'instagram', label: $_('layout.share_instagram'), onClick: shareInstagram },
		{ id: 'x', label: $_('layout.share_x'), onClick: () => openShareTarget(shareHref('x')) },
		{
			id: 'facebook',
			label: $_('layout.share_facebook'),
			onClick: () => openShareTarget(shareHref('facebook')),
		},
	]);

	$effect(() => {
		const localizedDefaultHeadline = $_('layout.share_headline_placeholder');
		if (!shareHeadline || shareHeadline === autoShareHeadline) {
			shareHeadline = localizedDefaultHeadline;
		}
		autoShareHeadline = localizedDefaultHeadline;
	});

	onMount(() => {
		const onOutsideClick = (event: Event) => {
			const target = event.target as Node | null;
			if (!target) return;
			if (shareMenuWrapRef?.contains(target)) return;
			showShareMenu = false;
		};
		window.addEventListener('pointerdown', onOutsideClick, { passive: true });
		return () => {
			window.removeEventListener('pointerdown', onOutsideClick);
		};
	});
</script>

<span class="share-menu-wrap" bind:this={shareMenuWrapRef}>
	<button
		type="button"
		class="share-page"
		onclick={toggleShareMenu}
		aria-label={$_('layout.share_this_page')}
		title={$_('layout.share_page_prompt')}
	>
		<span class="share-icon" aria-hidden="true" style={`--share-sprite: url(${asset('/assets/mail-sprite.png')})`}></span>
	</button>
	{#if showShareMenu}
		<ShareMenu
			bind:headline={shareHeadline}
			headlineLabel={$_('layout.share_headline_label')}
			headlinePlaceholder={$_('layout.share_headline_placeholder')}
			options={shareOptions}
		/>
	{/if}
</span>

<style lang="scss">
	.share-menu-wrap {
		position: relative;
		display: inline-flex;
	}

	.share-page {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.25em;
		margin-left: 0.2em;
		border: none;
		border-radius: 0.3em;
		background: transparent;
		color: #dfdec8;
		cursor: pointer;
		box-shadow: none;

		.share-icon {
            width: 29px;
            height: 28px;
			display: block;
			background-image: var(--share-sprite);
			background-repeat: no-repeat;
			background-position: 0 0;
		}

		&:hover {
			color: #cec7a5;
			background: transparent;
			opacity: 1;

			.share-icon {
				background-position: 0 -28px;
			}
		}
	}
</style>