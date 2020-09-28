/**
 * @Pipe
 * @description pipe to format numeric values to argentina readable currency values
 * @input number
 * @output formatted numeric value
 * Source -> https://stackoverflow.com/questions/49174571/display-number-value-with-comma-instead-of-dot-in-p-column-in-angular?noredirect=1&lq=1
 */

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ 
    name: 'numberFormat'
 })
export class NumberFormatPipe implements PipeTransform {
    transform(value: any): number {
        return this.localeString(value);
    }

    missingOneDecimalCheck(nStr) {
        nStr += '';
        const x = nStr.split(',')[1];
        if (x && x.length === 1) return true;   
        return false;
    }

    missingAllDecimalsCheck(nStr) {
        nStr += '';
        const x = nStr.split(',')[1];
        if (!x) return true;    
        return false;
    }

    localeString(nStr) {
        if (nStr === '') return ''; 
        let x, x1, x2, rgx, y1, y2;
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? ',' + x[1] : '';
        rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + '.' + '$2');
        }

        /** If value was inputed by user, it could have many decimals(up to 7)
            so we need to reformat previous x1 results */
        if (x1.indexOf(',') !== -1) {
            y1 = x1.slice(x1.lastIndexOf(',')).replace(/\./g, '');

            y2 = x1.split(',');
            x = y2[0] +  y1;
        } else {
            x = x1 + x2;
            if (this.missingOneDecimalCheck(x)) return x += '0';
            if (this.missingAllDecimalsCheck(x)) return x += ',00';
        }

        return x;
    }
}