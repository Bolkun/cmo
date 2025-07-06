import { Component } from '@angular/core';
import { Router } from '@angular/router';
// services
import { CoreService } from 'src/app/services/core.service';

@Component({
  selector: 'app-core',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.css']
})
export class CoreComponent {
  monster: any;
  move: any;

  constructor(
    private coreService: CoreService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.monster = this.coreService.getSpecies(1);  // bulbasaur
    // console.log(this.monster);
    this.move = this.coreService.getMove('absorb');  // absorb
    // console.log(this.move);

      /* Game
      * 1. Each player selects 1 monster -> both players see 1) monster 2) lvl 3) hp 4) info button 5) type
      * 2. Each player can 1) change monster 2) select 1 of 4 moves
      * 3. Player goes first which speed higher or attack priority has higher
      * 4. Player wins when oponent all monster hp sum zero.
      */
      // selectMonster {

      // }

  }

}
