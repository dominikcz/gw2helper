export const ssr = false;

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		achievements: apiService.achievements(false),
	};
}
