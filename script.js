// import './style.css'

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {ARButton} from 'three/addons/webxr/ARButton.js'
// import trackImage from '../images/track-image.jpeg'
if ('xr' in navigator) {
  navigator.xr.isSessionSupported('immersive-vr').then(supported => {
    if (supported) {
      // WebXR is enabled!
    } else {
       window.alert("Need to enable webXR for enable follow this process.\n 1. open new tab and enter chrome://flags\n 2. Then Find WebXR Incubations and enable.\n");
      // console.log(prompt);
      // if(prompt!==null){
      //   window.open("chrome://flags", "_blank");
      // }
      // alert("Need to enable webXR. Please enable it in chrome://flags.");
    }
  });
} else {
  // Prompt the user to enable WebXR
  alert("Your browser doesn't support WebXR. Please enable it in chrome://flags.");
}

let scene =new THREE.Scene();
let camera =new THREE.PerspectiveCamera(70,window.innerWidth/window.innerHeight,0.1,1000);
camera.position.z = 5;
let app = document.getElementById("app");
let renderer =new THREE.WebGLRenderer();
renderer.xr.enabled = true;
renderer.setSize(window.innerWidth,window.innerHeight);
app.appendChild(renderer.domElement);
let controls =new OrbitControls(camera,renderer.domElement);


//add light
let ambinetLight =new THREE.AmbientLight(0xffffff,1);
scene.add(ambinetLight);

let directionalLight = new THREE.DirectionalLight(0xffffff,1);
directionalLight.position.set(3,3,3);
scene.add(directionalLight);

let directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight,2);

scene.add(directionalLightHelper);

//create bitmap image
// let TrackImageBitMap = await createImageBitmap(trackImage);
// console.log(TrackImageBitMap);

//loader 
let loader = new GLTFLoader();
let houseModel;
loader.load("house.glb",(gltf)=>{
    houseModel = gltf.scene;
    houseModel.scale.set(0.2, 0.2, 0.2);
    houseModel.position.set(0, -2, -5);
    houseModel.matrixAutoUpdate = true;
    // houseModel.visible = false;
    scene.add(houseModel);
    console.log('Model loaded successfully');
})
// houseModel.visible = false;
// let boxGeomatery =new THREE.BoxGeometry(0.1,0.1,0.1);
// boxGeomatery.translate(0,-0.2,0);
// let boxMaterial =new THREE.MeshStandardMaterial({color:"red",side:THREE.DoubleSide})
// let box =new THREE.Mesh(boxGeomatery,boxMaterial);
// box.position.set(0,0,0)
// // box.scale.set(20,20,20)
// box.visible = false;
// box.matrixAutoUpdate=false;
// scene.add(box);

window.addEventListener("resize",()=>{
  renderer.setSize(window.innerWidth,window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
})

async function loadAR(){
// let TrackImageBitMap;
let trackImage = document.getElementById("labimage");
// await fetch(trackImage).then(response=>response.blob()).then(blob=>createImageBitmap(blob)).then(bitmap=>{
//   TrackImageBitMap = bitmap;
// })
let TrackImageBitMap = await createImageBitmap(trackImage);
console.log("image loaded succefully")
//AR button

const arButton = ARButton.createButton(renderer, {
  requiredFeatures:['image-tracking'],
  trackedImages:[
    {
      image:TrackImageBitMap,
      widthInMeters:0.2,
    }
  ],
  optionalFeatures: ['dom-overlay'],
  domOverlay: { root: document.body }
});
document.body.appendChild(arButton);
}
loadAR();
function animate(){
  // window.requestAnimationFrame(animate);
  // controls.update();
  // renderer.render(scene,camera);
  renderer.setAnimationLoop((timestamp,frame)=>{
    if(frame){
      try {
        const results = frame.getImageTrackingResults();
        if (results && results.length > 0) {
          const result = results[0];
          const state = result.trackingState;
          
          if (state === 'tracked' && houseModel) {
            const referenceSpace = renderer.xr.getReferenceSpace();
            const pose = frame.getPose(result.imageSpace, referenceSpace);
            
            if (pose) {
              houseModel.visible = true;
              const matrix = new THREE.Matrix4();
              matrix.fromArray(pose.transform.matrix);
              
              // Apply position and rotation from matrix
              const position = new THREE.Vector3();
              const quaternion = new THREE.Quaternion();
              const scale = new THREE.Vector3();
              matrix.decompose(position, quaternion, scale);
              
              houseModel.position.copy(position);
              houseModel.quaternion.copy(quaternion);
              houseModel.scale.set(0.02, 0.02, 0.02);
            }
          } else {
            if (houseModel) houseModel.visible = false;
          }
        }
      } catch (error) {
        console.error('Error in animation loop:', error);
      }
    }
    controls.update();
    renderer.render(scene,camera);
  })
}

// Add session event listeners
// renderer.xr.addEventListener("sessionstart", () => {
//   console.log('AR session started');
//   if (houseModel) {
//     houseModel.visible = false;
//   }
// });

// renderer.xr.addEventListener("sessionend", () => {
//   console.log('AR session ended');
//   if (houseModel) {
//     houseModel.visible = true;
//     houseModel.position.set(0, -2, -5);
//     houseModel.scale.set(0.2, 0.2, 0.2);
//   }
// });

animate();
