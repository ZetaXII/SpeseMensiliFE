import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Spesa {
  id: number;
  azione: string;
  categoria: string;
  nomeGiorno: string;
  numeroGiorno: number;
  mese: string;
  anno: number;
  entrata: number | null;
  uscita: number | null;
}

export interface Totali {
  totaleEntrate: number;
  totaleUscite: number;
  saldo: any;
}

@Injectable({
  providedIn: 'root'
})
export class SpeseService {
  // HOSTING BACKEND: https://dashboard.render.com/web/srv-cuscehhopnds7399mnm0
  // BOT PER TENERE HOSTATO IL BACKEND: https://dashboard.uptimerobot.com/monitors/798667489 -- V1 (NON FUNZIONA BENE)
  // BOT PER TENERE HOSTATO IL BACKEND: https://uptime.betterstack.com/team/306632/monitors/3058965 -- V2
  // HOSTING DB: https://supabase.com/dashboard/project/kfriuurrgdbzzbsjncwn/editor/49212?schema=public
  private readonly API_URL = 'https://spesemensilibe.onrender.com/api/azioni';
  private readonly USER = 'MARIO';

  constructor(private http: HttpClient) { }

  getAllAzioni(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/getAll?user=${this.USER}`);
  }

  getAzioniByAnno(anno: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/getByAnno/${anno}?user=${this.USER}`);
  }

  getAzioniByMeseAnno(mese: number, anno: number): Observable<Spesa[]> {
    return this.http.get<Spesa[]>(`${this.API_URL}/getByMeseAnno/${mese}/${anno}?user=${this.USER}`);
  }

  searchByFilter(azioneDTO: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.API_URL}/searchByFilter?user=${this.USER}`, azioneDTO);
  }

  getTotali(): Observable<Totali> {
    return this.http.get<Totali>(`${this.API_URL}/getTotali?user=${this.USER}`);
  }

  getAzioneById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/get/${id}?user=${this.USER}`);
  }

  createAzione(azioneDTO: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/create?user=${this.USER}`, azioneDTO);
  }

  updateAzione(id: number, azioneDTO: any): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/update/${id}?user=${this.USER}`, azioneDTO);
  }

  deleteAzione(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/delete/${id}?user=${this.USER}`);
  }
}
