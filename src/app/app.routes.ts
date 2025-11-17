import { Routes } from '@angular/router';
import {Giocatori} from './component/giocatori/giocatori';
import {Homepage} from './component/homepage/homepage';
import {Calendario} from './component/calendario/calendario';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: Homepage },
  { path: 'squadra', component: Giocatori },
  { path: 'calendario', component: Calendario },
];
