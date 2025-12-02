import {
  AudioUtils,
  createComponent,
  createSystem,
  Pressed,
  Vector3,
} from "@iwsdk/core";

// 1. Tag component: només indica que una entitat és un "Robot"
export const Robot = createComponent("Robot", {});

// 2. System amb dos consultes
export class RobotSystem extends createSystem({
  robot: { required: [Robot] }, // Tots els robots
  robotClicked: { required: [Robot, Pressed] }, // Robots quan es fan click
}) {
  private lookAtTarget!: Vector3;
  private vec3!: Vector3;

  // init() - Es truca quan el sistema es registra al món 
  init(){
    this.lookAtTarget = new Vector3();
    this.vec3 = new Vector3();

    // Subscripci¡ó a robots clicats: reproduir l'àudio de l'entitat
    this.queries.robotClicked.subscribe("qualify", (entity) => {
      AudioUtils.play(entity);
    });
  }
// 4.- update() - es crida a cada frame
  update() { 
    this.queries.robot.entities.forEach((entity) => {
      // Posició del cap del jugador
      this.player.head.getWorldPosition(this.lookAtTarget);
      // Posició del robot
      const spinnerObject = entity.object3D!;
      spinnerObject.getWorldPosition(this.vec3);
      // Mantenir el robot horitzontal (no mirar amunt/avall)
      this.lookAtTarget.y = this.vec3.y;
      // Fer que el robot "miri" el jugador
      spinnerObject.lookAt(this.lookAtTarget);
    });
  }
}

