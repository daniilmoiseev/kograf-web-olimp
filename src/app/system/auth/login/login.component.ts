import {Component, OnInit} from '@angular/core';
import {Router, RouterLink} from "@angular/router";
import {MessageService} from "primeng/api";
import {UserService} from "../../shared/services/user.service";
import {UserRole} from "../../shared/model/user";
import {FormsModule} from "@angular/forms";
import {NgForOf, NgIf} from "@angular/common";
import {ToastModule} from "primeng/toast";

@Component({
  selector: 'auth-logist',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    RouterLink,
    FormsModule,
    ToastModule,
    NgIf,
    NgForOf
  ],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
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

  ngOnInit() {
    this.userService.getCurrentUser().then(user => {
      if (user) {
        this.router.navigate(['/home']);
      }
    });
  }

  async login() {
    if (!this.validateForm()) return;

    try {
      const user = await this.userService.getUserByEmail(this.email);

      if (!user || user.role !== this.selectedRole) {
        this.showError('Пользователь не найден');
        return;
      }

      if (!user || user.password !== this.password) {
        this.showError('Неверный пароль');
        return;
      }

      this.userService.cacheUser(user);
      this.router.navigate(['/home']);
    } catch (error) {
      this.showError('Ошибка при входе в систему');
    }
  }

  public selectRole(role: UserRole) {
    this.selectedRole = role;
    this.dropdownOpen = false;
  }

  private validateForm(): boolean {
    if (!this.email || !this.password || !this.selectedRole) {
      this.showError('Заполните все поля');
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