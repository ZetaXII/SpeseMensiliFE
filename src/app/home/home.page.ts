import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Inject,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ModalController } from '@ionic/angular';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ToastController,
  IonRefresher,  
  RefresherEventDetail,
  IonRefresherContent,
  IonAlert
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  add,
  arrowDown,
  arrowDownOutline,
  arrowUp,
  barChart,
  car,
  card,
  cart,
  checkmarkCircle,
  chevronBack,
  chevronDown,
  chevronForward,
  chevronUp,
  closeCircle,
  createSharp,
  ellipsisVerticalSharp,
  fastFood,
  helpCircle,
  medical,
  search,
  settings,
  settingsSharp,
  shirt,
  trashSharp,
} from 'ionicons/icons';
import { Spesa, SpeseService, Totali } from '../services/spese.service';

export interface Mese {
  nomeMese: string;
  numeroMese: number;
  anno: number;
  isOpen: boolean;
  spese: Spesa[] | null;
  speseTotaleMese: number;
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
    IonLoading,
    IonRefresher,
    IonRefresherContent,
    IonAlert
  ],
  providers: [ModalController],
})
export class HomePage {
  // PER I DATI IN LOCAL STORAGE
  nomeUtente: string | null = localStorage.getItem('nomeUtente');
  temaUtente: string | null = localStorage.getItem('temaUtente');
  localStorageDataNotFound: boolean = false;
  // PER LE AZIONI
  meseList: Mese[] = [];
  totali: Totali = { totaleEntrate: 0, totaleUscite: 0, saldo: 0 };
  thisYear = new Date().getFullYear();
  currentYear = this.thisYear;
  meseSelezionato: string = '';
  // PER IL FORM DI AGGIUNTA/MODIFICA
  isModalOpen = false;
  formAggModAzione: FormGroup;
  tipoEntrata = true; // true per entrata, false per uscita
  isUpdateForm = false; // se true => modifica il form di aggiunta azione in un form di modifica
  spesaUpdateid = -1; // imposta l'id dell'azione da modificare al momento
  // PER INIZIALIZZARE I VALORI (SOLO VISUALI) NEI CAMPI DEL FORM
  azioneControl = new FormControl('', Validators.required);
  tipoControl = new FormControl('', Validators.required);
  importoControl = new FormControl('', Validators.required);
  categoriaControl = new FormControl('', Validators.required);
  // PER LO SPINNER DEL CARICAMENTO
  isLoading: boolean = false;

  categorie = [
    { nome: 'Auto', colore: '#1F77B4', icona: 'car' }, // Blu brillante
    { nome: 'Acquisti Online', colore: '#BA68C8', icona: 'cart' }, // Giallo brillante
    { nome: 'Cibo', colore: '#F39C12', icona: 'fast-food' }, // Rosso brillante
    { nome: 'Vestiti', colore: '#FF5733', icona: 'shirt' }, // Azzurro brillante
    { nome: 'Altro', colore: '#28B463', icona: 'medical' }, // Verde brillante
  ];

  constructor(
    private speseService: SpeseService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    addIcons({
      card,
      chevronDown,
      chevronUp,
      chevronBack,
      chevronForward,
      fastFood,
      car,
      medical,
      cart,
      shirt,
      helpCircle,
      add,
      barChart,
      settings,
      arrowUp,
      arrowDown,
      trashSharp,
      createSharp,
      ellipsisVerticalSharp,
      search,
      settingsSharp,
      closeCircle,
      checkmarkCircle,
      arrowDownOutline
    });

    /* FORM AGGIUNTA/MODIFICA SPESA */
    this.formAggModAzione = this.fb.group({
      azione: this.azioneControl,
      tipo: this.tipoControl,
      importo: this.importoControl,
      categoria: this.categoriaControl,
    });

    /* FORM RICERCA SPESE */
    this.formRicercaSpese = this.fb.group({
      azione: this.azioneSearchControl,
      categoria: this.categoriaSearchControl,
      nomeGiorno: this.nomeGiornoSearchControl,
      numeroGiorno: this.numeroGiornoSearchControl,
      importo: this.importoSearchControl,
      mese: this.meseSearchControl,
      anno: this.annoSearchControl,
    });

    /* FORM IMPOSTAZIONI */
    this.formSettings = this.fb.group({
      nomeUtente: this.nomeUtenteControl,
      temaUtente: this.temaUtenteControl,
    });
  }

  ngOnInit() {
    this.isLoading = true; // Mostra il loader
    setTimeout(() => {
      this.loadLocalStorageData();
      this.isUpdateForm = false;
      this.loadTotali();
      this.initializeMesi(this.currentYear);
      this.setMeseCorrente();
      this.anniSearch = Array.from(
        { length: this.currentYear - 2023 },
        (_, i) => 2024 + i
      );
      this.isLoading = false; // Nasconde il loader dopo 3 secondi
    }, 500);
  }

  /* PER CARICARE I DATI DELLA CACHE */
  loadLocalStorageData() {
    this.nomeUtente = localStorage.getItem('nomeUtente') || 'Utente';
    this.temaUtente = localStorage.getItem('temaUtente') || '';
    if (
      !this.nomeUtente ||
      (this.nomeUtente === '' && !this.temaUtente) ||
      this.temaUtente === ''
    ) {
      this.localStorageDataNotFound = true;
      this.openSettingsModal();
    } else {
      this.localStorageDataNotFound = false;
      this.cambiaTema(this.temaUtente);
    }
  }

  /* PER APRIRE IL PANNELLO DEL FORM DI AGGIUNTA o MODIFICA */
  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
    if (isOpen == false) {
      this.azioneControl.setValue('');
      this.tipoControl.setValue('');
      this.importoControl.setValue(null);
      this.categoriaControl.setValue('');
      this.selectedCategory = null;
      this.formAggModAzione.reset();
    }
  }

  // Funzione per aprire il form di tipo entrata
  toggleTipo() {
    this.tipoEntrata = !this.tipoEntrata;
    this.formAggModAzione
      .get('tipo')
      ?.setValue(this.tipoEntrata ? 'entrata' : 'uscita');
  }

  // Funzione per gestire l'invio del form
  submitForm() {
    if (this.formAggModAzione.valid) {
      // Crea un oggetto per il body con i campi richiesti
      const spesa: any = {
        azione: this.azioneControl.value,
        categoria: this.categoriaControl.value, // Impostato ad "Altro"
        entrata:
          this.tipoControl.value === 'entrata'
            ? this.importoControl.value
            : null,
        uscita:
          this.tipoControl.value === 'uscita'
            ? this.importoControl.value
            : null,
      };
      // Se isUpdateForm è false => esegue l'aggiunta
      if (this.isUpdateForm == false) {
        this.speseService.createAzione(spesa).subscribe(
          (response: any) => {
            this.presentToast('Spesa aggiunta con successo!');
            console.log('Spesa aggiunta con successo:', response);
            this.ngOnInit();
          },
          (error: any) => {
            this.presentToast("Errore durante l'aggiunta della spesa!");
            console.error("Errore durante l'aggiunta della spesa:", error);
          }
        );
      }
      // Se isUpdateForm è true => esegue la modifica
      else if (this.isUpdateForm == true) {
        this.speseService.updateAzione(this.spesaUpdateid, spesa).subscribe(
          (response: any) => {
            this.presentToast('Spesa modificata con successo!');
            console.log(
              'Spesa con id ${spesa.id} modificata con successo:',
              response
            );
            this.ngOnInit();
          },
          (error: any) => {
            this.presentToast('Errore durante la modifica della spesa!');
            console.error(
              'Errore durante la modifica della spesa con id ${spesa.id}:',
              error
            );
          }
        );
      }
    }
    this.setOpen(false); // Chiude il modal dopo aver inviato i dati e resetta il form
  }

  selectedCategory: string | null = null;

  onCategoryChange(categoria: any) {
    this.selectedCategory = categoria.nome;
  }
  /**************************** */

  // Funzione per trovare la categoria corrispondente
  getCategoriaInfo(nomeCategoria: string) {
    return (
      this.categorie.find((c) => c.nome === nomeCategoria) || {
        colore: '#CCCCCC',
        icona: 'help-circle',
      }
    );
  }

  async setMeseCorrente() {
    const today = new Date();
    const meseCorrente = today.getMonth() + 1;
    const annoCorrente = today.getFullYear();
    this.meseSelezionato = `${meseCorrente}-${annoCorrente}`;

    const mese = this.meseList.find(
      (m) => m.numeroMese === meseCorrente && m.anno === annoCorrente
    );
    if (mese) {
      try {
        await this.loadSpese(mese); // Carica le spese del mese corrente in modo asincrono
      } catch (error) {
        console.error('Errore nel caricare le spese del mese corrente:', error);
      }
    }
  }

  selezionaMese(event: any) {
    this.meseSelezionato = event.detail.value;
  }

  calcolaTotaleEntrate(spese: Spesa[] | null): number {
    return spese
      ? spese.reduce((acc, spesa) => acc + (spesa.entrata || 0), 0)
      : 0;
  }

  calcolaTotaleUscite(spese: Spesa[] | null): number {
    return spese
      ? spese.reduce((acc, spesa) => acc + (spesa.uscita || 0), 0)
      : 0;
  }

  loadTotali() {
    this.speseService.getTotali().subscribe(
      (totali) => (this.totali = totali),
      (error) => console.error('Errore nel recupero dei totali:', error)
    );
  }

  changeAnno(nextPrev: number) {
    this.isLoading = true; // Mostra il loader

    setTimeout(() => {
      this.currentYear += nextPrev;
      this.initializeMesi(this.currentYear);
      this.setMeseCorrente();

      this.isLoading = false; // Nasconde il loader dopo 3 secondi
    }, 180);
  }

  async initializeMesi(anno: number) {
    const months = [
      'Gennaio',
      'Febbraio',
      'Marzo',
      'Aprile',
      'Maggio',
      'Giugno',
      'Luglio',
      'Agosto',
      'Settembre',
      'Ottobre',
      'Novembre',
      'Dicembre',
    ];

    this.meseList = months.map((nomeMese, index) => ({
      nomeMese,
      numeroMese: index + 1,
      anno,
      isOpen: false,
      spese: null,
      speseTotaleMese: 0,
    }));

    // Carica le spese per ogni mese in modo asincrono
    for (const mese of this.meseList) {
      try {
        await this.loadSpese(mese); // Aggiungi qui il controllo per l'asincronia
      } catch (error) {
        console.error(
          `Errore nel caricare le spese per ${mese.nomeMese}:`,
          error
        );
      }
    }
  }

  loadSpese(mese: Mese) {
    this.speseService.getAzioniByMeseAnno(mese.numeroMese, mese.anno).subscribe(
      (spese) => {
        if (spese.length) {
          mese.spese = spese.sort((a, b) => b.numeroGiorno - a.numeroGiorno);

          // Calcolo del totale mese
          mese.speseTotaleMese = spese.reduce(
            (totale, spesa) =>
              totale + (spesa.entrata || 0) - (spesa.uscita || 0),
            0
          );
          //console.log(mese.speseTotaleMese);
        } else {
          mese.spese = null;
          mese.speseTotaleMese = 0;
        }
      },
      (error) => {
        console.error('Errore nel recupero delle spese:', error);
        mese.spese = null;
        mese.speseTotaleMese = 0;
      }
    );
  }

  toggleMese(mese: Mese) {
    mese.isOpen = !mese.isOpen;
  }

  // ########### FORM SEARCH SPESA ####################
  isModalSearchOpen: boolean = false;
  // ARRAY CHE CONTIENE LE SPESE TROVATE NEL SEARCH
  speseSearchResult: any[] = [];
  // PER RIEMPIRE IL SELECT DEI GIORNI NEL SEARCH
  giorniSearch: number[] = Array.from({ length: 31 }, (_, i) => i + 1);
  // PER RIEMPIRE IL SELECT DEI MESI NEL SEARCH
  mesiSearch = [
    { valore: 1, nome: 'Gennaio' },
    { valore: 2, nome: 'Febbraio' },
    { valore: 3, nome: 'Marzo' },
    { valore: 4, nome: 'Aprile' },
    { valore: 5, nome: 'Maggio' },
    { valore: 6, nome: 'Giugno' },
    { valore: 7, nome: 'Luglio' },
    { valore: 8, nome: 'Agosto' },
    { valore: 9, nome: 'Settembre' },
    { valore: 10, nome: 'Ottobre' },
    { valore: 11, nome: 'Novembre' },
    { valore: 12, nome: 'Dicembre' },
  ];
  // PER RIEMPIRE IL SELECT DELL'ANNO
  anniSearch: number[] = [];
  formRicercaSpese: FormGroup;
  azioneSearchControl = new FormControl('');
  categoriaSearchControl = new FormControl('');
  nomeGiornoSearchControl = new FormControl('');
  numeroGiornoSearchControl = new FormControl('');
  importoSearchControl = new FormControl('');
  meseSearchControl = new FormControl('');
  annoSearchControl = new FormControl('');

  getNomeMese(mese: string): string {
    const meseNumero = parseInt(mese, 10); // Converte la stringa in numero
    const meseObj = this.mesiSearch.find((m) => m.valore === meseNumero);
    const nomeMese = meseObj ? meseObj.nome : '';
    return nomeMese ? nomeMese.substring(0, 3).toUpperCase() : ''; // Restituisce i primi 3 caratteri in maiuscolo
  }

  openSearchModal() {
    this.isModalSearchOpen = true;
  }

  closeSearchModal() {
    this.isModalSearchOpen = false;
    this.resetSearch();
  }

  resetSearch() {
    this.formRicercaSpese.reset();
    this.speseSearchResult = [];
  }

  submitSearch() {
    if (this.formRicercaSpese.valid) {
      this.isLoading = true; // Mostra il loader

      const searchData = this.formRicercaSpese.value;
      console.log('Dati ricerca:', searchData);

      const spesa: any = {
        azione: this.azioneSearchControl.value || null,
        categoria: this.categoriaSearchControl.value || null,
        nomeGiorno: this.nomeGiornoSearchControl.value || null,
        numeroGiorno: this.numeroGiornoSearchControl.value || null,
        mese: this.meseSearchControl.value || null,
        anno: this.annoSearchControl.value || null,
        entrata:
          this.importoSearchControl.value &&
          !isNaN(+this.importoSearchControl.value) &&
          +this.importoSearchControl.value >= 0
            ? +this.importoSearchControl.value
            : null,
        uscita:
          this.importoSearchControl.value &&
          !isNaN(+this.importoSearchControl.value) &&
          +this.importoSearchControl.value < 0
            ? Math.abs(+this.importoSearchControl.value)
            : null,
      };

      console.log(JSON.stringify(spesa, null, 2));

      this.speseService.searchByFilter(spesa).subscribe(
        (spese) => {
          this.speseSearchResult = spese.reverse();
          console.log('Spese trovate:', this.speseSearchResult);
          this.isLoading = false; // Nasconde il loader
        },
        (error) => {
          console.error('Errore nel recupero delle spese:', error);
          this.isLoading = false; // Nasconde il loader anche in caso di errore
        }
      );
    }
  }
  // ##########################################################################

  // ########### FORM IMPOSTAZIONI ####################
  isModalSettingOpen: boolean = false;
  formSettings: FormGroup;
  nomeUtenteControl = new FormControl(this.nomeUtente || '');
  temaUtenteControl = new FormControl(this.temaUtente || '');

  openSettingsModal() {
    this.isModalSettingOpen = true;
  }

  closeSettingsModal() {
    this.isModalSettingOpen = false;
  }

  submitSettings() {
    if (this.formSettings.valid) {
      const impostazioniData = this.formSettings.value;

      const impostazioniUtente: any = {
        nomeUtente: impostazioniData.nomeUtente || null,
        temaUtente: impostazioniData.temaUtente || null,
      };
      // Salva i dati nel localStorage
      localStorage.setItem('nomeUtente', impostazioniUtente.nomeUtente);
      localStorage.setItem('temaUtente', impostazioniUtente.temaUtente);

      // Cambia il tema dell'app
      this.cambiaTema(impostazioniUtente.temaUtente);

      this.presentToast('Dati salvati correttamente!');
      console.log('Dati salvati:', JSON.stringify(impostazioniUtente, null, 2));
      this.closeSettingsModal();
      this.ngOnInit();
    } else {
      this.presentToast('Si è verificato un errore, inserisci tutti i dati!');
    }
  }

  // ##########################################################################

  // ########### NOTIFICA TOAST ####################
  // Funzione per creare il toast dinamicamente con messaggio
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message, // Messaggio dinamico
      position: 'top', // Posizione in cima alla pagina
      duration: 3000, // Durata del toast
      // Determina l'icona e il colore in base al messaggio
      icon: message.includes('errore') ? 'close-circle' : 'checkmark-circle',
      color: message.includes('errore') ? 'danger' : 'success',
      cssClass: 'custom-toast',
      buttons: [
        {
          side: 'start',
          icon: 'close', // Icona per chiudere il toast
          handler: () => {
            toast.dismiss();
          },
        },
      ],
      swipeGesture: 'vertical', // Chiude il Toast con uno swipe a su o giù
    });
    await toast.present();
  }
  // ##########################################################################

  // ######### CAMBIA IL TEMA #############################
  temiDisponibili = ['verde', 'militare', 'lilla', 'azzurlilla', 'fashion'];

  cambiaTema(tema: string) {
    // Rimuove tutti i temi prima di applicare il nuovo
    this.temiDisponibili.forEach((t) =>
      this.renderer.removeClass(this.document.body, `${t}-theme`)
    );

    // Aggiunge il nuovo tema selezionato
    if (this.temiDisponibili.includes(tema.toLowerCase())) {
      this.renderer.addClass(this.document.body, `${tema.toLowerCase()}-theme`);
    }
  }

  // ###################### PER IL MODAL DELLE AZIONI (MODIFICA ed ELIMINA) ####################################################
  isModalAzioniOpen: boolean = false;
  selectedSpesa: any;

  // Funzione per aprire il modale e passarci la spesa selezionata
  openModalAzioni(spesa: any) {
    this.selectedSpesa = spesa;
    this.isModalAzioniOpen = true;
  }

  // Funzione per chiudere il modale
  closeModalAzioni() {
    this.isModalAzioniOpen = false;
    this.cdr.detectChanges(); // Forza il refresh dell'interfaccia
  }

  // Funzione per gestire l'azione di modifica
  public async updateButton() {
    // IMPOSTO L'ID DELLA SPESA DA MODIFICARE
    this.spesaUpdateid = this.selectedSpesa.id;
    // POPOLO IL FORM COI DATI DELLA SPESA DA MODIFICARE
    await this.popolaForm();
    this.isUpdateForm = true;
    this.setOpen(true);
    this.closeModalAzioni();
  }

  // Funzione per popolare il form con i dati della spesa da modificare
  async popolaForm() {
    this.closeModalAzioni();
    if (!this.selectedSpesa) {
      console.error('Errore: selectedSpesa è undefined o null!');
      return;
    }

    let tipo = null;
    let importo = 0;

    if (
      this.selectedSpesa.entrata != null &&
      (this.selectedSpesa.uscita == null || this.selectedSpesa.uscita == 0)
    ) {
      tipo = 'entrata';
      importo = this.selectedSpesa.entrata;
    } else if (
      this.selectedSpesa.uscita != null &&
      (this.selectedSpesa.entrata == null || this.selectedSpesa.entrata == 0)
    ) {
      tipo = 'uscita';
      importo = this.selectedSpesa.uscita;
    }

    console.log('Popolamento form con:', {
      azione: this.selectedSpesa.azione,
      tipo: tipo,
      importo: importo,
      categoria: this.selectedSpesa.categoria || '',
    });

    if (!this.formAggModAzione) {
      console.error('Errore: formAggModAzione non è inizializzato!');
      return;
    }

    // SETTA LA VISIBILITA' DELLA CATEGORIA SELEZIONATA
    this.onCategoryChange({ nome: this.selectedSpesa.categoria });

    this.formAggModAzione.patchValue({
      azione: this.selectedSpesa.azione || '',
      tipo: tipo,
      importo: importo,
      categoria: this.selectedSpesa.categoria || '',
    });
  }

  // Funzione per gestire l'azione di eliminazione
  public deleteButton = [
    {
      text: 'No',
      role: 'cancel',
      handler: () => {
        // Gestisci la chiusura dell'alert se necessario
        console.log('Eliminazione annullata');
        this.closeModalAzioni(); // Chiudi il modale
      },
    },
    {
      text: 'Elimina',
      role: 'confirm',
      handler: async () => {
        try {
          // Esegui la cancellazione
          await this.speseService
            .deleteAzione(this.selectedSpesa.id)
            .toPromise();
          // Ricarica i dati se necessario
          const mese = this.meseList.find(
            (m) =>
              m.numeroMese === Number(this.selectedSpesa.mese) &&
              m.anno === this.selectedSpesa.anno
          );
          if (mese) {
            this.loadSpese(mese);
            this.loadTotali();
            this.closeModalAzioni(); // Chiudi il modale dopo l'eliminazione
          } else {
            console.error('Errore: mese non definito per questa spesa.');
          }
        } catch (error) {
          console.error("Errore durante la cancellazione dell'azione:", error);
        }
      },
    },
  ];

  // Funzione per gestire il refresh
  doRefresh(event: CustomEvent<RefresherEventDetail>) {
    console.log('Refresh in corso...');
    setTimeout(() => {
      // Ricarica i dati
      this.ngOnInit();
      event.detail.complete(); // Completa il refresh
    }, 2000); // Simuliamo un ritardo di 2 secondi
  }
}
