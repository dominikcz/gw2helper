export type GW2HelperSettings = {
    currentSeason: string;
    wizardsVault: {
        seasonEnd: string;
    };
};

type ReadSettingsParams = {
    fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    currentSettings: GW2HelperSettings;
    isObject: (value: unknown) => boolean;
    addMonths: (value: Date, unit: string, amount: number) => Date;
    onWarn: (message: string, details?: unknown) => void;
    onError: (message: string, details?: unknown) => void;
};

export async function readAndNormalizeSettings(params: ReadSettingsParams): Promise<GW2HelperSettings> {
    const { fetchFunction, currentSettings, isObject, addMonths, onWarn, onError } = params;
    let settings: GW2HelperSettings = { ...currentSettings, wizardsVault: { ...currentSettings.wizardsVault } };

    const response = await fetchFunction('/gw2helper_settings.json').catch((error) => {
        onError('error loading settings', error);
        return undefined;
    });

    if (response?.ok) {
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const isJson = contentType.includes('application/json');

        if (!isJson) {
            onWarn('settings file missing or non-json response, using defaults', {
                status: response.status,
                url: response.url,
                contentType,
            });
        } else {
            try {
                const data = await response.json();
                if (isObject(data)) {
                    settings = Object.assign({}, settings, data);
                } else {
                    onWarn('invalid settings payload, using defaults', {
                        payloadType: typeof data,
                    });
                }
            } catch (error) {
                onWarn('could not parse settings json, using defaults', {
                    error: error instanceof Error ? error.message : String(error),
                    status: response.status,
                    url: response.url,
                });
            }
        }
    } else if (response) {
        onWarn('error loading settings', { status: response.status, url: response.url });
    }

    // Fallback: move season end in 3-month steps when stale.
    let seasonEnd: Date | undefined = new Date(settings.wizardsVault.seasonEnd);
    if (seasonEnd < new Date()) {
        while (seasonEnd && seasonEnd < new Date()) {
            seasonEnd = addMonths(seasonEnd, 'month', 3);
        }
        if (seasonEnd) {
            settings.wizardsVault.seasonEnd = seasonEnd.toISOString();
        }
    }

    return settings;
}
