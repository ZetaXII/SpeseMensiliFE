import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule, PopoverController } from '@ionic/angular';
import { SpeseService } from '../services/spese.service';
import { HomePage, Mese } from './home.page';

@Component({
  selector: 'app-popover-content',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="text-center color-light">
        <div class="pt-2 pb-4 px-3 popoverButtons d-flex flex-column" style="border-radius: 1rem !important; overflow: hidden !important; background-color: var(--backgroundDarkColor3); padding: 10px;">
            <button class="bg-primary mt-3 p-1 d-flex align-items-center justify-content-center" style="border-radius: 2rem !important; color: white !important; gap: 0.5rem; border: none;">
                <ion-icon name="create-sharp"></ion-icon> 
                <span>Modifica</span>
            </button>

            <button id="elimina-alert" class="bg-primary mt-3 p-1 d-flex align-items-center justify-content-center" style="border-radius: 2rem !important; color: white !important; gap: 0.5rem; background: #DC3545 !important; border: none;">
                <ion-icon name="trash-sharp"></ion-icon> 
                <span>Elimina</span>
            </button>
            <ion-alert trigger="elimina-alert" class="custom-alert" header="Sei sicuro di voler eliminare questa azione?" [buttons]="deleteButton"></ion-alert>            
        </div>
    </ion-content>
  `,
})
export class PopoverContentComponent {
  @Input() spesa: any;
  @Input() mese!: Mese;

  constructor(private popoverController: PopoverController, private speseService: SpeseService, private homePage: HomePage) {}

  closePopover() {
    this.popoverController.dismiss();
  }

  /* PER L'ALERT BUTTON */
  public deleteButton = [
    {
      text: 'No',
      role: 'cancel',
      handler: () => {
        // Gestisci la chiusura dell'alert se necessario
      },
    },
    {
      text: 'Elimina',
      role: 'confirm',
      handler: async () => {
        try {
          await this.speseService.deleteAzione(this.spesa.id).toPromise();
          if (this.mese) {
            this.homePage.loadSpese(this.mese);
            this.homePage.loadTotali();
            this.closePopover();
          } else {
            console.error('Errore: mese non definito per questa spesa.');
          }
        } catch (error) {
          console.error('Errore durante la cancellazione dell\'azione:', error);
        }
      },
    },
  ];
  
  /**************************** */ 
}
