import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import throttle from 'lodash.throttle';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default class WebGL {
    winSize: {
        [s: string]: number;
    };
    elms: {
        [s: string]: HTMLElement;
    };
    mvSubText: NodeListOf<HTMLElement>;
    dpr: number;
    three: {
        scene: THREE.Scene;
        renderer: THREE.WebGLRenderer | null;
        clock: THREE.Clock;
        redraw: any;
        camera: THREE.PerspectiveCamera | null;
        cameraFov: number;
        cameraAspect: number;
    };
    sp: boolean;
    ua: string;
    mq: MediaQueryList;
    srcObj: string;
    flg: {
        [s: string]: boolean;
    };
    constructor() {
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
        };
        this.elms = {
            canvas: document.querySelector('[data-canvas]'),
            mvTitle: document.querySelector('[data-mv="title"]'),
            mvHomeLink: document.querySelector('[data-mv="homeLink"]'),
            mvGitLink: document.querySelector('[data-mv="gitLink"]'),
            mvNoteLink: document.querySelector('[data-mv="noteLink"]'),
        };
        this.mvSubText = document.querySelectorAll('.mv__sub-text');
        // デバイスピクセル比(最大値=2)
        this.dpr = Math.min(window.devicePixelRatio, 2);
        this.three = {
            scene: null,
            renderer: null,
            clock: null,
            redraw: null,
            camera: null,
            cameraFov: 50,
            cameraAspect: window.innerWidth / window.innerHeight,
        };
        this.sp = null;
        this.ua = window.navigator.userAgent.toLowerCase();
        this.mq = window.matchMedia('(max-width: 768px)');
        this.srcObj = './obj/plane.glb';
        this.flg = {
            loaded: false,
        };
        this.init();
    }
    init(): void {
        this.getLayout();
        this.initScene();
        this.initCamera();
        this.initClock();
        this.setLight();
        this.initRenderer();
        this.setLoading();
        this.scrollAnimate();
        this.handleEvents();

        if (this.ua.indexOf('msie') !== -1 || this.ua.indexOf('trident') !== -1) {
            return;
        } else {
            this.mq.addEventListener('change', this.getLayout.bind(this));
        }
    }
    getLayout(): void {
        this.sp = this.mq.matches ? true : false;
    }
    initScene(): void {
        // シーンを作成
        this.three.scene = new THREE.Scene();
    }
    initCamera(): void {
        // カメラを作成(視野角, スペクト比, near, far)
        this.three.camera = new THREE.PerspectiveCamera(this.three.cameraFov, this.winSize.wd / this.winSize.wh, this.three.cameraAspect, 1000);
        this.three.camera.position.set(this.sp ? -1 : -4, 0, 9);
    }
    initClock(): void {
        // 時間計測用
        this.three.clock = new THREE.Clock();
    }
    initRenderer(): void {
        // レンダラーを作成
        this.three.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true, //背景色を設定しないとき、背景を透明にする
        });
        // this.three.renderer.setClearColor(0xffffff); //背景色
        this.three.renderer.setPixelRatio(this.dpr); // retina対応
        this.three.renderer.setSize(this.winSize.wd, this.winSize.wh); // 画面サイズをセット
        this.three.renderer.physicallyCorrectLights = true;
        this.three.renderer.shadowMap.enabled = true; // シャドウを有効にする
        this.three.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // PCFShadowMapの結果から更に隣り合う影との間を線形補間して描画する
        this.elms.canvas.appendChild(this.three.renderer.domElement); // HTMLにcanvasを追加
        this.three.renderer.outputEncoding = THREE.GammaEncoding; // 出力エンコーディングを定義
    }
    setLight() {
        // 環境光源(色, 光の強さ)
        const ambientLight = new THREE.AmbientLight(0x666666);
        this.three.scene.add(ambientLight);

        const positionArr = [
            [0, 5, 0, 2],
            [-5, 3, 2, 2],
            [5, 3, 2, 2],
            [0, 3, 5, 1],
            [0, 3, -5, 2],
        ];

        for (let i = 0; i < positionArr.length; i++) {
            // 平行光源(色, 光の強さ)
            const directionalLight = new THREE.DirectionalLight(0xffffff, positionArr[i][3]);
            directionalLight.position.set(positionArr[i][0], positionArr[i][1], positionArr[i][2]);

            if (i == 0 || i == 2 || i == 3) {
                directionalLight.castShadow = true;
                directionalLight.shadow.camera.top = 50;
                directionalLight.shadow.camera.bottom = -50;
                directionalLight.shadow.camera.right = 50;
                directionalLight.shadow.camera.left = -50;
                directionalLight.shadow.mapSize.set(4096, 4096);
            }
            this.three.scene.add(directionalLight);
        }
    }
    setLoading() {
        // glTF形式の3Dモデルを読み込む
        const loader = new GLTFLoader();
        loader.load(this.srcObj, (obj) => {
            const data = obj.scene;

            this.three.redraw = data; // 3Dモデルをredrawに入れる
            data.scale.set(this.sp ? 0.5 : 1, this.sp ? 0.5 : 1, this.sp ? 0.5 : 1);
            this.three.scene.add(data); // シーンに3Dモデルを追加
            this.flg.loaded = true;
            this.rendering(); // レンダリングを開始する
        });
    }
    rendering(): void {
        // レンダリングを実行
        requestAnimationFrame(this.rendering.bind(this));
        this.three.renderer.render(this.three.scene, this.three.camera);
        this.animate(); // アニメーション開始
    }
    animate() {
        gsap.config({
            force3D: true,
        });
        const tl = gsap.timeline({
            paused: true,
            defaults: {
                duration: 0.5,
                ease: 'power2.easeOut',
            },
        });
        tl.to(this.elms.canvas, {
            duration: 1,
            ease: 'power2.ease',
            opacity: 1,
        });
        tl.to(
            this.elms.mvTitle,
            {
                y: 0,
            },
            1
        );
        tl.to(
            this.mvSubText,
            {
                stagger: 0.05,
                y: 0,
            },
            1
        );
        tl.to(
            this.elms.mvHomeLink,
            {
                y: 0,
            },
            1.8
        );
        tl.to(
            this.elms.mvGitLink,
            {
                y: 0,
            },
            1.8
        );
        tl.to(
            this.elms.mvNoteLink,
            {
                y: 0,
            },
            1.8
        );
        tl.play();
    }
    scrollAnimate(): void {
        gsap.registerPlugin(ScrollTrigger);

        ScrollTrigger.defaults({
            immediateRender: false,
            scrub: 0.5,
        });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.mv',
                start: 'top top',
                endTrigger: '.area__no-07',
                end: 'bottom bottom',
                scrub: 1,
            },
        });
        tl.to(this.three.camera.position, {
            x: this.sp ? 0 : -1.5,
            y: 0,
            z: 9,
        });
        tl.to(this.three.scene.rotation, {
            x: 1,
            y: 1.55,
            z: 0,
        });
        tl.to(this.three.camera.rotation, {
            x: 0,
            y: 0.1,
            z: 0,
        });
        tl.to(this.three.camera.rotation, {
            x: 0,
            y: -0.1,
            z: 0,
        });
        tl.to(this.three.camera.rotation, {
            x: 0,
            y: 0,
            z: 0,
        });
        tl.to(this.three.scene.rotation, {
            x: 1,
            y: 3.15,
            z: 0,
        });
        tl.to(this.three.scene.position, {
            x: -1.5,
            y: 0,
            z: 5,
        });
        tl.to(this.three.scene.position, {
            x: this.sp ? 3 : 5.5,
            y: 0,
            z: 5,
        });
        tl.to(this.three.scene.rotation, {
            x: 1,
            y: 0,
            z: 0,
        });
        tl.to(this.three.scene.position, {
            x: this.sp ? 0 : -3,
            y: 0,
            z: 1,
        });
        tl.to(this.three.scene.rotation, {
            x: 1.4,
            y: 0.8,
            z: -1.4,
        });
        tl.to(this.three.scene.position, {
            x: this.sp ? 0 : -2,
            y: 0,
            z: 5,
        });
    }
    handleEvents(): void {
        // リサイズイベント登録
        window.addEventListener(
            'resize',
            throttle(() => {
                this.handleResize();
            }, 100),
            false
        );
    }
    handleResize(): void {
        // リサイズ処理
        this.winSize = {
            wd: window.innerWidth,
            wh: window.innerHeight,
        };
        this.dpr = Math.min(window.devicePixelRatio, 2);
        if (this.three.camera) {
            // カメラの位置更新
            this.three.camera.aspect = this.winSize.wd / this.winSize.wh;
            this.three.camera.updateProjectionMatrix();
        }
        if (this.three.renderer) {
            // レンダラーの大きさ更新
            this.three.renderer.setSize(this.winSize.wd, this.winSize.wh);
            this.three.renderer.setPixelRatio(this.dpr);
        }
    }
}
