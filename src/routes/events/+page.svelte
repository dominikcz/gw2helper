<script>
	import EventTimers from "$lib/components/eventTimers.svelte";
	import { eventData } from "./metas";
</script>

<EventTimers wikiData={eventData} />

<pre>
    {JSON.stringify(eventData, null, 4)}
</pre>

