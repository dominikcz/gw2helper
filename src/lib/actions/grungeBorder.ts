export type BorderOptions = {
    grunge?: boolean;
    maskWidth?: number;
    minDiff?: number;
}

const DEF_OPTIONS: BorderOptions = {
    grunge: true, 
    maskWidth: 2000,
    minDiff: 123,
}

let lastVal = 0;

export function grungeBorder(elem: HTMLElement, options: BorderOptions = DEF_OPTIONS) {
    const merged: Required<BorderOptions> = { ...DEF_OPTIONS, ...options } as Required<BorderOptions>;
    let newVal = Math.trunc(Math.random() * merged.maskWidth);
    if (Math.abs(lastVal - newVal) < merged.minDiff){
        // make sure it is not too similar to previous one
        newVal = lastVal + merged.minDiff;
    }
    if (merged.grunge){
        elem.classList.add('grunge-border');
        elem.style.maskPosition = `${newVal}px bottom`;
    } else {
        elem.classList.remove('grunge-border');
        elem.style.maskPosition = '';
    }
    lastVal = newVal;
}
