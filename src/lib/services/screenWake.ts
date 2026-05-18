type WakeLockSentinelLike = {
    released?: boolean;
    release: () => Promise<void>;
    addEventListener?: (type: 'release', listener: () => void) => void;
};

type WakeLockApi = {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
};

type WakeLockNavigator = Navigator & {
    wakeLock?: WakeLockApi;
};

export default class ScreenWakeService {
    private enabled = false;
    private started = false;
    private sentinel?: WakeLockSentinelLike;

    private readonly onVisibilityChange = () => {
        this.sync();
    };

    start() {
        if (this.started || typeof document === 'undefined') {
            return;
        }
        document.addEventListener('visibilitychange', this.onVisibilityChange);
        this.started = true;
        this.sync();
    }

    async stop() {
        this.enabled = false;
        if (this.started && typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
            this.started = false;
        }
        await this.release();
    }

    async setEnabled(value: boolean) {
        this.enabled = value;
        await this.sync();
    }

    private async sync() {
        if (typeof document === 'undefined') {
            return;
        }

        if (!this.enabled || document.visibilityState !== 'visible') {
            await this.release();
            return;
        }

        const wakeLock = (navigator as WakeLockNavigator).wakeLock;
        if (!wakeLock || (this.sentinel && !this.sentinel.released)) {
            return;
        }

        try {
            this.sentinel = await wakeLock.request('screen');
            this.sentinel.addEventListener?.('release', () => {
                this.sentinel = undefined;
                if (this.enabled && document.visibilityState === 'visible') {
                    this.sync();
                }
            });
        } catch {
            // Unsupported browsers or transient permission errors should stay silent.
        }
    }

    private async release() {
        if (!this.sentinel) {
            return;
        }
        const current = this.sentinel;
        this.sentinel = undefined;
        try {
            await current.release();
        } catch {
            // Ignore release errors for already released or invalid sentinel.
        }
    }
}
