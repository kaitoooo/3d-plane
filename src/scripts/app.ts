import '../styles/style.scss';
import picturefill from 'picturefill';
picturefill();
import Split from './components/split';
import WebGL from './components/webgl';
import { Parallax } from './components/parallax';

export default class App {
    constructor() {
        window.addEventListener(
            'DOMContentLoaded',
            () => {
                this.init();
            },
            false
        );
    }
    init(): void {
        new Split();
        new Parallax();
        new WebGL();
    }
}
new App();
