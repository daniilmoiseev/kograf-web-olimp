import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {firstValueFrom, throwError} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {baseUrl} from "../../../app.constants";
import {User, UserRole} from "../model/user";

export interface CreateUserDto {
  email: string;
  password: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  email?: string;
  password?: string;
  role?: UserRole;
  progress?: number;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${baseUrl}/users`;
  private currentUserKey = 'currentUser';

  constructor(private http: HttpClient) {
  }

  async getUsers(): Promise<User[]> {
    return firstValueFrom(
        this.http.get<User[]>(this.apiUrl).pipe(
            catchError(this.handleError('Ошибка получения пользователей'))
        )
    );
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    const params = new HttpParams().set('role', role);

    return firstValueFrom(
        this.http.get<User[]>(this.apiUrl, {params}).pipe(
            catchError(this.handleError('Ошибка фильтрации по роли'))
        )
    );
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const params = new HttpParams().set('email', email);

    return firstValueFrom(
        this.http.get<User[]>(this.apiUrl, {params}).pipe(
            map(users => users.length > 0 ? users[0] : null),
            catchError(this.handleError('Ошибка поиска пользователя'))
        )
    );
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    return firstValueFrom(
        this.http.post<User>(this.apiUrl, userData).pipe(
            catchError(this.handleError('Ошибка создания пользователя'))
        )
    );
  }

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
    return firstValueFrom(
        this.http.patch<User>(`${this.apiUrl}/${id}`, updateData).pipe(
            catchError(this.handleError('Ошибка обновления пользователя'))
        )
    );
  }

  getCurrentUserRole(): UserRole | null {
    const user = this.getCachedUser();
    return user?.role || null;
  }

  async getCurrentUser(): Promise<User | null> {
    const cachedUser = this.getCachedUser();
    if (cachedUser) return cachedUser;

    const userEmail = localStorage.getItem('email');
    if (!userEmail) return null;

    try {
      const user = await this.getUserByEmail(userEmail);
      if (user) this.cacheUser(user);
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }

  cacheUser(user: User): void {
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  private getCachedUser(): User | null {
    const userData = localStorage.getItem(this.currentUserKey);
    return userData ? JSON.parse(userData) : null;
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