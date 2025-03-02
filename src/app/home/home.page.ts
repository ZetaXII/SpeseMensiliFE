import { CommonModule } from '@angular/common';
import { Component, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import { IonButton, IonButtons, IonChip, IonContent, IonFab, IonFabButton, IonFooter, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonModal, IonSegment, IonSegmentButton, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, arrowDown, arrowUp, barChart, car, card, cart, chevronBack, chevronDown, chevronForward, chevronUp, createSharp, ellipsisVerticalSharp, fastFood, helpCircle, medical, settings, shirt, trashSharp } from 'ionicons/icons';
import { Spesa, SpeseService, Totali } from '../services/spese.service';
import { PopoverContentComponent } from './popover-content.component';

export interface Mese {
  nomeMese: string;
  numeroMese: number;
  anno: number;
  isOpen: boolean;
  spese: Spesa[] | null;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  
  imports: [
    IonTitle,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonChip,
    IonSegment,
    IonSegmentButton,
    CommonModule,
    FormsModule,
    IonButton,
    IonButtons,
    IonHeader,
    IonModal,
    IonToolbar,
    IonFab, 
    IonFabButton,
    ReactiveFormsModule,
  ],
  providers: [PopoverController, ModalController],
})

export class HomePage {
  meseList: Mese[] = [];
  totali: Totali = { totaleEntrate: 0, totaleUscite: 0, saldo: 0 };
  thisYear = new Date().getFullYear();
  currentYear = this.thisYear;
  meseSelezionato: string = '';
  isModalOpen = false;
  formAggiungi: FormGroup;
  tipoEntrata = true; // true per entrata, false per uscita

  categorie = [
    { nome: "Auto", colore: "#1F77B4", icona: "car" }, // Blu brillante
    { nome: "Acquisti Online", colore: "#BA68C8", icona: "cart" }, // Giallo brillante    
    { nome: "Cibo", colore: "#F39C12", icona: "fast-food" }, // Rosso brillante
    { nome: "Vestiti", colore: "#FF5733", icona: "shirt" }, // Azzurro brillante
    { nome: "Altro", colore: "#28B463", icona: "medical" }, // Verde brillante
  ];

  constructor(private speseService: SpeseService, private popoverController: PopoverController, private fb: FormBuilder, modalController: ModalController) {
    addIcons({ card, chevronDown, chevronUp, chevronBack, chevronForward, fastFood, car, medical, cart, shirt, helpCircle, add, barChart, settings, arrowUp, arrowDown, trashSharp, createSharp, ellipsisVerticalSharp });
    
    /* FORM AGGIUNTA SPESA */
    this.formAggiungi = this.fb.group({
      azione: ['', Validators.required],
      tipo: ['', Validators.required],      
      importo: ['', [Validators.required, Validators.min(0)]],
      categoria: [''],
    });
  } 

  /* PER APRIRE IL PANNELLO DI AGGIUNTA */
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    this.formAggiungi.reset();
  }

  // Funzione per aprire il form di tipo entrata
  toggleTipo() {
    this.tipoEntrata = !this.tipoEntrata;
    this.formAggiungi.get('tipo')?.setValue(this.tipoEntrata ? 'entrata' : 'uscita');
  }

  // Funzione per gestire l'invio del form
  submitForm() {
    if (this.formAggiungi.valid) {
      const formValue = this.formAggiungi.value;
      
      // Crea un oggetto per il body con i campi richiesti
      const spesa: any = {
        azione: formValue.azione,
        categoria: formValue.categoria, // Impostato ad "Altro"
        entrata: formValue.tipo === 'entrata' ? formValue.importo : null,
        uscita: formValue.tipo === 'uscita' ? formValue.importo : null,
      };
      
      console.log(spesa); // Stampa l'oggetto spesa generato per il debug
  
      // Passa il body al servizio per creare l'azione
      this.speseService.createAzione(spesa).subscribe(
        (response: any) => {
          console.log('Spesa aggiunta con successo:', response);
          this.ngOnInit();
          this.setOpen(false); // Chiude il modal dopo aver inviato i dati e resetta il form
        },
        (error: any) => {
          console.error('Errore durante l\'aggiunta della spesa:', error);
        }
      );
    }
  }
  

  selectedCategory: string | null = null;

  onCategoryChange(categoria: any) {
    this.selectedCategory = categoria.nome;
  }  
  /**************************** */
  
  // Funzione per trovare la categoria corrispondente
  getCategoriaInfo(nomeCategoria: string) {
    return this.categorie.find(c => c.nome === nomeCategoria) || { colore: "#CCCCCC", icona: "help-circle" };
  } 

  ngOnInit() {
    this.loadTotali();
    this.initializeMesi(this.currentYear);
    this.setMeseCorrente();
  }

  async setMeseCorrente() {
    const today = new Date();
    const meseCorrente = today.getMonth() + 1;
    const annoCorrente = today.getFullYear();
    this.meseSelezionato = `${meseCorrente}-${annoCorrente}`;
  
    const mese = this.meseList.find(m => m.numeroMese === meseCorrente && m.anno === annoCorrente);
    if (mese) {
      try {
        await this.loadSpese(mese);  // Carica le spese del mese corrente in modo asincrono
      } catch (error) {
        console.error('Errore nel caricare le spese del mese corrente:', error);
      }
    }
  }  

  selezionaMese(event: any) {
    this.meseSelezionato = event.detail.value;
  }

  calcolaTotaleEntrate(spese: Spesa[] | null): number {
    return spese ? spese.reduce((acc, spesa) => acc + (spesa.entrata || 0), 0) : 0;
  }

  calcolaTotaleUscite(spese: Spesa[] | null): number {
    return spese ? spese.reduce((acc, spesa) => acc + (spesa.uscita || 0), 0) : 0;
  }

  loadTotali() {
    this.speseService.getTotali().subscribe(
      (totali) => this.totali = totali,
      (error) => console.error('Errore nel recupero dei totali:', error)
    );
  }

  changeAnno(nextPrev: number) {
    this.currentYear += nextPrev;
    this.initializeMesi(this.currentYear);
    this.setMeseCorrente();
  }

  async initializeMesi(anno: number) {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
  
    this.meseList = months.map((nomeMese, index) => ({
      nomeMese,
      numeroMese: index + 1,
      anno,
      isOpen: false,
      spese: null,
    }));
  
    // Carica le spese per ogni mese in modo asincrono
    for (const mese of this.meseList) {
      try {
        await this.loadSpese(mese);  // Aggiungi qui il controllo per l'asincronia
      } catch (error) {
        console.error(`Errore nel caricare le spese per ${mese.nomeMese}:`, error);
      }
    }
  }  

  loadSpese(mese: Mese) {
    this.speseService.getAzioniByMeseAnno(mese.numeroMese, mese.anno).subscribe(
      (spese) => mese.spese = spese.length ? spese.sort((a, b) => b.numeroGiorno - a.numeroGiorno) : null,
      (error) => {
        console.error('Errore nel recupero delle spese:', error);
        mese.spese = null;
      }
    );
  }

  toggleMese(mese: Mese) {
    mese.isOpen = !mese.isOpen;
  }

  /* PER I POPOVER */
  async openPopover(ev: Event, spesa: any) {
    const mese = this.meseList.find(m => m.numeroMese === Number(spesa.mese) && m.anno === spesa.anno);
    if (!mese) return; // Non aprire il popover se il mese non esiste
    const popover = await this.popoverController.create({
      component: PopoverContentComponent,
      event: ev,
      translucent: true,
      componentProps: { spesa, mese },
    });
  
    await popover.present();
  }
  /******************************** */   
}
