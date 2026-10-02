import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewChild,
  inject
} from '@angular/core';
import {
  Application,
  Assets,
  Container,
  DisplacementFilter,
  Graphics,
  Sprite,
  Texture
} from 'pixi.js';

@Component({
  selector: 'app-animated-wave-background',
  standalone: true,
  template: '<div #canvasHost class="canvas-host" aria-hidden="true"></div>',
  styleUrl: './animated-wave-background.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimatedWaveBackgroundComponent implements AfterViewInit {
  private static readonly DESIGN_WIDTH = 1920;
  private static readonly DESIGN_HEIGHT = 1024;
  private static readonly BACKGROUND_URL = '/assets/login/1921.png';
  private static readonly DISPLACEMENT_URL = '/assets/login/wave-displacement.png';

  private static readonly MAP_WIDTH = 2304;
  private static readonly MAP_HEIGHT = 1280;
  private static readonly MAP_BASE_X = -192;
  private static readonly MAP_BASE_Y = -128;

  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('canvasHost', { static: true })
  private canvasHost!: ElementRef<HTMLDivElement>;

  private app: Application | null = null;
  private root: Container | null = null;
  private displacementSprite: Sprite | null = null;
  private displacementFilter: DisplacementFilter | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private visibilityListener: (() => void) | null = null;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.dispose());
  }

  async ngAfterViewInit(): Promise<void> {
    if (typeof window === 'undefined') return;

    const host = this.canvasHost.nativeElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotion.matches) {
      host.dataset['waveStatus'] = 'disabled-reduced-motion';
      return;
    }

    try {
      await this.createScene();
    } catch (error) {
      host.dataset['waveStatus'] = 'error';
      console.error('[Kardex waves] No fue posible inicializar PixiJS.', error);
    }
  }

  private async createScene(): Promise<void> {
    const host = this.canvasHost.nativeElement;
    host.dataset['waveStatus'] = 'initializing';

    const debugMode = new URLSearchParams(window.location.search).get('waveDebug') === '1';
    const app = new Application();

    await app.init({
      preference: 'webgl',
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      resizeTo: host
    });

    if (this.destroyed) {
      app.destroy(true);
      return;
    }

    this.app = app;

    const canvas = app.canvas as HTMLCanvasElement;
    canvas.setAttribute('aria-hidden', 'true');
    canvas.dataset['kardexWaves'] = 'displacement-active';
    canvas.dataset['waveDebug'] = String(debugMode);
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.display = 'block';
    host.appendChild(canvas);

    const [backgroundTexture, displacementTexture] = await Promise.all([
      Assets.load<Texture>(AnimatedWaveBackgroundComponent.BACKGROUND_URL),
      Assets.load<Texture>(AnimatedWaveBackgroundComponent.DISPLACEMENT_URL)
    ]);

    if (this.destroyed) return;

    const root = new Container();
    this.root = root;
    app.stage.addChild(root);

    // The CSS background stays fixed underneath. This filtered sprite is only
    // visible inside the wave mask, so the form, logo and background lighting
    // remain stable while the wave pixels themselves are distorted.
    const filteredWaves = new Container();
    const background = new Sprite(backgroundTexture);
    background.width = AnimatedWaveBackgroundComponent.DESIGN_WIDTH;
    background.height = AnimatedWaveBackgroundComponent.DESIGN_HEIGHT;
    filteredWaves.addChild(background);

    const waveMask = this.createWaveMask();
    filteredWaves.mask = waveMask;

    // The displacement texture is intentionally larger than the design frame,
    // so it can travel horizontally without exposing an uncovered edge.
    const displacementSprite = new Sprite(displacementTexture);
    displacementSprite.width = AnimatedWaveBackgroundComponent.MAP_WIDTH;
    displacementSprite.height = AnimatedWaveBackgroundComponent.MAP_HEIGHT;
    displacementSprite.position.set(
      AnimatedWaveBackgroundComponent.MAP_BASE_X,
      AnimatedWaveBackgroundComponent.MAP_BASE_Y
    );

    // The filter samples this sprite's RGB channels. Keep it practically
    // invisible while still present in the scene graph so its transform updates.
    displacementSprite.alpha = 0.001;
    this.displacementSprite = displacementSprite;

    const displacementFilter = new DisplacementFilter({
      sprite: displacementSprite,
      scale: {
        x: debugMode ? 120 : 52,
        y: debugMode ? 34 : 10
      },
      padding: debugMode ? 160 : 90,
      resolution: 1
    });
    this.displacementFilter = displacementFilter;
    filteredWaves.filters = [displacementFilter];

    root.addChild(displacementSprite);
    root.addChild(waveMask);
    root.addChild(filteredWaves);

    this.resizeScene();
    this.resizeObserver = new ResizeObserver(() => this.resizeScene());
    this.resizeObserver.observe(host);

    const startedAt = performance.now();

    app.ticker.add(() => {
      if (!this.displacementSprite || !this.displacementFilter) return;

      const seconds = (performance.now() - startedAt) / 1000;
      const speed = debugMode ? 1.25 : 0.42;

      // Moving the displacement map changes which red/green values affect each
      // background pixel, producing a true flowing/deforming wave instead of a
      // simple translated copy of the PNG.
      this.displacementSprite.x =
        AnimatedWaveBackgroundComponent.MAP_BASE_X
        + Math.sin(seconds * speed) * (debugMode ? 170 : 105);

      this.displacementSprite.y =
        AnimatedWaveBackgroundComponent.MAP_BASE_Y
        + Math.cos(seconds * speed * 0.73) * (debugMode ? 70 : 34);

      // A slow scale pulse prevents the deformation from feeling mechanically
      // repetitive. Normal mode stays deliberately subtle; debug mode is obvious.
      this.displacementFilter.scale.x =
        (debugMode ? 120 : 52)
        + Math.sin(seconds * 0.58) * (debugMode ? 42 : 14);

      this.displacementFilter.scale.y =
        (debugMode ? 34 : 10)
        + Math.cos(seconds * 0.44) * (debugMode ? 12 : 4);
    });

    this.visibilityListener = () => {
      if (!this.app) return;
      if (document.hidden) this.app.ticker.stop();
      else this.app.ticker.start();
    };
    document.addEventListener('visibilitychange', this.visibilityListener);

    host.dataset['waveStatus'] = 'ready';
    console.info(
      `[Kardex waves] DisplacementFilter activo${debugMode ? ' (DEBUG)' : ''}.`,
      'Para una prueba exagerada abre /login?waveDebug=1'
    );
  }

  private createWaveMask(): Graphics {
    const mask = new Graphics();

    // Left ribbon / luminous lower-left wave.
    mask
      .moveTo(0, 250)
      .bezierCurveTo(115, 270, 120, 590, 300, 775)
      .bezierCurveTo(500, 985, 745, 970, 1040, 1024)
      .lineTo(0, 1024)
      .closePath()
      .fill(0xffffff);

    // Main central/lower wave field. This is the most visible region on narrow
    // mobile viewports because the desktop background is center-cropped.
    mask
      .moveTo(180, 535)
      .bezierCurveTo(500, 470, 690, 620, 925, 660)
      .bezierCurveTo(1120, 695, 1240, 565, 1490, 595)
      .bezierCurveTo(1660, 615, 1780, 675, 1920, 705)
      .lineTo(1920, 1024)
      .lineTo(180, 1024)
      .closePath()
      .fill(0xffffff);

    // Upper-right filament fan.
    mask
      .moveTo(1030, 0)
      .bezierCurveTo(1150, 150, 1190, 420, 1115, 690)
      .bezierCurveTo(1400, 665, 1690, 555, 1920, 455)
      .lineTo(1920, 0)
      .closePath()
      .fill(0xffffff);

    // Lower-right dense ribbon.
    mask
      .moveTo(1180, 770)
      .bezierCurveTo(1430, 685, 1640, 640, 1920, 515)
      .lineTo(1920, 1024)
      .lineTo(1260, 1024)
      .closePath()
      .fill(0xffffff);

    return mask;
  }

  private resizeScene(): void {
    if (!this.app || !this.root) return;

    const width = this.app.screen.width;
    const height = this.app.screen.height;

    // Match the CSS background behaviour: preserve the 1920x1024 aspect ratio,
    // cover the viewport and crop from the center on narrow/mobile screens.
    const scale = Math.max(
      width / AnimatedWaveBackgroundComponent.DESIGN_WIDTH,
      height / AnimatedWaveBackgroundComponent.DESIGN_HEIGHT
    );

    const renderedWidth = AnimatedWaveBackgroundComponent.DESIGN_WIDTH * scale;
    const renderedHeight = AnimatedWaveBackgroundComponent.DESIGN_HEIGHT * scale;

    this.root.scale.set(scale);
    this.root.position.set(
      (width - renderedWidth) / 2,
      (height - renderedHeight) / 2
    );
  }

  private dispose(): void {
    this.destroyed = true;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.visibilityListener && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityListener);
      this.visibilityListener = null;
    }

    if (this.app) {
      this.app.destroy(true);
      this.app = null;
    }

    this.root = null;
    this.displacementSprite = null;
    this.displacementFilter = null;
  }
}
