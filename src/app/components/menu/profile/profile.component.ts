import { Component, OnInit } from '@angular/core';
import { User } from 'src/app/interfaces/app.interfaces';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  userID: string;
  user: User;

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.userID = localStorage.getItem('userID');
    // Get user data
    this.userService.getUserData(this.userID).subscribe((user: User) => {
      if (user) {
        this.user = user;
      }
    });
  }

}