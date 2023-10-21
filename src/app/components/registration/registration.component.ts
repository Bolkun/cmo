import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css'],
})
export class RegistrationComponent implements OnInit {
  @Output() goBackToLogin: EventEmitter<any> = new EventEmitter<any>();

  @Output() goToVerifyEmail: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public userService: UserService,
    public router: Router
  ) {}

  ngOnInit(): void {}

  backLogin() {
    this.router.navigate(['login']);
  }

  async signUp(userNickname: string, userEmail: string, userPwd: string) {
    await this.userService.SignUp(userNickname, userEmail, userPwd);
    if (this.userService.regIn) {
      this.router.navigate(['game']);
    }
  }

  async googleReg() {
    await this.userService.GoogleReg();
    if (this.userService.regIn) {
      this.goToVerifyEmail.emit();
    }
  }
}
