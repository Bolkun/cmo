import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// services
import { UserService } from 'src/app/services/user.service';
// interfaces
import { User, Request, Game, Round, Move } from 'src/app/interfaces/app.interfaces';
// components
import { LogoutComponent } from 'src/app/components/menu/logout/logout.component';

@Component({
  selector: 'app-world',
  templateUrl: './world.component.html',
  styleUrls: ['./world.component.css']
})
export class WorldComponent implements OnInit {
  userID: string;     // current player
  // User
  user: User;

  constructor(
    public userService: UserService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (!this.userService.isLoggedIn()) {
      this.router.navigate(['login']);
    }
    this.userID = localStorage.getItem('userID');
  }

}
