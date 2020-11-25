
import * as THREE from "https://unpkg.com/three@0.122.0/build/three.module.js";
import {MTLLoader} from "https://unpkg.com/three@0.122.0/examples/jsm/loaders/MTLLoader.js";
import {OBJLoader} from "https://unpkg.com/three@0.122.0/examples/jsm/loaders/OBJLoader.js";
import {PointerLockControls} from 'https://unpkg.com/three@0.122.0/examples/jsm/controls/PointerLockControls.js';

//Code derived from https://threejs.org/examples/#misc_controls_pointerlock
//Original github page: https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
let camera, scene, renderer, controls;

const objects = [];

var models = {
	gun: {
		obj:"models/ump47.obj",
		mtl:"models/ump47.mtl",
		mesh: undefined,
		castShadow:false
	},
	tree: {
		obj:"models/tree.obj",
		mtl:"models/tree.mtl",
		mesh: undefined,
		castShadow:false
	}
}
var meshes = {};

var RESOURCES_LOADED = false;
var loadingManager;

let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();

var bullets = [];
const bullet_speed = 200;

var targets = [];

var spawn_target_ready = false;

const MAP_ENDS = 300;

//SCORE:
var points = 0;
var ammo = 12;

gameover.style.display = 'none';

init();
animate();

function init() {
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xadd8e6);
	scene.fog = new THREE.Fog(0xffffff, 0, 750);

	//Light
	var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.5 );
	light.position.set(0.5, 1, 0.75);
	light.castShadow = true;
	scene.add( light );

	light = new THREE.DirectionalLight( 0xf5f4da, 1, 20 );
	light.position.set( 0, 200, 0 ); //default; light shining from top
	light.castShadow = true; // default false
	scene.add(light);

	controls = new PointerLockControls(camera, document.body);

	loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		//console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		//console.log("loaded all resources");
		RESOURCES_LOADED = true;
		onResourcesLoaded();
	};

	spawn_target_ready = true;

	document.addEventListener('click', function () {
		controls.lock();
		if(ammo>0) shoot();

	}, false );

	controls.addEventListener('lock', function () {
		instructions.style.display = 'none';
		//blocker.style.display = 'none';
	} );

	controls.addEventListener('unlock', function () {
		blocker.style.display = 'block';
		instructions.style.display = '';
	} );

	scene.add(controls.getObject());

	const onKeyDown = function (event) {

		switch(event.keyCode) {

			case 38: // up
			case 87: // w
				moveForward = true;
				break;

			case 37: // left
			case 65: // a
				moveLeft = true;
				break;

			case 40: // down
			case 83: // s
				moveBackward = true;
				break;

			case 39: // right
			case 68: // d
				moveRight = true;
				break;

			case 32: // space
				if ( canJump === true ) velocity.y += 250;
				canJump = false;
				break;

		}

	};

	const onKeyUp = function ( event ) {

		switch ( event.keyCode ) {

			case 38: // up
			case 87: // w
				moveForward = false;
				break;

			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	};

	document.addEventListener('keydown', onKeyDown, false);
	document.addEventListener('keyup', onKeyUp, false);

	raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10);

	// floor
	var meshFloor = new THREE.Mesh(
		new THREE.PlaneGeometry(500,500),
		new THREE.MeshPhongMaterial({color:0x66a103})
	);
	meshFloor.rotation.x -= Math.PI / 2; // Rotate the floor 90 degrees
	meshFloor.receiveShadow = true;
	scene.add(meshFloor);

	// Model/material loading!
	const objLoader1 = new OBJLoader(loadingManager);
	const mtlLoader1 = new MTLLoader(loadingManager);
	mtlLoader1.load(models['gun'].mtl, function(materials){
		materials.preload();
		objLoader1.setMaterials(materials);
		objLoader1.load(models['gun'].obj, function(meshTMP){
			meshTMP.traverse(function(node){
				if( node instanceof THREE.Mesh ){
					node.castShadow = true;
					node.receiveShadow = true;
				}
			});
			models['gun'].mesh = meshTMP;
		});
	});

	const objLoader2 = new OBJLoader(loadingManager);
	const mtlLoader2 = new MTLLoader(loadingManager);
	mtlLoader2.load(models['tree'].mtl, function(materials){
		materials.preload();
		objLoader2.setMaterials(materials);
		objLoader2.load(models['tree'].obj, function(meshTMP){
			meshTMP.traverse(function(node){
				if( node instanceof THREE.Mesh ){
					node.castShadow = true;
					node.receiveShadow = true;
				}
			});
			models['tree'].mesh = meshTMP;
		});
	});

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild(renderer.domElement);

	//Adjust window size
	window.addEventListener('resize', onWindowResize, false );

}

function onResourcesLoaded(){
	meshes["gun"] = models['gun'].mesh.clone();
	meshes["gun"].position.set(1.2,-1,-0.5);
	meshes["gun"].rotation.set(0,Math.PI/2,0);
	meshes["gun"].scale.set(0.3,0.3,0.3);
	scene.add(meshes["gun"]);
	camera.add(meshes["gun"]);

	for(var t = 0; t < 200; t++){
		var random_n1 = Math.random()*(5-MAP_ENDS/2);
		var random_n2 = Math.random()*(-MAP_ENDS/2);
		var random_m1 = Math.random()*(-MAP_ENDS);
		var random_m2 = Math.random()*(MAP_ENDS);
		var tree = models['tree'].mesh.clone();
		tree.position.set(random_n1+random_n2,0,random_m1+random_m2);
		tree.rotation.set(0,0,0);
		tree.scale.set(30,30,30);
		scene.add(tree);
	}
	for(var t = 0; t < 50; t++){
		var random_n1 = Math.random()*(-MAP_ENDS/2);
		var random_n2 = Math.random()*(-MAP_ENDS/2);
		var random_m1 = Math.random()*(-MAP_ENDS);
		var random_m2 = Math.random()*(MAP_ENDS);
		var tree = models['tree'].mesh.clone();
		tree.position.set(-(random_n1+random_n2),0,random_m1+random_m2);
		tree.rotation.set(0,0,0);
		tree.scale.set(30,30,30);
		scene.add(tree);
	}
}

function spawn_target(){
	var speed = 15;
	var random_n = Math.random();
	if(random_n > 0.5){
		random_n = 20;
	}
	else{
		random_n = -20;
		speed = -speed;
	}

	var cylinder = new THREE.Mesh( 
		new THREE.CylinderGeometry(5, 5, 1, 32), 
		new THREE.MeshBasicMaterial({color: 0xffff00})
	);
	
	var inner_cylinder = new THREE.Mesh( 
		new THREE.CylinderGeometry(3, 3, 1.2, 32), 
		new THREE.MeshBasicMaterial({color: 0xff0000})
	);
	cylinder.position.x = 100;
	cylinder.position.y = 10;
	cylinder.position.z = random_n;
	cylinder.rotation.z = Math.PI/2;
	cylinder.add(inner_cylinder);
	scene.add(cylinder);
	targets.push([cylinder,speed]);
	setTimeout(spawn_target, 2600);
}

function shoot(){
	var bmaterial = new THREE.MeshPhongMaterial({color:0x808080});
	bmaterial.shininess = 80.0;
	bmaterial.specular = new THREE.Color(0xffffff);
	bmaterial.side = THREE.DoubleSide;
	var bullet = new THREE.Mesh(
		new THREE.SphereGeometry(10, 10, 10),
		bmaterial
	);
	bullet.scale.set(0.05,0.05,0.05);
	meshes["gun"].getWorldPosition(bullet.position);
	bullet.position.y+=0.6;
	bullet.quaternion.copy(camera.quaternion);
	scene.add(bullet);
	bullets.push(bullet);
	ammo -= 1;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function checkCollision(target){
	for (var vertexIndex = 0; vertexIndex < target.geometry.vertices.length; vertexIndex++)
	{		
		var localVertex = target.geometry.vertices[vertexIndex].clone();
		var globalVertex = localVertex.applyMatrix4(target.matrix);
		var directionVector = globalVertex.sub(target.position);
		
		var ray = new THREE.Raycaster(target.position, directionVector.clone().normalize());
		var collisionResults = ray.intersectObjects(bullets, true);
		if(collisionResults.length > 0 && collisionResults[0].distance < 5){
			console.log(collisionResults);
			points += 1;
			ammo += 1;
			return target;
		}
	}
}

function animate() {

	if(RESOURCES_LOADED == false){
		requestAnimationFrame(animate);
		return;
	}
	if(spawn_target_ready){
		spawn_target();
		spawn_target_ready = false;
	}

	requestAnimationFrame( animate );

	const time = performance.now();

	if ( controls.isLocked === true ) {

		raycaster.ray.origin.copy( controls.getObject().position );
		raycaster.ray.origin.y -= 10;

		const intersections = raycaster.intersectObjects( objects );

		const onObject = intersections.length > 0;

		const delta = ( time - prevTime ) / 1000;

		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;

		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

		direction.z = Number( moveForward ) - Number( moveBackward );
		direction.x = Number( moveRight ) - Number( moveLeft );
		direction.normalize(); // this ensures consistent movements in all directions

		if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
		if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

		if (onObject === true) {

			velocity.y = Math.max( 0, velocity.y );
			canJump = true;
		}

		for(var b = 0; b < bullets.length; b++){
			bullets[b].translateZ(-bullet_speed * delta); // move along the local z-axis
			if( bullets[b].position.z > MAP_ENDS || bullets[b].position.z < -MAP_ENDS || 
				bullets[b].position.x > MAP_ENDS || bullets[b].position.x < -MAP_ENDS ||
				bullets[b].position.y > MAP_ENDS || bullets[b].position.y < 0
			){
				scene.remove(bullets[b]);
				bullets.splice(b,1);
				if(bullets.length==0 && ammo==0){
					gameover.style.display = 'block';
					setTimeout(function(){location.reload();}, 3000);
				}
			}
		}
		
		for(var t = 0; t < targets.length; t++){
			targets[t][0].translateZ(-targets[t][1] * delta); // move along the local z-axis
			var local_target = checkCollision(targets[t][0]); //Collision detection
			if( targets[t][0].position.z > MAP_ENDS || targets[t][0].position.z < -MAP_ENDS || 
				targets[t][0].position.x > MAP_ENDS || targets[t][0].position.x < -MAP_ENDS ||
				targets[t][0].position.y > MAP_ENDS || targets[t][0].position.y < 0 || local_target
			){
				scene.remove(targets[t][0]);
				targets.splice(t,1);
			}
		}

		controls.moveRight( - velocity.x * delta );
		controls.moveForward( - velocity.z * delta );

		controls.getObject().position.y += ( velocity.y * delta ); // new behavior

		if (controls.getObject().position.y < 10) {

			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;

		}
	}

	document.getElementById("score").innerHTML = "SCORE: " + String(points);
	document.getElementById("bullets").innerHTML = "AMMO: " + String(ammo);

	prevTime = time;

	renderer.render( scene, camera );

}

