import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {Router, RouterModule, RouterOutlet} from "@angular/router";
import {UserService} from "../shared/services/user.service";
import {UserRole} from "../shared/model/user";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  imports: [CommonModule, RouterModule, RouterOutlet]
})
export class HomeComponent implements OnInit {

  constructor(private router: Router,
              private userService: UserService) {
  }

  ngOnInit(): void {
    const userRole = this.userService.getCurrentUserRole();
    if (userRole === UserRole.LOGIST) {
      this.router.navigate(['/home/logist']);
    } else if (userRole === UserRole.CARRIER) {
      this.router.navigate(['/home/carrier']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
