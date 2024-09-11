export async function load({ fetch, parent }) {
	return await parent();
}
