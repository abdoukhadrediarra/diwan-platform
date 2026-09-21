import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 't',
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService);

  transform(key: string, fallback?: string): string {
    return this.lang.t(key, fallback);
  }
}
