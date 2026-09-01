import './ui/styles.css';
import { Game } from './app/game.ts';

// Compose the app: a full-bleed canvas for the game and a DOM overlay layer for
// between-fight menus (never during a fight). Then hand off to the game shell.

const app = document.getElementById('app');
if (app === null) {
  throw new Error('#app missing');
}

const canvas = document.createElement('canvas');
canvas.id = 'kf-canvas';
app.appendChild(canvas);

const ui = document.createElement('div');
ui.id = 'kf-ui';
app.appendChild(ui);

new Game(canvas, ui).start();
