import throttle from 'lodash.throttle';
import { lerp } from '../utils/math';
import { gsap } from 'gsap';

interface ParallaxOptions {
    selector: string;
}

interface elmInfoOptions {
    el: HTMLElement;
    current: number;
    previous: number;
    ease: number;
    parallax: number;
}

const defaults: ParallaxOptions = {
    selector: '[data-parallax-obj]',
};

export class Parallax {
    params: ParallaxOptions;
    elms: {
        targets: NodeListOf<HTMLElement>;
    };
    elmInfo: elmInfoOptions;
    elmInfoList: elmInfoOptions[];
    constructor(props: Partial<ParallaxOptions> = {}) {
        this.params = { ...defaults, ...props };
        this.elms = {
            targets: document.querySelectorAll(this.params.selector),
        };
        this.elmInfoList = [];
        this.init();
    }
    init(): void {
        this.handleEvents();
        window.addEventListener(
            'scroll',
            throttle(() => {
                this.setScrollY();
            }, 100),
            false
        );
    }
    async handleEvents(): Promise<void> {
        await this.getElmInfo();
        this.transformElm();
    }
    getElmInfo(): Promise<void> {
        return new Promise((resolve) => {
            this.elms.targets.forEach((target) => {
                this.elmInfo = {
                    el: target,
                    current: 0,
                    previous: 0,
                    ease: 0.1,
                    parallax: 1,
                };
                this.elmInfoList.push(this.elmInfo);
            });
            resolve();
        });
    }
    setScrollY(): void {
        if (this.elmInfoList.length > 0) {
            this.elmInfoList.forEach((elmInfo) => {
                const elmTop = elmInfo.el.getBoundingClientRect().top;
                if (window.scrollY > 0) {
                    elmInfo.current = (window.innerHeight - elmTop) * 0.15;
                } else {
                    elmInfo.current = 0;
                }
            });
        }
    }
    transformElm(): void {
        if (this.elmInfoList.length > 0) {
            this.elmInfoList.forEach((elmInfo, index) => {
                const elmTop = elmInfo.el.getBoundingClientRect().top;
                const wh = window.innerHeight;
                if (elmTop >= -wh && elmTop <= wh * 2) {
                    elmInfo.ease = parseFloat(`0.2${index}`);
                    elmInfo.previous = lerp(elmInfo.previous, elmInfo.current, elmInfo.ease);
                    elmInfo.previous = Math.floor(elmInfo.previous * 100) / 100;
                    const tl = gsap.timeline();
                    if (window.scrollY > 0) {
                        tl.to(elmInfo.el, {
                            y: -elmInfo.previous,
                        });
                    } else {
                        tl.to(elmInfo.el, {
                            y: -elmInfo.previous,
                            duration: 1.5,
                        });
                    }
                }
            });
        }
        requestAnimationFrame(this.transformElm.bind(this));
    }
}
