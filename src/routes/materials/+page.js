export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		materials: apiService.materials(),
	};
}
