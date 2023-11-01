# Cmo - A Multiplayer Browser Game

Cmo is a multiplayer browser game that is based on the classic game of 'tic-tac-toe.' It offers players the main functionality of playing the game between two participants, similar to how battles work in Pokémon games.

Play the game here: [Cmo Game](https://cmo-game.web.app/)

For reference, the game's structure and functionality are similar to popular Pokémon games like [League17](https://league17.ru/) and [Pokémon Showdown](https://play.pokemonshowdown.com/). In Cmo, players can send and receive play requests, make moves based on turns, and the game records each move in a history of movements. The game also incorporates logic to handle player inactivity and cheating.

## 1. Architecture

The architecture of Cmo is visually represented in the following diagram created in [app.diagrams.net](https://app.diagrams.net/), which provides an overview of the program's main concepts. You can view and comment on the diagram by following this link: [Cmo Architecture Diagram](https://drive.google.com/file/d/1EZoQ8DQngN7BWRQnjp8zGFLfTA0G6vvF/view?usp=sharing).

## 2. Technology and Tools

Cmo was developed using a set of technologies and tools to bring the game to life. The key components are as follows:

- **Frontend Technology**: Cmo utilizes Angular as its frontend framework.
- **Database**: Firebase serves as the primary database solution for Cmo, employing both Firestore and Real-Time Database functionalities.
- **Code Development**: The code for Cmo was developed using Visual Studio Code, and the project followed specific file formatting standards for different file types, such as HTML, CSS, TypeScript, and JavaScript.
- **Future Improvements**: Although not currently implemented, there is an important idea of incorporating cloud functions as a server to clean database collections of old requests and games.

## 3. Compatibility

Cmo ensures compatibility between Angular, Firebase, and AngularFire. To guarantee a seamless experience for users, it's crucial to consider the compatibility of different versions. Here's a summary of compatibility:

### Angular and Firebase Versions

AngularFire does not strictly adhere to Angular's versioning, as Firebase introduces breaking changes throughout the year. However, AngularFire aims to maintain compatibility with both Firebase and Angular for as long as possible. Below is a compatibility matrix, which was taken from [angularfire](https://github.com/angular/angularfire) README.md file:

| Angular | Firebase | AngularFire  |
| ------- | -------- | ------------ |
| 16      | 9        | ^7.6         |
| 15      | 9        | ^7.5         |
| 14      | 9        | ^7.4         |
| 13      | 9        | ^7.2         |
| 12      | 9        | ^7.0         |
| 12      | 7,8      | ^6.1.5       |
| 11      | 7,8      | ^6.1         |
| 10      | 8        | ^6.0.4       |
| 10      | 7        | ^6.0.3       |
| 9       | 8        | ^6.0.4       |
| 9       | 7        | ^6.0         |

<sub>Version combinations not documented here may work but are untested and might trigger NPM peer warnings.</sub>

### Tool Versions

It's essential to ensure that your development environment has the following tool versions to run Cmo successfully:

- Node.js Version: v18.17.0
- npm Version: 9.8.1
- Firebase CLI Version: 12.7.0 ([Firebase CLI releases](https://firebase.google.com/support/releases))
- Angular CLI Version: 16.1.0
- AngularFire Version: 7.6.1 (`npm list @angular/fire`)
- Firebase JavaScript SDK Version: 9.23.0 ([Firebase JavaScript SDK releases](https://firebase.google.com/support/release-notes/js))

By maintaining the specified versions, you can ensure the compatibility and functionality of Cmo.

### Code File Formatters

| Type     | File                                     | Extension                               |
| -------  | ---------------------------------------- | --------------------------------------- |
| html     | `.html`                                  | HTML Language Features                  |
| css      | `.css`                                   | Prettier                                |
| ts       | `.ts`                                    | TypeScript and JavaScript Type Features |

### ToDo
- generate auth token and get rid of localstorage
- guards check
- sockets (websockets)
- (cloud functions)
- unit-tests

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Installed libraries
npm install @angular/fire firebase
ng generate guard auth

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
