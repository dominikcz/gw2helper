export type BorderOptions = {
    grunge: boolean;
    maskWidth: number;
    minDiff: number;
}

const DEF_OPTIONS: BorderOptions = {
    grunge: true, 
    maskWidth: 2000,
    minDiff: 123,
}

let lastVal = 0;

export function grungeBorder(elem: HTMLElement, options: BorderOptions = DEF_OPTIONS) {
    let newVal = Math.trunc(Math.random() * options.maskWidth);
    if (Math.abs(lastVal - newVal) < options.minDiff){
        // make sure it is not too similar to previous one
        newVal = lastVal + options.minDiff;
    }
    if (options.grunge){
        elem.classList.add('grunge-border');
        elem.style.maskPosition = `${newVal}px bottom`;
    } else {
        elem.classList.remove('grunge-border');
        elem.style.maskPosition = '';
    }
    lastVal = newVal;
}
