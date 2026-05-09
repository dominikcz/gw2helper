<script lang="ts">
	import { resolve } from '$app/paths';
	import helperUtils from '$lib/utils/helper-utils';
	import { getQueryStringFlag } from '$lib/utils';
	interface Props {
		item: object;
	}

	let { item }: Props = $props();
	const showApiLinks = getQueryStringFlag('show-api-links');

	function rarityClass() {
		return item.rarity ? `rarity rarity-${item.rarity.toLowerCase()}` : 'rarity';
	}
</script>

<figure class={rarityClass()}>
	{#if item.name}
		<span data-autotooltip-renderer="img.item" data-autotooltip-id={item.id} data-autotooltip-params={JSON.stringify({ count: item.count })}>
			<a href={helperUtils.wikiLink(item.name)} target="_blank">
				<img alt={item.name} src={item.icon} class:locked={item.locked} loading="lazy" decoding="async" fetchpriority="low" />
			</a>
		</span>
		{#if showApiLinks}<figcaption class="api-link"><a href={helperUtils.apiItemLink(item.id)} target="_blank">api</a></figcaption>{/if}
	{:else if showApiLinks}
		<a href={helperUtils.apiItemLink(item.id)} target="_blank">
			<img alt="invalid id: {item.id}" src={resolve('/assets/Talk_question_mark_option.png')} />
		</a>
		<figcaption class="api-link"><a href={helperUtils.apiItemLink(item.id)} target="_blank">api</a></figcaption>
	{:else}
		<img alt="invalid id: {item.id}" src={resolve('/assets/Talk_question_mark_option.png')} class="no-link" />
		<figcaption class="id-label">id: {item.id}</figcaption>
	{/if}
	{#if item.count > 1}<figcaption>{item.count}</figcaption>{/if}
</figure>

<style lang="scss">
	figure {
		width: 3.75em;
		height: 3.75em;
		outline-width: 0.1875em;
		outline-style: solid;
		position: relative;
		margin: 0;
		padding: 0;
		img {
			width: 3.75em;
			height: 3.75em;
			cursor: pointer;
			&.locked {
				filter: grayscale(100%) opacity(50%);
			}
			&.no-link {
				cursor: default;
			}
		}
		figcaption {
			position: absolute;
			top: 0;
			right: 0;
			color: #fff;
			background: rgba(0, 0, 0, 0.5);
			font-size: 80%;
			padding: 0 0.2em;
			&.api-link {
				left: 0;
				right: auto;
				a {
					color: #adf;
					text-decoration: none;
				}
			}
		}
	}
</style>
