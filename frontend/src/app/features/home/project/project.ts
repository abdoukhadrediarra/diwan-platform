import { Component } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-project',
  imports: [TranslatePipe],
  templateUrl: './project.html',
  styleUrl: './project.scss',
})
export class Project {
  protected readonly offers = [
    { titleKey: 'project.offer1.title', textKey: 'project.offer1.text' },
    { titleKey: 'project.offer2.title', textKey: 'project.offer2.text' },
    { titleKey: 'project.offer3.title', textKey: 'project.offer3.text' },
    { titleKey: 'project.offer4.title', textKey: 'project.offer4.text' },
    { titleKey: 'project.offer5.title', textKey: 'project.offer5.text' },
  ];

  protected readonly steps = [
    { titleKey: 'project.step1.title', textKey: 'project.step1.text' },
    { titleKey: 'project.step2.title', textKey: 'project.step2.text' },
    { titleKey: 'project.step3.title', textKey: 'project.step3.text' },
    { titleKey: 'project.step4.title', textKey: 'project.step4.text' },
  ];
}
