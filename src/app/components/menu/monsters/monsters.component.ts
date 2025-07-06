import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Monster } from 'src/app/interfaces/monster.interface';
import { Move } from 'src/app/interfaces/move.interface';

@Component({
  selector: 'app-monsters',
  templateUrl: './monsters.component.html',
  styleUrls: ['./monsters.component.css']
})
export class MonstersComponent implements OnInit {
  monsters: Monster[] = [];
  currentIndex: number = 0;
  currentMonster?: Monster;
  searchTerm: string = '';
  objectKeys = Object.keys;

  expandedMoves: boolean[] = [];

  movesData: Move[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Monster[]>('assets/json/species.json').subscribe(data => {
      this.monsters = data;
      if (this.monsters.length) {
        this.currentIndex = 0;
        this.currentMonster = this.monsters[0];
        this.expandedMoves = new Array(this.currentMonster.moves.length).fill(false);
      }
    });

    this.http.get<Move[]>('assets/json/moves.json').subscribe(data => {
      this.movesData = data;
    });
  }

  openModal(): void {
    if (this.monsters.length) {
      this.currentIndex = 0;
      this.currentMonster = this.monsters[0];
      this.expandedMoves = new Array(this.currentMonster.moves.length).fill(false);
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
      this.expandedMoves = new Array(this.currentMonster.moves.length).fill(false);
    } else {
      alert('Monster not found');
    }
  }

  prevMonster(): void {
    if (this.monsters.length === 0) return;

    this.currentIndex = (this.currentIndex - 1 + this.monsters.length) % this.monsters.length;
    this.currentMonster = this.monsters[this.currentIndex];
    this.expandedMoves = new Array(this.currentMonster.moves.length).fill(false);
  }

  nextMonster(): void {
    if (this.monsters.length === 0) return;

    this.currentIndex = (this.currentIndex + 1) % this.monsters.length;
    this.currentMonster = this.monsters[this.currentIndex];
    this.expandedMoves = new Array(this.currentMonster.moves.length).fill(false);
  }

  toggleMoveDetails(index: number): void {
    if (this.expandedMoves[index]) {
      // Currently expanded -> hide it
      this.expandedMoves[index] = false;
    } else {
      // Show only this, hide others
      this.expandedMoves.fill(false);
      this.expandedMoves[index] = true;
    }
  }

  getMoveDetails(name: string): Move | undefined {
    return this.movesData.find(m => m.name.toLowerCase() === name.toLowerCase());
  }
}
