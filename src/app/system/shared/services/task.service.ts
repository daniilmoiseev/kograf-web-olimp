import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {baseUrl} from "../../../app.constants";
import {Task} from "../model/task";

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${baseUrl}/tasks`;

  constructor(private http: HttpClient) {
  }

  async getTasks(): Promise<Task[]> {
    return firstValueFrom(
        this.http.get<Task[]>(this.apiUrl).pipe(
            catchError(this.handleError('Ошибка получения заданий'))
        )
    );
  }

  async getTasksByUser(carrier: string): Promise<Task[]> {
    const params = new HttpParams().set('carrier', carrier);

    return firstValueFrom(
        this.http.get<Task[]>(this.apiUrl, {params}).pipe(
            catchError(this.handleError('Ошибка получения заданий'))
        )
    );
  }

  async createTask(taskData: Task): Promise<Task> {
    return firstValueFrom(
        this.http.post<Task>(this.apiUrl, taskData).pipe(
            catchError(this.handleError('Ошибка создания задания'))
        )
    );
  }

  async updateTask(taskData: Task): Promise<Task> {
    return firstValueFrom(
        this.http.put<Task>(`${this.apiUrl}/${taskData.id}`, taskData).pipe(
            catchError(this.handleError('Ошибка редактирования задания'))
        )
    );
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