<script>
	import GuildEmblem from '$lib/components/guildEmblem.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';

	export let data;
</script>

<h1>Guilds</h1>
<Awaiter promise={data.guilds} let:result>
	{#each result as guild (guild.id)}
		<section class="guild-info">
			<div class="guild-header">
				<GuildEmblem emblem={guild.emblem} background="#777" />
				<div class="guild-h">
					<h2>{guild.name} [{guild.tag}]</h2>
					<blockquote>{guild.motd ? `“${guild.motd}”` : ''}</blockquote>
				</div>
			</div>
			<div class="details">
				<span>level: <span class="big">{guild.level}</span></span>
				<span>members: <span class="big">{guild.member_count}/{guild.member_capacity}</span></span>
				<span>aetherium: <span class="big">{guild.aetherium}</span></span>
				<span>favor: <span class="big">{guild.favor}</span></span>
				<span>influence: <span class="big">{guild.influence}</span></span>
				<span>resonance: <span class="big">{guild.resonance}</span></span>
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
		gap: 1rem;
		max-width: 50em;
		padding: 1rem;
	}
	.guild-header {
		background-color: var(--gw2helper-module);
		display: flex;
		flex-flow: column wrap;
		align-items: center;
		gap: 1rem;
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
		gap: 0.3rem;
	}

	@media (min-width: 900px) {
		.details {
			height: 4rem;
		}
		.guild-header {
			flex-flow: row nowrap;
			min-height: 8em;
			gap: 1rem;
		}
		.guild-h {
			justify-content: space-evenly;
			align-items: flex-start;
		}
	}
</style>
