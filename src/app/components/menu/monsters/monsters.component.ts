import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Monster } from 'src/app/interfaces/monster.interface';

@Component({
  selector: 'app-monsters',
  templateUrl: './monsters.component.html',
  styleUrls: ['./monsters.component.css']
})
export class MonstersComponent implements OnInit {
  monsters: Monster[] = [];
  currentIndex: number = 0; // tracks which monster is displayed
  currentMonster?: Monster;
  searchTerm: string = '';
  objectKeys = Object.keys;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Monster[]>('assets/json/species.json').subscribe(data => {
      this.monsters = data;
      if (this.monsters.length) {
        this.currentIndex = 0;
        this.currentMonster = this.monsters[0];
      }
    });
  }

  openModal(): void {
    // Just show first monster on open
    if (this.monsters.length) {
      this.currentIndex = 0;
      this.currentMonster = this.monsters[0];
    }
  }

  search(): void {
    if (!this.searchTerm) return;

    const term = this.searchTerm.toLowerCase().trim();

    const foundIndex = this.monsters.findIndex(m =>
      m.id.toString() === term || m.name.toLowerCase() === term
    );

    if (foundIndex !== -1) {
      this.currentIndex = foundIndex;
      this.currentMonster = this.monsters[foundIndex];
    } else {
      alert('Monster not found');
    }
  }

  prevMonster(): void {
    if (this.monsters.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.monsters.length) % this.monsters.length;
    this.currentMonster = this.monsters[this.currentIndex];
  }

  nextMonster(): void {
    if (this.monsters.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.monsters.length;
    this.currentMonster = this.monsters[this.currentIndex];
  }
}
