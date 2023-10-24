import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';

// firebase
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { GameComponent } from './components/game/game.component';
import { UserStatusComponent } from './components/user-status/user-status.component';
import { FlashMessageComponent } from './components/flash-message/flash-message.component';
import { TimerRequestComponent } from './components/timer-request/timer-request.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegistrationComponent,
    ResetPasswordComponent,
    UserProfileComponent,
    VerifyEmailComponent,
    GameComponent,
    UserStatusComponent,
    FlashMessageComponent,
    TimerRequestComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    // firebase
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
