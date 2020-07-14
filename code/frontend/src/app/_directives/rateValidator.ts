import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[rateValidator]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: RateValidatorDirective, multi: true}
  ]
})
export class RateValidatorDirective implements Validator {

  constructor() { }

  validate(control: AbstractControl): ValidationErrors | null {

    if (control.value <= 200) {
      return null;
    } else {
      return { rateValidator: true };
    }
  }

}