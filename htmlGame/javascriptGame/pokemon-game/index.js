const canvas = document.querySelector('canvas');

const c = canvas.getContext('2d'); //canvas context


canvas.width = 1024;
canvas.height = 576;

//collisions 1d-array -> 2d array
const collisionsMap = []
for (let i = 0; i < collisions.length; i += 70) { // 70 is width of map
	collisionsMap.push(collisions.slice(i, i + 70))
}

const battleZonesMap = []
for (let i = 0; i < battleZonesData.length; i += 70) { // 70 is width of map
	battleZonesMap.push(battleZonesData.slice(i, i + 70))
}

const boundaries = []
const offset = {
	x: -735,
	y: -650
}

collisionsMap.forEach((row, i) => {
	row.forEach((symbol, j) => {
		if (symbol == 1025)
			boundaries.push(
				new BoxCollider({
					position: {
						x: j * BoxCollider.width + offset.x,
						y: i * BoxCollider.height + offset.y
					}
				})
			)
	})
})


const battleZones = []
battleZonesMap.forEach((row, i) => {
	row.forEach((symbol, j) => {
		if (symbol == 1025)
			battleZones.push(
				new BoxCollider({
					position: {
						x: j * BoxCollider.width + offset.x,
						y: i * BoxCollider.height + offset.y
					}
				})
			)
	})
})

console.log(battleZones)

const bgImage = new Image()
bgImage.src = './img/PelletTown.png';

const fgImage = new Image()
fgImage.src = './img/foregroundObjects.png';

const playerDownImage = new Image()
playerDownImage.src = './img/PlayerDown.png';

const playerUpImage = new Image()
playerUpImage.src = './img/PlayerUp.png';

const playerLeftImage = new Image()
playerLeftImage.src = './img/PlayerLeft.png';

const playerRightImage = new Image()
playerRightImage.src = './img/PlayerRight.png';


//player height:192 
//player width: 68
const player = new Sprite({
	position: {
		x: canvas.width / 2 - 192 / 4 / 2,
		y: canvas.height / 2 - 68 / 2
	},
	image: playerDownImage,
	frames: {
		max: 4,
		hold: 10
	},
	sprites: {
		up: playerUpImage,
		left: playerLeftImage,
		right: playerRightImage,
		down: playerDownImage,
	}

})

console.log(player);
const bg = new Sprite({
	position: {
		x: offset.x,
		y: offset.y
	},
	image: bgImage
})

const fg = new Sprite({
	position: {
		x: offset.x,
		y: offset.y
	},
	image: fgImage
})

const keys = {
	w: {
		pressed: false
	},
	a: {
		pressed: false
	},
	s: {
		pressed: false
	},
	d: {
		pressed: false
	}
}


const movables = [bg, fg, ...battleZones, ...boundaries] //...spread operator把boundaries的東西全部拿出來

function rectangularCollision({ rectangle1, rectangle2 }) {
	return (rectangle1.position.x + rectangle1.width >= rectangle2.position.x
		&& rectangle1.position.x <= rectangle2.position.x + rectangle2.width
		&& rectangle1.position.y <= rectangle2.position.y + rectangle2.height
		&& rectangle1.position.y + rectangle1.height >= rectangle2.position.y)
}

const battle = {
	initiated: false
}

function checkBattle(animationId) {
	// activate a battle
	if (keys.w.pressed || keys.a.pressed || keys.s.pressed || keys.d.pressed) {

		for (let i = 0; i < battleZones.length; i++) { // check collide

			const battleZone = battleZones[i];
			// (右小-左大)*(下小-上大(因為y軸向下)) = 長方形重疊面積
			const overlappingArea =
				(Math.min(
					player.position.x + player.width,
					battleZone.position.x + battleZone.width
				) -
					Math.max(player.position.x, battleZone.position.x)) *
				(Math.min(player.position.y + player.height,
					battleZone.position.y + battleZone.height
				) -
					Math.max(player.position.y, battleZone.position.y))
			if (
				rectangularCollision({
					rectangle1: player,
					rectangle2: battleZone
				}) &&
				overlappingArea > (player.width * player.height) / 2
				&& Math.random() < 0.01
			) {
				console.log('activate battle')

				// deactivate current animation loop
				window.cancelAnimationFrame(animationId)

				audio.Map.stop()
				audio.initBattle.play()
				audio.battle.play()

				battle.initiated = true;
				// gsap library to animation
				gsap.to('#overlappingDiv', {
					opacity: 1,
					repeat: 3,
					yoyo: true,
					duration: 0.4,
					onComplete() {
						gsap.to('#overlappingDiv', {
							opacity: 1,
							duration: 0.4,
							onComplete() {
								//activate new animation loop
								initBattle();
								animateBattle();
								gsap.to('#overlappingDiv', {
									opacity: 0,
									duration: 0.4,
								})
							}
						})



					}
				})
				break;
			}
		}
	}
}

//return true if can move
function checkCollision(xOffset, yOffset){
	for (let i = 0; i < boundaries.length; i++) { // check collide
		const boundary = boundaries[i];
		//...spread operator create a clone of boundary
		if (
			rectangularCollision({
				rectangle1: player,
				rectangle2: {
					...boundary, position: {
						x: boundary.position.x + xOffset,
						y: boundary.position.y + yOffset
					}
				}
			})
		) {
			console.log('colliding');
			return false;
		}
	}
	return true;
}

function playerControl(){
	let moving = true;

	if (keys.w.pressed && lastKey === 'w') {
		player.animate = true;
		player.image = player.sprites.up;
		moving = checkCollision(0,3);
		if (moving)
			movables.forEach(movable => { movable.position.y += 3 });
	}
	else if (keys.a.pressed && lastKey === 'a') {
		player.animate = true;
		player.image = player.sprites.left;
		moving = checkCollision(3,0);
		if (moving)
			movables.forEach(movable => { movable.position.x += 3 });
	}
	else if (keys.s.pressed && lastKey === 's') {
		player.animate = true;
		player.image = player.sprites.down;
		moving = checkCollision(0,-3);
		if (moving)
			movables.forEach(movable => { movable.position.y -= 3 });
	}
	else if (keys.d.pressed && lastKey === 'd') {
		player.animate = true;
		player.image = player.sprites.right;
		moving = checkCollision(-3,0);
		if (moving)
			movables.forEach(movable => { movable.position.x -= 3 });
	}
}

function animate() {
	const animationId = window.requestAnimationFrame(animate)
	bg.draw()
	boundaries.forEach(boundary => {boundary.draw();})
	battleZones.forEach(battleZone => {battleZone.draw()})
	player.draw()
	fg.draw()

	

	player.animate = false;

	if (battle.initiated) return

	checkBattle(animationId);


	playerControl();

	

}
//animate()



let lastKey = ''
// player input
window.addEventListener('keydown', (e) => {
	switch (e.key) {
		case 'w':
			keys.w.pressed = true;
			lastKey = 'w'
			break;
		case 'a':
			keys.a.pressed = true;
			lastKey = 'a'
			break;
		case 's':
			keys.s.pressed = true;
			lastKey = 's'
			break;
		case 'd':
			keys.d.pressed = true;
			lastKey = 'd'
			break;
	}
})

window.addEventListener('keyup', (e) => {
	switch (e.key) {
		case 'w':
			keys.w.pressed = false;
			break;
		case 'a':
			keys.a.pressed = false;
			break;
		case 's':
			keys.s.pressed = false;
			break;
		case 'd':
			keys.d.pressed = false;
			break;
	}
})

let clicked = false
addEventListener(('click'), () => {
	if (!clicked) {
		audio.Map.play()
		clicked = true
	}
})