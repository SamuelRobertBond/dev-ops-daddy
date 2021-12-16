import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Bodies, Composite, Engine, Events, IPair, Mouse, MouseConstraint, Render, Runner, World } from 'matter-js';
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

  marbles: any[]
  mouseConstraint: MouseConstraint

  updateInterval

  readonly NOTE_ADD_DEVIATION = 20

  constructor(private notesService: NotesService) { }

  ngOnInit() {
    this.notesService.getIncomingNoteStream().subscribe((n) => {
      let rand = Math.random() * (Math.random() > .5 ? 1 : -1)
      World.add(this.world, Bodies.circle(400 + (this.NOTE_ADD_DEVIATION * rand), 300, 24, { restitution: .6, plugin: { type: "note", data: n } }))
    })
  }

  ngAfterViewInit(): void {

    this.canvas = this.canvasElmRef.nativeElement;
    this.engine = Engine.create();
    this.world = this.engine.world
    this.render = Render.create({
      engine: this.engine,
      canvas: this.canvas,
    })

    Events.on(this.engine, "collisionStart", (data) => {
      for(let p of data.pairs){
        this.processCollision(p)
      }
    })

    let mouse = Mouse.create(this.render.canvas)
    this.mouseConstraint = MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.02,
        render: {
          visible: false
        }
      } as any // Type definition for this is fucked up
    })

    Composite.add(this.world, this.mouseConstraint)

    Render.lookAt(this.render, {
      min: { x: 0, y: 0 },
      max: { x: 800, y: 600 }
    });

    this.runner = Runner.create();

    this.createWalls()
    this.createSensors()

    Render.run(this.render);
    Runner.run(this.runner, this.engine);

  }


  private createWalls() {

    let walls = [
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(250, 425, 50, 300, { isStatic: true }),
      Bodies.rectangle(550, 425, 50, 300, { isStatic: true }),

      Bodies.rectangle(280, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * 45 }),
      Bodies.rectangle(520, 255, 50, 100, { isStatic: true, angle: Math.PI / 180 * -45 })
    ]

    for (let w of walls) {
      World.addBody(this.world, w)
    }

  }

  private createSensors() {
    Bodies.rectangle(520, 255, 50, 100, { isSensor: true })
    World.add(this.world, Bodies.rectangle(400, 210, 205, 10, { isStatic: true, isSensor: true, plugin: { type: "lid" } }))
  }

  private processCollision(pair: IPair) {
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
    
    
    this.notesService.removeFromJar(a.plugin.data)
  }

}
