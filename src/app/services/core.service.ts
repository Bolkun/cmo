import { Injectable } from '@angular/core';
// json
import jBasicTypeEffectiveness from 'src/assets/json/basic_type_effectiveness.json';
import jMoves from 'src/assets/json/moves.json';
import jSpecies from 'src/assets/json/species.json';
import jTraining from 'src/assets/json/training.json';

@Injectable({
  providedIn: 'root'
})
export class CoreService {

  constructor() { }

  getSpecies(id: number): any | undefined {
    // Find the species with matching id
    const species = jSpecies.find((sp: any) => sp.id === id);
    // Return the species object or undefined if not found
    return species;
  }

  getMove(name: string): any | undefined {
    // Find the move with matching name
    const move = jMoves.find((m: any) => m.name === name);
    // Return the species object or undefined if not found
    return move;
  }

  /**
   * Calculates Effort Value (EV) based on level.
   * Formula: EV = 99 + (level - 1) * 3
   * @param lvl level (1–100), min=99, max=396 (3x126+18)  
   * @returns Calculated EV
   */
  calcEV(lvl: number): number {
    return 99 + (lvl - 1) * 3;
  }

  /**
   * Calculates HP Stat. Rounded a number down to the nearest whole integer, like 5.9=5, 5.1=5, 5.0=5
   * Formula: StatHP = (((BaseStat ∗ 2 + GenHP + (EV_HP/2) ) ∗ Level/100 ) + 10 + Level)
   * @param baseStatHP Base HP stat of the species
   * @param genHP Individual value (IV) for HP
   * @param evHP Effort Value for HP
   * @param level level (1–100)
   * @returns Final calculated HP stat
   */
  calcStatHP(
    baseStatHP: number,
    genHP: number,
    evHP: number,
    lvl: number
  ): number {
    return Math.floor((((baseStatHP * 2 + genHP + Math.floor(evHP / 2)) * lvl) / 100) + 10 + lvl);
  }

  /**
   * Calculates stat: Attack, Defense, Speed, Special Attack, Special Defense. Rounded a number down to the nearest whole integer, like 5.9=5, 5.1=5, 5.0=5
   * Formula: StatA|D|S|SA|SD=(((BaseStat ∗ 2 + GenA|D|S|SA|SD + (EV/2)) ∗ Level/100) + 5) * CharacterMultiplier * TrainingPack
   * @param baseStat - The base stat from the species
   * @param genStat - The individual value (IV)
   * @param ev - Effort Value for the stat
   * @param level - level (1–100)
   * @param characterMultiplier - Nature/Personality multiplier (default is 1)
   * @param trainingPack - Training multiplier (default is 1)
   * @returns The calculated stat
   */
  calcStat(
    baseStat: number,
    genStat: number,
    ev: number,
    level: number,
    characterMultiplier: number = 1,
    trainingPack: number = 1
  ): number {
    const core = ((baseStat * 2 + genStat + Math.floor(ev / 2)) * level) / 100 + 5;
    const final = core * characterMultiplier * trainingPack;
    return Math.floor(final);
  }

  move(
    round: number = 1,
    monster: any,
    oponentMonster: any,
    move: any
  ): any {
    const chance = Math.random();
    let stage: number;
    let multiplier: number;
    let damage: number;
    switch (move.name) {
      case 'absorb':
        damage = this.getDamage(monster, oponentMonster, move);
        // Absorb deals damage and the user will recover 50% of the HP drained.
        monster['current']['hp'] = Math.min(monster['stats']['hp'], monster['current']['hp'] + damage * 0.5);
        break;
      case 'acid':
        damage = this.getDamage(monster, oponentMonster, move);
        // Acid has a 33.2% chance to lower opponent's Defense by 1 stage
        if (chance < 0.332) {
          oponentMonster['stage']['d'] = Math.max(oponentMonster['stage']['d'] - 1, -6);
          stage = oponentMonster['stage']['d'];
          multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
          oponentMonster['current']['d'] = Math.floor(oponentMonster['stats']['d'] * multiplier);
        }
        break;
      case 'acid armor':
        damage = 0;
        // Acid Armor raises the user's defense by 2 stages
        monster['stage']['d'] = Math.min(monster['stage']['d'] + 2, 6);
        stage = monster['stage']['d'];
        multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        monster['current']['d'] = Math.floor(monster['stats']['d'] * multiplier);
        break;
      case 'agility':
        damage = 0;
        // Agility raises the user's speed by 2 stages
        monster['stage']['s'] = Math.min(monster['stage']['s'] + 2, 6);
        stage = monster['stage']['s'];
        multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        monster['current']['s'] = Math.floor(monster['stats']['s'] * multiplier);
        break;
      case 'amnesia':
        damage = 0;
        // Amnesia raises the user's Special Defense by 2 stages.
        monster['stage']['sd'] = Math.min(monster['stage']['sd'] + 2, 6);
        stage = monster['stage']['sd'];
        multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        monster['current']['sd'] = Math.floor(monster['stats']['sd'] * multiplier);
        break;
      case 'aurora beam':
        damage = this.getDamage(monster, oponentMonster, move);
        // Aurora Beam deals damage and has a 10% chance of lowering the opponent's Attack by 1 stage.
        if (chance < 0.1) {
          oponentMonster['stage']['a'] = Math.max(oponentMonster['stage']['a'] - 1, -6);
          stage = oponentMonster['stage']['a'];
          multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
          oponentMonster['current']['a'] = Math.floor(oponentMonster['stats']['a'] * multiplier);
        }
        break;
      case 'barrage':
        // Step 1: Determine number of hits
        const roll = Math.random();
        let hits: number;
        if (roll < 3 / 8) {
          hits = 2;
        } else if (roll < 6 / 8) {
          hits = 3;
        } else if (roll < 7 / 8) {
          hits = 4;
        } else {
          hits = 5;
        }
        // Step 2: Deal damage for each hit
        let totalDamage = 0;
        for (let i = 0; i < hits; i++) {
          totalDamage += this.getDamage(monster, oponentMonster, move);
        }
        damage = totalDamage;
        break;
      case 'barrier':
        damage = 0;
        // Barrier raises the user's Defense by 2 stages.
        monster['stage']['d'] = Math.min(monster['stage']['d'] + 2, 6);
        stage = monster['stage']['d'];
        multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
        monster['current']['d'] = Math.floor(monster['stats']['d'] * multiplier);
        break;
      case 'bide':
        // The user of Bide delays its move to store energy, then strikes back with damage equal to twice its total missing HP.
        damage = (monster['stats']['hp'] - monster['current']['hp']) * 2;
        break;
      case 'bind':
        
        break;

      default:
        // No special effect
        break;
    }
  }

  getDamage(
    monster: any,
    oponentMonster: any,
    move: any
  ) {
    let typeEffectiveness: number = this.getTypeEffectiveness(move['type'], oponentMonster['types']);
    let stab: number = this.getStabEffect(move['type'], oponentMonster['types']);
    let critical: number = this.getCriticalEffect();
    const randomFactor = Math.random() * 0.15 + 0.85;
    let damage: number;

    if (move['category'] == 'physical') {
      damage = (((2 * monster['lvl'] + 10) / 250) * (monster['A'] / oponentMonster['D']) * move['power'] + 2) * typeEffectiveness * stab * critical * randomFactor;
    } else if (move['category'] == 'special') {
      damage = (((2 * monster['lvl'] + 10) / 250) * (monster['SA'] / oponentMonster['SD']) * move['power'] + 2) * typeEffectiveness * stab * critical * randomFactor;
    } else {
      damage = 0;
    }

    return Math.floor(damage);
  }

  /**
   * Calculates the type effectiveness multiplier for a move against a defender with 1 or 2 types.
   * @param moveType The attacking move's type (e.g. "grass")
   * @param defenderTypes An array of 1 or 2 types (e.g. ["water", "ground"])
   * @returns Effectiveness multiplier (e.g. 4, 2, 1, 0.5, 0.25, 0)
   */
  getTypeEffectiveness(
    moveType: string,
    defenderTypes: string[]
  ): number {
    return defenderTypes.reduce((multiplier, defenderType) => {
      const effectiveness = jBasicTypeEffectiveness[moveType]?.[defenderType] ?? 1;
      return multiplier * effectiveness;
    }, 1);
  }

  /**
   * Calculates the STAB (Same Type Attack Bonus) multiplier.
   * @param moveType - The type of the move being used (e.g. "fire")
   * @param attackerTypes - The monsters's types (can be 1 or 2 types, e.g. ["fire", "flying"])
   * @returns 1.5 if the move type matches any of the monster's types, otherwise 1
   */
  getStabEffect(moveType: string, attackerTypes: string[]): number {
    return attackerTypes.includes(moveType) ? 1.5 : 1;
  }

  /**
   * Calculates whether a move is a critical hit and returns the critical multiplier.
   * @returns 1.5 if critical hit (6.25% chance), otherwise 1
   */
  getCriticalEffect(): number {
    const isCritical = Math.random() < 0.0625; // 6.25% = 1/16
    return isCritical ? 1.5 : 1;
  }

}