<script>
	import GuildEmblem from '$lib/components/guildEmblem.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import { _ } from 'svelte-i18n';

	export let data;
</script>

<h1>{ $_('guilds.guilds') }</h1>
<Awaiter promise={data.guilds} let:result>
	{#each result as guild (guild.id)}
		<section class="guild-info masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
			<div class="guild-header">
				<GuildEmblem emblem={guild.emblem} background="#777" />
				<div class="guild-h">
					<h2>{guild.name} [{guild.tag}]</h2>
					<blockquote>{guild.motd ? `“${guild.motd}”` : ''}</blockquote>
				</div>
			</div>
			<div class="details">
				<span>{$_('guilds.level')}: <span class="big">{guild.level}</span></span>
				<span>{$_('guilds.members')}: <span class="big">{guild.member_count}/{guild.member_capacity}</span></span>
				<span>{$_('guilds.aetherium')}: <span class="big">{guild.aetherium}</span></span>
				<span>{$_('guilds.favor')}: <span class="big">{guild.favor}</span></span>
			</div>
		</section>
	{/each}
</Awaiter>

<style lang="scss">
	.big {
		font-size: 140%;
	}
	.guild-info {
		background-color: var(--gw2helper-module);
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
		max-width: 50em;
		padding: 1em;
	}
	.guild-header {
		background-color: var(--gw2helper-module);
		display: flex;
		flex-flow: column wrap;
		align-items: center;
		gap: 1em;
		:global(canvas) {
			align-self: flex-start;
		}
	}
	.guild-h {
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-evenly;
		align-items: center;
		blockquote {
			text-indent: 0;
			hanging-punctuation: first;
			font-style: italic;
			quotes: '“' '”' '‘' '’';
		}
	}
	.details {
		display: flex;
		flex-flow: column wrap;
		gap: 0.3em;
	}

	@media (min-width: 900px) {
		.details {
			height: 4em;
		}
		.guild-header {
			flex-flow: row nowrap;
			min-height: 8em;
			gap: 1em;
		}
		.guild-h {
			justify-content: space-evenly;
			align-items: flex-start;
		}
	}
</style>
