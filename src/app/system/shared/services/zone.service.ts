import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {baseUrl} from "../../../app.constants";
import {Zone, ZoneType} from "../model/zone";

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private apiUrl = `${baseUrl}/zones`;

  constructor(private http: HttpClient) {
  }

  async getAllZones(): Promise<Zone[]> {
    return firstValueFrom(
        this.http.get<Zone[]>(this.apiUrl).pipe(
            catchError(this.handleError('Ошибка получения зон'))
        )
    );
  }

  async getZoneByType(type: ZoneType): Promise<Zone[]> {
    const params = new HttpParams().set('type', type);

    return firstValueFrom(
        this.http.get<Zone[]>(this.apiUrl, {params}).pipe(
            catchError(this.handleError('Ошибка фильтрации по типу'))
        )
    );
  }

  async getSenderZones(): Promise<Zone[]> {
    return await this.getZoneByType(ZoneType.FROM);
  }

  async getReceiverZones(): Promise<Zone[]> {
    return await this.getZoneByType(ZoneType.TO);
  }

  private handleError(message: string) {
    return (error: any) => {
      console.error(`${message}:`, error);
      return throwError(() => new Error(
          error.error?.message || message
      ));
    };
  }
}