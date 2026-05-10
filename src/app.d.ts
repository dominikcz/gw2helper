// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	interface Window {
		__autotooltip?: {
			customRenderers: Record<string, (container: HTMLElement, id: string | null, params: unknown) => unknown>;
		};
	}

	interface Date {
		wxUseTimeOffset: boolean;
		wxToLocaleISOString(): string;
		wxToLocaleISOStringClean(): string;
		wxToLocaleTimeString(): string;
		wxToFriendlyText(): string;
		wxTomorrow(utc: boolean, atHour: number | null, atMinute: number | null, atSecond: number | null): Date;
		wxYesterday(utc: boolean, atHour: number | null, atMinute: number | null, atSecond: number | null): Date;
		wxToday(utc: boolean, atHour: number | null, atMinute: number | null, atSecond: number | null): Date;
		wxNextWeekDay(weekDay: number, utc: boolean, atHour: number | null, atMinute: number | null, atSecond: number | null): Date;
		wxNextQuarterOfYear(utc: boolean, atHour: number | null, atMinute: number | null, atSecond: number | null): Date;
		wxGetPeriodBegin(interval: string, units: number): Date;
		wxGetPeriodEnd(interval: string, units: number): Date;
		wxGetQuarterBegin(): Date;
		wxGetQuarterEnd(): Date;
		wxGetNextQuarter(): Date;
		wxEquals(d: Date): boolean;
		wxClone(): Date;
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};
