export const ssr = false;

export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		current: key ? apiService.transactionsCurrent() : [],
		delivery: key ? apiService.delivery() : [],
	};
}