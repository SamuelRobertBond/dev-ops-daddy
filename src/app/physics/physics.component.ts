import { ImplicitReceiver } from '@angular/compiler';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as Matter from 'matter-js';
import { Bodies, Body, Composite, Constraint, Engine, Events, IPair, Mouse, MouseConstraint, Render, Runner, World } from 'matter-js';
import { NotesService } from '../notes/services/notes.service';

@Component({
  selector: 'app-physics',
  templateUrl: './physics.component.html',
  styleUrls: ['./physics.component.scss']
})
export class PhysicsComponent implements OnInit, AfterViewInit {

  @ViewChild("physicsCanvas")
  canvasElmRef: ElementRef<HTMLCanvasElement>
  canvas: HTMLCanvasElement

  engine: Engine
  render: Render
  runner: Runner
  world: World
  mouse: Mouse

  marbles: any[]
  mouseConstraint: MouseConstraint

  updateInterval

  readonly WALL_OPACITY = 1;
  readonly JAR_OPACITY = .5;

  readonly NOTE_WIDTH = 48;
  readonly NOTE_HEIGHT = 48;
  readonly NOTE_ADD_DEVIATION = 20

  constructor(private notesService: NotesService) { }

  ngOnInit() {
    this.notesService.getIncomingNoteStream().subscribe(async (n) => {
      let rand = Math.random() * (Math.random() > .5 ? 1 : -1)

      if (n.collisionLayer >= 32) {
        throw new Error("Collision layer must be less than 32")
      }

      n.collisionLayer = n.collisionLayer != null ? 2 ** n.collisionLayer : 1

      let body = Bodies.rectangle(400 + (this.NOTE_ADD_DEVIATION * rand), 300, n.width != null ? n.width : this.NOTE_WIDTH, n.height != null ? n.height : this.NOTE_HEIGHT, {
        restitution: .01,
        render: {
          sprite: {
            texture: n.imageUrl,
            xScale: 1,
            yScale: 1
          }
        },
        collisionFilter: {
          category: 2 ** n.collisionLayer,
          group: n.collisionLayer,
          mask: 1
        },
        plugin: { type: n.ignoreNote != true ? "note" : "image", data: n }
      })

      // Get Image
      await this.setBodyRenderScale(n.imageUrl, body)
      World.addBody(this.world, body)
    })

  }

  async ngAfterViewInit() {

    this.canvas = this.canvasElmRef.nativeElement;
    this.canvas.style.width = "98vw";
    this.canvas.style.height = "98vh";


    this.engine = Engine.create();
    this.world = this.engine.world
    this.render = Render.create({
      engine: this.engine,
      canvas: this.canvas,
      options: {
        wireframes: false
      }
    })

    Events.on(this.engine, "collisionStart", (data) => {
      for (let p of data.pairs) {
        this.processCollision(p)
      }
    })

    this.onResize()

    this.runner = Runner.create();

    await this.createWalls()
    this.createSensors()

    Render.run(this.render);
    Runner.run(this.runner, this.engine);


    this.initMouseConstraint()
  }


  private async createWalls() {

    let collisionFilter: Matter.ICollisionFilter = {
      category: 1,
      mask: 4294967295 // Bitmask 2^32 - 1
    }



    let walls = [
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true, render: { opacity: this.WALL_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(400, 600, 800, 50, { isStatic: true, render: { opacity: this.WALL_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true, render: { opacity: this.WALL_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true, render: { opacity: this.WALL_OPACITY }, collisionFilter: collisionFilter }),

      Bodies.rectangle(250, 425, 50, 300, { isStatic: true, render: { opacity: this.JAR_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(550, 425, 50, 300, { isStatic: true, render: { opacity: this.JAR_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(280, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * 45, render: { opacity: this.JAR_OPACITY }, collisionFilter: collisionFilter }),
      Bodies.rectangle(520, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * -45, render: { opacity: this.JAR_OPACITY }, collisionFilter: collisionFilter })
    ]

    for (let w of walls) {
      World.addBody(this.world, w)
    }

    let jar = Bodies.rectangle(400, 375, 350, 440, {
      isStatic: true, isSensor: true, render: {
        opacity: 1, sprite: {
          texture: "/assets/jar.png",
          xScale: 1,
          yScale: 1
        }
      }, collisionFilter: collisionFilter
    })

    await this.setBodyRenderScale(jar.render.sprite.texture, jar)

    World.addBody(this.world, jar)

  }

  private createSensors() {

    Bodies.rectangle(520, 255, 50, 100, { isSensor: true })
    World.add(this.world, Bodies.rectangle(400, 210, 205, 10, { isStatic: true, render: { opacity: 0 }, isSensor: true, plugin: { type: "lid" } }))
  }

  private initMouseConstraint() {
    this.mouse = Mouse.create(this.render.canvas)
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: this.mouse,
      constraint: {
        stiffness: 0.02,
        render: {
          visible: false
        }
      } as any // Type definition for this is fucked up
    })
    Composite.add(this.world, this.mouseConstraint)
  }

  private async processCollision(pair: IPair) {
    let a = pair.bodyA;
    let b = pair.bodyB;

    // console.log(a.plugin, b.plugin)

    if (a == null || b == null) {
      return; // Cant do shit
    }

    if (b.plugin?.type == "note") {
      let tmp = a;
      a = b;
      b = tmp;
    }

    if (a.plugin?.type != "note" || b.plugin?.type != "lid") {
      return; // Nothing to do as it does not meet our criteria
    }



    this.mouseConstraint.constraint.stiffness = 0
    let result = await this.notesService.removeFromJar(a.plugin.data)
    if (result == true) {
      Composite.remove(this.world, <any>this.mouseConstraint)
      this.initMouseConstraint();
    } else {
      this.mouseConstraint.constraint.stiffness = 0.02
    }

  }

  onResize() {
    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: this.canvas.width, y: this.canvas.height }
    });
  }

  private async setBodyRenderScale(url: string, body: Body): Promise<void> {
    return new Promise((res) => {
      let img = new Image()
      img.src = url

      let imageLoader = document.getElementById("image-loader");

      img.onload = () => {
        imageLoader.removeChild(img)
        body.render.sprite.xScale = (body.bounds.max.x - body.bounds.min.x) / img.width
        body.render.sprite.yScale = (body.bounds.max.y - body.bounds.min.y) / img.height
        res()
      }

      // Load Image
      imageLoader.appendChild(img)
    })
  }

}
