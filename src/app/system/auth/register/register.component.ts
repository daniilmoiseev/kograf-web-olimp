import {Component} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {MessageService} from "primeng/api";
import {CreateUserDto, UserService} from "../../shared/services/user.service";
import {UserRole} from "../../shared/model/user";
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {ToastModule} from "primeng/toast";

@Component({
  selector: 'auth-carrier',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [
    RouterLink,
    FormsModule,
    ToastModule,
    NgIf,
    NgForOf
  ],
  providers: [MessageService]
})
export class RegisterComponent {
  email: string = '';
  password: string = '';
  showPassword: boolean = false;
  dropdownOpen: boolean = false;
  selectedRole: UserRole | null = null;
  roles: UserRole[] = Object.values(UserRole);

  constructor(
      private router: Router,
      private userService: UserService,
      private messageService: MessageService
  ) {
  }

  async register() {
    if (!this.validateForm()) return;

    try {
      const existingUser = await this.userService.getUserByEmail(this.email);
      if (existingUser) {
        this.showError('Пользователь с таким email уже существует');
        return;
      }

      const userData: CreateUserDto = {
        email: this.email,
        password: this.password,
        role: this.selectedRole!,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.userService.createUser(userData);
      this.router.navigate(['/login']);
    } catch (error) {
      this.showError('Ошибка регистрации: ' + (error as Error).message);
    }
  }

  public selectRole(role: UserRole) {
    this.selectedRole = role;
    this.dropdownOpen = false;
  }

  private validateForm(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!this.email || !this.password || !this.selectedRole) {
      this.showError('Заполните все поля');
      return false;
    }

    if (!emailRegex.test(this.email)) {
      this.showError('Неверный формат email');
      return false;
    }

    if (this.password.length < 6) {
      this.showError('Пароль должен быть не менее 6 символов');
      return false;
    }

    return true;
  }

  private showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: message
    });
  }
}