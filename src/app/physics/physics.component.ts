import { ImplicitReceiver } from '@angular/compiler';
import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
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

  readonly NOTE_ADD_DEVIATION = 20

  constructor(private notesService: NotesService) {}

  ngOnInit() {
    this.notesService.getIncomingNoteStream().subscribe((n) => {
      let rand = Math.random() * (Math.random() > .5 ? 1 : -1)

      let body = Bodies.rectangle(400 + (this.NOTE_ADD_DEVIATION * rand), 300, 48, 48, {
        restitution: .6,
        render: {
          sprite: {
            texture: n.imageUrl,
            xScale: 1,
            yScale: 1
          }
        },
        plugin: { type: "note", data: n }
      })

      // Get Image
      let img = new Image()
      img.src = n.imageUrl

      let imageLoader = document.getElementById("image-loader");

      img.onload = () => {

        // Scale texture to body size
        body.render.sprite.xScale = (body.bounds.max.x - body.bounds.min.x) / img.width
        body.render.sprite.yScale = (body.bounds.max.y - body.bounds.min.y) / img.height

        imageLoader.removeChild(img)

        World.add(this.world, body)
      }

      // Load Image
      imageLoader.appendChild(img)


    })

  }

  ngAfterViewInit(): void {

    this.canvas = this.canvasElmRef.nativeElement;
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

    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: 800, y: 600 }
    });

    this.runner = Runner.create();

    this.createWalls()
    this.createSensors()

    Render.run(this.render);
    Runner.run(this.runner, this.engine);


    this.initMouseConstraint()
  }


  private createWalls() {

    let walls = [
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true, render: { opacity: 0 } }),
      Bodies.rectangle(400, 600, 800, 50, { isStatic: true, render: { opacity: 0 } }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true, render: { opacity: 0 } }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true, render: { opacity: 0 } }),
      Bodies.rectangle(250, 425, 50, 300, { isStatic: true, render: { opacity: 0 } }),
      Bodies.rectangle(550, 425, 50, 300, { isStatic: true, render: { opacity: 0 } }),

      Bodies.rectangle(280, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * 45, render: { opacity: 0 } }),
      Bodies.rectangle(520, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * -45, render: { opacity: 0 } })
    ]

    for (let w of walls) {
      World.addBody(this.world, w)
    }

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
    }else{
      this.mouseConstraint.constraint.stiffness = 0.02
    }

  }

}
