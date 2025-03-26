import {Routes} from "@angular/router";
import {NotFoundComponent} from "./system/not-found/not-found.component";
import {LoginComponent} from "./system/auth/login/login.component";
import {RegisterComponent} from "./system/auth/register/register.component";
import {HomeComponent} from "./system/home/home.component";
import {LogistComponent} from "./system/home/logist/logist.component";
import {CarrierComponent} from "./system/home/carrier/carrier.component";

export const appRoutes: Routes = [
  {
    path: '',
    component: LoginComponent,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    children: [
      {path: 'logist', component: LogistComponent},
      {path: 'carrier', component: CarrierComponent},
      {path: '', redirectTo: 'logist', pathMatch: 'full'}
    ]
  },
  {
    path: '**',
    component: NotFoundComponent
  },
  {
    path: 'not-found',
    component: NotFoundComponent
  }
];
