import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { GameComponent } from './pages/game/game.component';
import { LoginComponent } from './pages/login/login.component';
import { RegistrationComponent } from './pages/registration/registration.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full'},
  { path: 'game', component: GameComponent/*, canActivate: [authGuard]*/ },
  { path: 'login', component: LoginComponent },
  { path: 'registration', component: RegistrationComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: '**', component: NotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
