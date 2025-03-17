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
            <button (click)="updateButton()" class="bg-primary mt-3 p-1 d-flex align-items-center justify-content-center" style="border-radius: 2rem !important; color: white !important; gap: 0.5rem; border: none;">
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
  @Input() homePage!: HomePage;

  constructor(private popoverController: PopoverController, private speseService: SpeseService) {}

  public closePopover() {
    this.popoverController.dismiss();
  }

  /* PER L'ALERT BUTTON */

  // BOTTONE MODIFICA
  public async updateButton() {
    // IMPOSTO L'ID DELLA SPESA DA MODIFICARE
    this.homePage.spesaUpdateid = this.spesa.id;
    // POPOLO IL FORM COI DATI DELLA SPESA DA MODIFICARE
    await this.popolaForm();
    this.homePage.isUpdateForm = true;
    this.homePage.setOpen(true);
    this.closePopover();
  }

  async popolaForm() {
    this.closePopover();
    if (!this.spesa) {
      console.error("Errore: this.spesa è undefined o null!");
      return;
    }
  
    let tipo = null;
    let importo = 0;
  
    if (this.spesa.entrata != null && (this.spesa.uscita == null || this.spesa.uscita == 0)) {
      tipo = "entrata";
      importo = this.spesa.entrata;
    } else if (this.spesa.uscita != null && (this.spesa.entrata == null || this.spesa.entrata == 0)) {
      tipo = "uscita";
      importo = this.spesa.uscita;
    }
  
    console.log("Popolamento form con:", {
      azione: this.spesa.azione,
      tipo: tipo,
      importo: importo,
      categoria: this.spesa.categoria || '',
    });
  
    if (!this.homePage.formAggModAzione) {
      console.error("Errore: formAggModAzione non è inizializzato!");
      return;
    }
    
    /*
    this.homePage.azioneControl.setValue(this.spesa.azione || '');
    this.homePage.tipoControl.setValue(tipo);
    this.homePage.importoControl.setValue(importo+"");
    this.homePage.categoriaControl.setValue(this.spesa.categoria || '');
    */
    
    // SETTA LA VISIBILITA' DELLA CATEGORIA SELEZIONATA
    this.homePage.onCategoryChange({nome: this.spesa.categoria})

    this.homePage.formAggModAzione.patchValue({
      azione: this.spesa.azione || '',
      tipo: tipo,
      importo: importo,
      categoria: this.spesa.categoria || '',
    });
  }

  // BOTTONE CANCELLA
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
