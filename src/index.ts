import {
  AssetManifest,
  AssetType,
  Mesh,
  MeshBasicMaterial,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
  BoxGeometry,
  SphereGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
  IBLGradient,
  DirectionalLight,   // 🔹 Llum direccional (tipus “sol”)
  AmbientLight,        // 🔹 Llum ambiental suau

} from "@iwsdk/core";

import {
  AudioSource,
  DistanceGrabbable,
  MovementMode,
  Interactable,
  PanelUI,
  PlaybackMode,
  ScreenSpace,
  OneHandGrabbable,
} from "@iwsdk/core";

import { EnvironmentType, LocomotionEnvironment } from "@iwsdk/core";

import { PanelSystem } from "./panel.js";

import { Robot } from "./robot.js";

import { RobotSystem } from "./robot.js";

const assets: AssetManifest = {
  chimeSound: {
    url: "/audio/chime.mp3",
    type: AssetType.Audio,
    priority: "background",
  },
  webxr: {
    url: "/textures/webxr.png",
    type: AssetType.Texture,
    priority: "critical",
  },
  environmentDesk: {
    url: "/gltf/environmentDesk/environmentDesk.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  plantSansevieria: {
    url: "/gltf/plantSansevieria/plantSansevieria.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
  robot: {
    url: "/gltf/robot/robot.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
};

// Passa el manifest al World.create
World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    // Optional structured features; layers/local-floor are offered by default
    features: { handTracking: true, layers: true },
  },
  features: {
    locomotion: true,
    grabbing: true,
    physics: false,
    sceneUnderstanding: false,
  },
  render: {
    defaultLighting: false, // 🔹 Desactiva la IBL per defecte d'IWSDK
  },
}).then((world) => {

   
  // 🔹 Entitat per a la il·luminació global HDR
  const levelRoot = world.activeLevel.value;

  levelRoot.addComponent(IBLGradient, {
    sky:     [0.12, 0.18, 0.35, 1.0],   // Blau fosca (llum de lluna)
  equator: [0.25, 0.32, 0.45, 1.0],   // Horitzó fred
  ground:  [0.10, 0.10, 0.12, 1.0],   // Sòl molt fosc
  intensity: 0.8,
});

// Llums tradicionals (Three.js style) afegides directament a l'escena
const directionalLight=new DirectionalLight(0xffffff,1);

directionalLight.position.set(5,5,5);
// Situa la llum a la posició (x=5, y=5, z=5) per il·luminar des d'un angle superior

world.scene.add(directionalLight);
// Afegeix la llum direccional a l'escena del món

const ambientLight=new AmbientLight(0x404040,0.4);
//Crea una llum ambiental grisosa suau amb intensitat 0.4

world.scene.add(ambientLight);
// Afegeix la llum ambiental a l'escena per evitar zones massa fosques

  // 3) Exemple de CÀRREGA A TEMPS D’EXECUCIÓ
AssetManager.loadGLTF('/gltf/dynamic-object.glb', 'dynamicModel')
  .then(() => {
    const gltf = AssetManager.getGLTF('dynamicModel');
    if (!gltf) {
      console.error("No s'ha trobat el GLTF 'dynamicModel' després de carregar-lo");
      return;
    }

    const dynamicMesh = gltf.scene;   // aquí ja sap que no és undefined
    dynamicMesh.position.set(0, 2, -3);

    // Fem l'entitat a partir del mesh
    const entity = world.createTransformEntity(dynamicMesh);
    // (si vols, guarda 'entity' en alguna estructura teva)
  })
  .catch((error) => {
    console.error('Failed to load dynamic asset:', error);
  });
  
  const { camera } = world;

  camera.position.set(-4, 1.5, -6);
  camera.rotateY(-Math.PI * 0.75);

  const { scene: envMesh } = AssetManager.getGLTF("environmentDesk")!;
  envMesh.rotateY(Math.PI);
  envMesh.position.set(0, -0.1, 0);
  world
    .createTransformEntity(envMesh)
    .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  const { scene: plantMesh } = AssetManager.getGLTF("plantSansevieria")!;
  plantMesh.position.set(1.2, 0.85, -1.8);

  world
    .createTransformEntity(plantMesh)
    .addComponent(Interactable)
    .addComponent(DistanceGrabbable, {
      translate: true,
      rotate: true,
      scale: true,
      movementMode: MovementMode.MoveFromTarget,
    });

  const { scene: robotMesh } = AssetManager.getGLTF("robot")!;
  // defaults for AR
  robotMesh.position.set(-1.2, 0.4, -1.8);
  robotMesh.scale.setScalar(1);

  robotMesh.position.set(-1.2, 0.95, -1.8);
  robotMesh.scale.setScalar(0.5);

  // Posiciona i escala la malla
  robotMesh.position.set(0,1,-3);
  robotMesh.scale.setScalar(0.5);

  const robotEntity =world.createTransformEntity(robotMesh);

  world
    .createTransformEntity(robotMesh)
    .addComponent(Interactable)
    .addComponent(OneHandGrabbable, {
      // Fa que sigui agafable amb una mà
      translate: true, // Es pot moure al voltant
      rotate: true, // es pot rotar
    })


    .addComponent(Robot)
    .addComponent(AudioSource, {
      src: "/audio/chime.mp3",
      maxInstances: 3,
      playbackMode: PlaybackMode.FadeRestart,
    });

  const panelEntity = world
    .createTransformEntity()
    .addComponent(PanelUI, {
      config: "/ui/welcome.json",
      maxHeight: 0.8,
      maxWidth: 1.6,
    })
    .addComponent(Interactable)
    .addComponent(ScreenSpace, {
      top: "20px",
      left: "20px",
      height: "40%",
    });
  panelEntity.object3D!.position.set(0, 1.29, -1.9);

// Obtenir la textura carregada
// Degut a l'estratègia de càrrega crítica, ens podem assegurar que esta disponible aquí
const webxrTexture=AssetManager.getTexture('webxr');

if (!webxrTexture) {
  console.error("No s'ha pogut trobar la textura 'webxr'");
  return; // o bé 'throw', o el que et convingui
}

// Configura l'espai de colors adequat per a la textura
webxrTexture.colorSpace=SRGBColorSpace;

// Crea un material utilitzant la textura
const logoMaterial = new MeshBasicMaterial({
  map: webxrTexture,
  transparent: true, // PNG amb transparència
});

// Crea un pla per mostrar el logo de WebXR
const logoGeometry = new PlaneGeometry(1.13, 0.32);
const logoPlane= new Mesh(logoGeometry, logoMaterial);
logoPlane.position.set(0, 1.8,-1.9);

// Crea una entitat de transformació
const logoEntity= world.createTransformEntity(logoPlane);


  const webxrLogoTexture = AssetManager.getTexture("webxr")!;
  webxrLogoTexture.colorSpace = SRGBColorSpace;
  const logoBanner = new Mesh(
    new PlaneGeometry(3.39, 0.96),
    new MeshBasicMaterial({
      map: webxrLogoTexture,
      transparent: true,
    }),
  );
  world.createTransformEntity(logoBanner);
  logoBanner.position.set(0, 1, 1.8);
  logoBanner.rotateY(Math.PI);

// Objectes primitius, afegits abans de la trucada
//  a world.registerSystem(). Assegura que els objectes
//  es creen despres de la inicialitzacio del mon pero
//  abans de que aualsevol sistema que pugui necessitar
//  interactuar amb ells comenci a executar-se

// Crea un cub vermell
const cubeGeometry = new BoxGeometry(1,1,1);
const redMaterial = new MeshStandardMaterial({ color: 0xff3333});
const cube = new Mesh(cubeGeometry, redMaterial);
cube.position.set(-1, 0, -2);
const cubeEntity = world.createTransformEntity(cube);

// Crea una esfera verda
const sphereGeometry = new SphereGeometry(0.5, 64, 64);
const shinyMaterial = new MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.05,
});
const greenMaterial = new MeshStandardMaterial({ color: 0x33f33});
// const sphere = new Mesh(sphereGeometry, greenMaterial);
const sphere = new Mesh(sphereGeometry, shinyMaterial);
// sphere.position.set(1,0,-2);
sphere.position.set(0, 1.2, -2);

const sphereEntity = world.createTransformEntity(sphere);

// Crea un pla de planta blau

const floorGeometry = new PlaneGeometry(4,4);
const blueMaterial = new MeshStandardMaterial({ color:0x3333ff});
const floor = new Mesh(floorGeometry, blueMaterial);
floor.position.set(0,-1,-2);
floor.rotation.x=-Math.PI/2; // Rota per a ser horitzontal
const floorEntity=world.createTransformEntity(floor);

  world.registerSystem(PanelSystem).registerSystem(RobotSystem);
});