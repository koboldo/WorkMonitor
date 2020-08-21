import { Directive } from '@angular/core';
import { AbstractControl, NG_VALIDATORS, Validator, ValidationErrors } from '@angular/forms';

@Directive({
  selector: '[projectFactorValidator]',
  providers: [
    {provide: NG_VALIDATORS, useExisting: ProjectFactorValidatorDirective, multi: true}
  ]
})
export class ProjectFactorValidatorDirective implements Validator {

  constructor() { }

  validate(control: AbstractControl): ValidationErrors | null {
    
    if (control.value >= 0.5 && control.value <= 1.5) {
      return null;
    } else {
      return { rateValidator: true };
    }
  }

}