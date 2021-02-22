const { Engine, Events, Composite, Render, World, Bodies, Body, Detector, Constraint, Sleeping, Query, Composites } = Matter;
Matter.use('matter-wrap');
Matter.use('matter-attractors');
let levels;
fetch("./levels.json").then(json => {
    return json.json();
}).then(ls => {
    levels = ls;
});
let traitInfo;
fetch("./traits.json").then(json => {
    return json.json();
}).then(t => {
    traitInfo = t;
})
let currLevel;
let engine;
let arrow;
let arrowRanged;
let arrowGravity;
let enemies = [];
let bullets = [];
let emitters = [];
let sounds = {};
let paused = false;
let stars;
let player;
let playerImage;
let bulletImage;
let rabbitImage;
let crabImage;
let anvilImage;
let enemyBullet;
let floaterImage;
let dasherImage;
let factoryImage;
let sunstickImage;
let coinImage;
let gaImage;
let keys = {};
let tick = 0;
let gameState = "start";
let winState = "none";
const main = document.getElementById("main");
const settings = document.getElementById("settings");
if (!localProxy.coins) {
    localProxy.coins = 0;
}
if (!localProxy.levelsUnlocked) {
    localProxy.levelsUnlocked = 1;
}
if (!localProxy.soundVolume) {
    localProxy.soundVolume = 1;
}
if (!localProxy.upgrades) {
    localProxy.upgrades = {
        "speed": {
            level: 0,
            status: 0
        },
        "offense": {
            level: 0,
            status: 0
        },
        "defense": {
            level: 0,
            status: 0
        },
        globalStatus: 1
    }
}

function preload() {
    stars = loadImage("stars.png");
    arrow = loadImage("arrow.png");
    arrowRanged = loadImage("arrowRanged.png");
    arrowGravity = loadImage("arrowGravity.png");
    playerImage = loadImage("player.png");
    bulletImage = loadImage("bullet.png");
    enemyBullet = loadImage("enemyBullet.png");
    gaImage = loadImage("gravAttractor.png");
    rabbitImage = loadImage("rabbit.png");
    crabImage = loadImage("crab.png");
    anvilImage = loadImage("anvil.png");
    floaterImage = loadImage("floater.png");
    dasherImage = loadImage("dasher.png");
    factoryImage = loadImage("factory.png");
    sunstickImage = loadImage("sunstick.png");
    coinImage = loadImage("coin.png");
    sounds.laserShot = loadSound("laserShot.wav");
    sounds.enemyDeath = loadSound("enemyDeath.wav");
    sounds.boom = loadSound("boom.wav");
    sounds.hit = loadSound("hit.wav");
    sounds.anvil = loadSound("anvil.mov");
}

function setup() {
    createCanvas(1000, 700);
    engine = Engine.create({
        enableSleeping: true
    });
    engine.world.gravity = { x: 0, y: 0 };
    for (let i = 0; i < 0; i++) {
        const e = Enemy({
            x: random(width),
            y: random(height),
            type: "melee"
        })
        e.add();
        enemies.push(e);
    }
    player = Bodies.rectangle(width / 2, height / 2, 75, 75, {
        frictionAir: 0.025,
        plugin: {
            wrap: {
                min: {
                    x: 0,
                    y: 0
                },
                max: {
                    x: width,
                    y: height
                }
            }
        }
    });
    player.health = 100 + 20 * localProxy.upgrades.defense.level;
    player.maxHealth = 100 + 20 * localProxy.upgrades.defense.level;
    World.add(engine.world, [player])
    Engine.run(engine);
}

function reset() {
    Engine.clear(engine);
    winState = "none";
    engine = undefined;
    enemies = [];
    bullets = [];
    emitters = [];
    paused = false;
    player = undefined;
    keys = {};
    tick = 0;
    gameState = "start";
    engine = Engine.create({
        enableSleeping: true
    });
    engine.world.gravity = { x: 0, y: 0 };
    for (let i = 0; i < 0; i++) {
        const e = Enemy({
            x: random(width),
            y: random(height),
            type: "melee"
        })
        e.add();
        enemies.push(e);
    }
    player = Bodies.rectangle(width / 2, height / 2, 75, 75, {
        frictionAir: 0.025,
        plugin: {
            wrap: {
                min: {
                    x: 0,
                    y: 0
                },
                max: {
                    x: width,
                    y: height
                }
            }
        }
    });
    player.health = 100 + 20 * localProxy.upgrades.defense.level;
    player.maxHealth = 100 + 20 * localProxy.upgrades.defense.level;
    World.add(engine.world, [player])
    Engine.run(engine);
}

function hardReset() {
    localStorage.clear();
    location.reload();
}

function draw() {
    background(0);
    image(stars, 0, 0, 700, 700);
    image(stars, 700, 0, 700, 700);
    noSmooth();
    image(coinImage, 5, gameState === "play" ? 35 : 5);
    textAlign(CENTER);
    fill(255);
    textSize(25);
    textFont("monospace");
    noStroke();
    text(localProxy.coins, 45 + 8 * (localProxy.coins.toString().length - 1), gameState === "play" ? 60 : 30);
    if (gameState === "play") {
        const waves = levels[currLevel][tick];
        let winTick = Math.max(...Object.keys(levels[currLevel]).map(x => +x));
        if (tick > winTick && enemies.length === 0 && winState !== "won") {
            if (currLevel === localProxy.levelsUnlocked) {
                localProxy.levelsUnlocked++;
            }
            paused = true;
            winScreen();
            winState = "won";
        }
        if (waves !== undefined) {
            waves.forEach(wave => {
                if (wave.kind === "swarm") {
                    let minX = 0;
                    let minY = 0;
                    let maxX = 0;
                    let maxY = 0;
                    if (wave.location === "random") {
                        minX = random(width / 1.5);
                        minY = random(height / 1.5);
                    } else if (Array.isArray(wave.location)) {
                        minX = wave.location[0];
                        minY = wave.location[1];
                    }
                    if (wave.size === "random") {
                        maxX = minX + random(100, 300);
                        maxY = minY + random(100, 300);
                    } else if (Array.isArray(wave.size)) {
                        maxX = minX + wave.size[0];
                        maxY = minY + wave.size[1];
                    }
                    let multiplier = 1;
                    if (localProxy.upgrades.defense.level >= 7) {
                        multiplier = 0.75;
                    }
                    for (let i = 0; i < floor(random(wave.minAmount, wave.maxAmount) * multiplier); i++) {
                        if (wave.type === "gravityAttractor") {
                            const e = GravAttractor({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                            })
                            enemies.push(e);
                        } else if (wave.type === "crab") {
                            const e = Crab({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                            })
                            e.add();
                            enemies.push(e);
                        } else if (wave.type === "floater") {
                            const e = Floater({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                            })
                            e.add();
                            enemies.push(e);
                        } else if (wave.type === "dasher") {
                            const e = Dasher({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                            })
                            e.add();
                            enemies.push(e);
                        } else if (wave.type === "factory") {
                            const e = Factory({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                            })
                            e.add();
                            enemies.push(e);
                        } else if (wave.type === "anvil") {
                            let seed = Math.random();
                            if (seed < 0.5) {
                                const e = Anvil({
                                    x: random(0, width),
                                    y: 25,
                                })
                                e.add();
                                enemies.push(e);
                            } else if (seed < 0.75) {
                                const e = Anvil({
                                    x: 25,
                                    y: random(0, height),
                                    angle: 3 * Math.PI / 2
                                })
                                e.add();
                                enemies.push(e);
                            } else if (seed < 0.875) {
                                const e = Anvil({
                                    x: random(0, width),
                                    y: height - 25,
                                    angle: Math.PI / 2
                                })
                                e.add();
                                enemies.push(e);
                            } else {
                                const e = Anvil({
                                    x: width - 25,
                                    y: random(0, height),
                                    angle: Math.PI / 2
                                })
                                e.add();
                                enemies.push(e);
                            }

                        } else {
                            const e = Enemy({
                                x: random(minX, maxX),
                                y: random(minY, maxY),
                                type: wave.type
                            })
                            e.add();
                            enemies.push(e);
                        }
                    }
                }
            })
        }
        if (player.health < 0 && winState !== "lose") {
            winState = "lose";
            lossScreen();
        }
        settings.style.display = "block";
        player.health = max(player.health, 0);
        tick++;
        /*if (tick % 120 === 0 && enemies.length < 100) {
            let minX = random(width / 2);
            let minY = random(height / 2);
            let maxX = minX + random(100, 300);
            let maxY = minY + random(100, 300);
            for (let i = 0; i < floor(random(12, 25)); i++) {
                const e = Enemy({
                    x: random(minX, maxX),
                    y: random(minY, maxY),
                    type: "melee"
                })
                e.add();
                enemies.push(e);
            }
            for (let i = 0; i < floor(random(12, 25)); i++) {
                const e = Enemy({
                    x: random(minX, maxX),
                    y: random(minY, maxY),
                    type: "ranged"
                })
                e.add();
                enemies.push(e);
            }
            for (let i = 0; i < floor(random(12, 18)); i++) {
                const e = Enemy({
                    x: random(minX, maxX),
                    y: random(minY, maxY),
                    type: "gravity"
                })
                e.add();
                enemies.push(e);
            }
        }*/
        const playerHealthPercent = player.health / player.maxHealth;
        noStroke();
        fill(255 * (1 - playerHealthPercent), 255 * playerHealthPercent, 0);
        rect(5, 5, 150 * playerHealthPercent, 20);
        stroke(120);
        strokeWeight(4);
        noFill();
        rect(5, 5, 150, 20);
        enemies.forEach(enemy => {
            enemy.draw();
            if (!paused) {
                enemy.move();
            }
        });
        push();
        translate(player.position.x, player.position.y);
        rotate(player.angle);
        imageMode(CENTER);
        image(playerImage, 0, 0, 75, 75);
        pop();
        if (!paused) {
            const targetAngle = Math.atan2(mouseY - player.position.y, mouseX - player.position.x);
            Body.setAngularVelocity(player, angleDifference(player.angle, targetAngle));
        }
        if (keys["w"] || keys["ArrowUp"] && !paused) {
            //Body.setVelocity(player, { x: (player.velocity.x + Math.cos(player.angle)) * 0.9, y: (player.velocity.y + Math.sin(player.angle)) * 0.9 });
            Body.applyForce(player, { x: 0, y: 0 }, { x: (0.01 + 0.002 * localProxy.upgrades.speed.level) * Math.cos(player.angle), y: (0.01 + 0.002 * localProxy.upgrades.speed.level) * Math.sin(player.angle) });
        }
        if (mouseIsPressed && !paused) {
            let target = enemies;
            target = target[floor(random(target.length))];
            const bullet = Bodies.rectangle(player.position.x + 50 * Math.cos(player.angle), player.position.y + 50 * Math.sin(player.angle), 5, 5, {
                angle: player.angle
            });
            bullet.source = "player";
            bullet.target = target;
            Body.setVelocity(bullet, { x: 30 * Math.cos(player.angle), y: 30 * Math.sin(player.angle) });
            if (!sounds.laserShot.isPlaying()) {
                sounds.laserShot.rate(random(0.75, 1.25));
                sounds.laserShot.setVolume(random(0.2, 0.4) * localProxy.soundVolume);
                sounds.laserShot.play();
            } else if (Math.random() < 0.15) {
                sounds.laserShot.rate(random(0.75, 1.25));
                sounds.laserShot.setVolume(random(0.2, 0.4) * localProxy.soundVolume);
                sounds.laserShot.play();
            }
            bullets.push(bullet);
            World.add(engine.world, bullet);
            const offsets = localProxy.upgrades.offense.level > 9 ? [-Math.PI / 12, Math.PI / 12] : [];
            offsets.forEach(offset => {
                const bullet = Bodies.rectangle(player.position.x + 50 * Math.cos(player.angle + offset), player.position.y + 50 * Math.sin(player.angle + offset), 5, 5, {
                    angle: player.angle + offset
                });
                bullet.source = "player";
                bullet.target = target;
                Body.setVelocity(bullet, { x: 30 * Math.cos(player.angle + offset), y: 30 * Math.sin(player.angle + offset) });
                bullets.push(bullet);
                World.add(engine.world, bullet);
            })
        }
        bullets.forEach(bullet => {
            if (bullet.target && bullet.source === "player" && localProxy.upgrades.speed.level >= 10 && enemies.includes(bullet.target)) {
                const angleToTarget = Math.atan2(bullet.target.body.position.y - bullet.position.y, bullet.target.body.position.x - bullet.position.x);
                Body.setAngularVelocity(bullet, angleDifference(bullet.angle, angleToTarget) * 0.1);
                Body.setVelocity(bullet, { x: 10 * Math.cos(bullet.angle), y: 10 * Math.sin(bullet.angle) })
            }
            push();
            translate(bullet.position.x, bullet.position.y);
            rotate(bullet.angle + Math.PI / 2);
            if (bullet.source === "enemy") {
                image(enemyBullet, 0, 0, 5, bullet.source === "enemy" ? 5 : 15);
            } else if (bullet.source === "crab") {
                image(enemyBullet, 0, 0, 5, 15);
            } else {
                image(bulletImage, 0, 0, 5, bullet.source === "enemy" ? 5 : 15);
            }
            pop();
            if (bullet.position.x < 0 || bullet.position.x > width) {
                World.remove(engine.world, bullet);
                bullets.splice(bullets.indexOf(bullet), 1);
            }
            if (bullet.position.y < 0 || bullet.position.y > height) {
                World.remove(engine.world, bullet);
                bullets.splice(bullets.indexOf(bullet), 1);
            }
            if (bullet.source === "crab") {
                if (bullet.tick === undefined) {
                    bullet.tick = 0;
                }
                bullet.tick++;
                const angleToPlayer = Math.atan2(player.position.y - bullet.position.y, player.position.x - bullet.position.x);
                Body.setAngularVelocity(bullet, bullet.angularVelocity + (angleDifference(bullet.angle, angleToPlayer) / 20) * max(1 - bullet.tick / 50, 0) * (localProxy.upgrades.defense.level >= 3 ? 0.25 : 1));
                Body.setVelocity(bullet, { x: 10 * Math.cos(bullet.angle), y: 10 * Math.sin(bullet.angle) })
            }
            if (Detector.collisions([
                    [player, bullet]
                ], engine).length > 0 || bullet.tick > 100) {
                if (bullet.source === "enemy" || bullet.source === "crab") {
                    player.health -= 1;
                    if (bullet.source === "crab") {
                        sounds.boom.setVolume(random(0.25, 0.5) * localProxy.soundVolume);
                        sounds.boom.rate(random(0.75, 1.25));
                        sounds.boom.play();
                        player.health -= 1;
                    }
                    emitters.push(Emitter({
                        x: bullet.position.x,
                        y: bullet.position.y,
                        minSize: 1,
                        maxSize: 1,
                        distributionSize: 0,
                        colors: [
                            [255, 255, 0]
                        ],
                        rate: Infinity,
                        startingParticles: 7,
                        magnitude: 0.5,
                        duration: 30,
                        particleDuration: 30,
                        display: "line",
                        lineSize: 8
                    }));
                    bullets.splice(bullets.indexOf(bullet), 1);
                    World.add(engine.world, bullet);
                }
            }
        });
        emitters.forEach(emitter => {
            emitter.draw();
        })
        let xGravMag = 0;
        let yGravMag = 0;
        enemies.forEach(enemy => {
            if (paused) {
                return;
            }
            if (enemy.type) {
                const angleToEnemy = Math.atan2(enemy.body.position.y - player.position.y, enemy.body.position.x - player.position.x);
                const enemyDist = dist(player.position.x, player.position.y, enemy.body.position.x, enemy.body.position.y) / 12;
                let mag = 0.0015;
                if (enemy.type === "gravity") {
                    mag = 0.02;
                }
                if (enemy.type === "sunstick") {
                    mag = 0.01;
                }
                Body.applyForce(player, { x: 0, y: 0 }, { x: (mag * Math.cos(angleToEnemy)) / enemyDist, y: (mag * Math.sin(angleToEnemy)) / enemyDist });
                xGravMag += (mag * Math.cos(angleToEnemy)) / enemyDist;
                yGravMag += (mag * Math.sin(angleToEnemy)) / enemyDist;
            }
        });
        xGravMag *= 1000;
        yGravMag *= 1000;
        const angle = Math.atan2(yGravMag, xGravMag);
        const arrowScale = Math.abs(xGravMag) + Math.abs(yGravMag);
        push();
        translate(player.position.x, player.position.y);
        rotate(angle + Math.PI / 2);
        imageMode(CENTER);
        tint(0, 255, 0, 100 + Math.log(arrowScale) * 30);
        image(arrow, 0, 0, 7 * min(Math.log(arrowScale), 2.5), 13 * min(Math.log(arrowScale), 2.5));
        pop();
        if (paused) {
            engine.world.bodies.forEach(body => Sleeping.set(body, true));
        } else {
            engine.world.bodies.forEach(body => Sleeping.set(body, false));
        }
    } else {
        settings.style.display = "none";
    }
}
const mainMenu = () => {
    settings.style.display = "none";
    main.innerHTML = `<img style="position: absolute;left: 78.5px;" src="header.png">`;
    const levelSelectButton = document.createElement("button");
    levelSelectButton.classList.add("btn");
    levelSelectButton.style.position = "absolute";
    levelSelectButton.style.top = "200px";
    levelSelectButton.style.left = "400px";
    levelSelectButton.innerHTML = "Level Select";
    levelSelectButton.onclick = () => {
        levelSelect();
    }
    const shopButton = document.createElement("button");
    shopButton.classList.add("btn");
    shopButton.style.position = "absolute";
    shopButton.style.top = "285px";
    shopButton.style.left = "400px";
    shopButton.innerHTML = "Shop";
    shopButton.onclick = () => {
        shop();
    }
    const instButton = document.createElement("button");
    instButton.classList.add("btn");
    instButton.style.position = "absolute";
    instButton.style.top = "370px";
    instButton.style.left = "400px";
    instButton.innerHTML = "Instructions";
    instButton.onclick = () => {
        document.getElementById("instructions").style.display = "block";
    }
    const sfxSlider = document.createElement("input");
    sfxSlider.type = "range";
    sfxSlider.classList.add("goodSlider");
    sfxSlider.style.position = "absolute";
    sfxSlider.style.width = "200px";
    sfxSlider.style.left = "450px";
    sfxSlider.style.top = "457px";
    sfxSlider.min = 0.01;
    sfxSlider.max = 1;
    sfxSlider.step = 0.01;
    sfxSlider.value = localProxy.soundVolume;
    sfxSlider.onchange = () => {
        localProxy.soundVolume = +sfxSlider.value;
    }
    const sfxLabel = document.createElement("label");
    sfxLabel.innerHTML = "SFX Volume:";
    sfxLabel.style.color = "white";
    sfxLabel.style.position = "absolute";
    sfxLabel.style.left = "335px";
    sfxLabel.style.top = "450px";
    main.appendChild(levelSelectButton);
    main.appendChild(shopButton);
    main.appendChild(instButton);
    main.appendChild(sfxLabel);
    main.appendChild(sfxSlider);
};
const shop = () => {
    main.innerHTML = `<img style="position: absolute;left: 295px;" src="shop.png">`;
    const backButton = document.createElement("button");
    backButton.classList.add("btn");
    backButton.style.position = "absolute";
    backButton.style.top = "600px";
    backButton.style.left = "400px";
    backButton.innerHTML = "Back";
    backButton.onclick = () => {
            mainMenu();
        }
        /*const traitUpgradeMenu = document.createElement("div");
        traitUpgradeMenu.style.position = "absolute";
        traitUpgradeMenu.style.width = "600px";
        traitUpgradeMenu.style.height = "400px";
        traitUpgradeMenu.style.top = "150px";
        traitUpgradeMenu.style.left = "200px";
        traitUpgradeMenu.style.border = "2px solid white";
        main.appendChild(traitUpgradeMenu);*/
    const traits = ["offense", "defense", "speed"];
    traits.forEach((trait, i) => {
        const upgradeMenu = document.createElement("div");
        upgradeMenu.style.position = "absolute";
        upgradeMenu.style.width = "600px";
        upgradeMenu.style.height = "133px";
        upgradeMenu.style.top = (150 + 133 * i) + "px";
        upgradeMenu.style.left = "200px";
        upgradeMenu.style.border = "2px solid white";
        let maximum = 10;
        if (localProxy.upgrades[trait].status === 2) {
            maximum = 5;
        }
        if (localProxy.upgrades[trait].status === 3) {
            maximum = 3;
        }
        const title = document.createElement("h3");
        title.innerHTML = trait[0].toUpperCase() + trait.slice(1) + ` (Lv. ${localProxy.upgrades[trait].level})`;
        if (localProxy.upgrades[trait].level === maximum) {
            title.innerHTML = trait[0].toUpperCase() + trait.slice(1) + ` (Lv. MAX)`;
        }
        title.style.color = "white";
        title.style.marginLeft = "8px";
        const description = document.createElement("p");
        description.innerHTML = `Lv. ${localProxy.upgrades[trait].level + 1}: ${traitInfo[trait][localProxy.upgrades[trait].level + 1] ? traitInfo[trait][localProxy.upgrades[trait].level + 1]: traitInfo[trait].default}`;
        if (localProxy.upgrades[trait].level === maximum) {
            if (maximum === 10) {
                description.innerHTML = "<em>Primary power maxed out.</em>";
            }
            if (maximum === 5) {
                description.innerHTML = "<em>Secondary power maxed out.</em>";
            }
            if (maximum === 3) {
                description.innerHTML = "<em>Tertiary power maxed out.</em>";
            }
        }
        description.style.color = "white";
        description.style.marginLeft = "8px";
        const upgradeButton = document.createElement("button");
        upgradeButton.classList.add("btn");
        upgradeButton.innerHTML = `Upgrade for ${100 + traitInfo[trait].incCost * localProxy.upgrades[trait].level} <img src="coin.png" width="16px" height="16px">`;
        if (localProxy.upgrades[trait].level === maximum) {
            upgradeButton.setAttribute("disabled", "true");
        }
        upgradeButton.style.width = "100px";
        upgradeButton.style.fontSize = "16px";
        upgradeButton.style.position = "absolute";
        upgradeButton.style.left = "400px";
        upgradeButton.style.top = "8px";
        upgradeButton.onclick = () => {
            const cost = 100 + traitInfo[trait].incCost * localProxy.upgrades[trait].level;
            if (localProxy.coins >= cost) {
                localProxy.coins -= cost;
                const upgrades = localProxy.upgrades;
                upgrades[trait].level += 1;
                if (upgrades[trait].status === 0) {
                    upgrades[trait].status = upgrades.globalStatus;
                    upgrades.globalStatus++;
                }
                localProxy.upgrades = upgrades;
                let maximum = 10;
                if (localProxy.upgrades[trait].status === 2) {
                    maximum = 5;
                }
                if (localProxy.upgrades[trait].status === 3) {
                    maximum = 3;
                }
                title.innerHTML = trait[0].toUpperCase() + trait.slice(1) + ` (Lv. ${localProxy.upgrades[trait].level})`;
                if (localProxy.upgrades[trait].level === maximum) {
                    title.innerHTML = trait[0].toUpperCase() + trait.slice(1) + ` (Lv. MAX)`;
                }
                description.innerHTML = `Lv. ${localProxy.upgrades[trait].level + 1}: ${traitInfo[trait][localProxy.upgrades[trait].level + 1] ? traitInfo[trait][localProxy.upgrades[trait].level + 1]: traitInfo[trait].default}`;
                if (localProxy.upgrades[trait].level === maximum) {
                    if (maximum === 10) {
                        description.innerHTML = "<em>Primary power maxed out.</em>";
                    }
                    if (maximum === 5) {
                        description.innerHTML = "<em>Secondary power maxed out.</em>";
                    }
                    if (maximum === 3) {
                        description.innerHTML = "<em>Tertiary power maxed out.</em>";
                    }
                }
                upgradeButton.innerHTML = `Upgrade for ${100 + traitInfo[trait].incCost * localProxy.upgrades[trait].level} <img src="coin.png" width="16px" height="16px">`;
                if (localProxy.upgrades[trait].level === maximum) {
                    upgradeButton.setAttribute("disabled", "true");
                }
            }
        }
        upgradeMenu.appendChild(upgradeButton);
        upgradeMenu.appendChild(title);
        upgradeMenu.appendChild(description);
        main.appendChild(upgradeMenu);
    })
    main.appendChild(backButton);
}
const levelSelect = () => {
    main.innerHTML = `<img style="position: absolute;left: 101px;" src="levellogo.png">`;
    const backButton = document.createElement("button");
    backButton.classList.add("btn");
    backButton.style.position = "absolute";
    backButton.style.top = "500px";
    backButton.style.left = "400px";
    backButton.innerHTML = "Back";
    backButton.onclick = () => {
        mainMenu();
    }
    for (let i = 1; i <= 9; i++) {
        const levelButton = document.createElement("button");
        levelButton.classList.add("btn");
        levelButton.style.position = "absolute";
        levelButton.style.top = `200px`;
        if (i > 5) {
            levelButton.style.top = "300px";
        }
        levelButton.style.left = `${250-75 + (i % 6 + (i > 5 ? 1 : 0)) * 100}px`;
        levelButton.style.minWidth = "75px";
        levelButton.innerHTML = i;
        levelButton.onclick = () => {
            main.innerHTML = "";
            currLevel = i;
            gameState = "play";

        }
        if (i > localProxy.levelsUnlocked) {
            levelButton.setAttribute("disabled", "true");
        }
        main.appendChild(levelButton);
    }
    main.appendChild(backButton);
}
settings.onclick = () => {
    paused = true;
    main.innerHTML = `<img src="menu.png" style="left:318px; top: 150px;position:absolute;">`;
    const backButton = document.createElement("button");
    backButton.style.position = "absolute";
    backButton.classList.add("btn");
    backButton.style.left = "350px";
    backButton.style.top = "300px";
    backButton.style.width = "300px";
    backButton.innerHTML = "Exit";
    backButton.onclick = () => {
        paused = false;
        gameState = "start";
        reset();
        levelSelect();
    }
    const resumeButton = document.createElement("button");
    resumeButton.classList.add("btn");
    resumeButton.style.position = "absolute";
    resumeButton.style.left = "350px";
    resumeButton.style.width = "300px";
    resumeButton.style.top = "390px";
    resumeButton.innerHTML = "Resume";
    resumeButton.onclick = () => {
        paused = false;
        main.innerHTML = "";
    }
    main.appendChild(backButton);
    main.appendChild(resumeButton);
}
const lossScreen = () => {
    paused = true;
    main.innerHTML = `<img src="losstitle.png" style="left:204.5px; top: 150px;position:absolute;">`;
    const backButton = document.createElement("button");
    backButton.style.position = "absolute";
    backButton.classList.add("btn");
    backButton.style.left = "350px";
    backButton.style.top = "300px";
    backButton.style.width = "300px";
    backButton.innerHTML = "Exit";
    backButton.onclick = () => {
        paused = false;
        gameState = "start";
        reset();
        levelSelect();
    }
    main.appendChild(backButton);
}
const winScreen = () => {
    paused = true;
    main.innerHTML = `<img src="wintitle.png" style="left:204.5px; top: 150px;position:absolute;">`;
    const backButton = document.createElement("button");
    backButton.style.position = "absolute";
    backButton.classList.add("btn");
    backButton.style.left = "350px";
    backButton.style.top = "300px";
    backButton.style.width = "300px";
    backButton.innerHTML = "Exit";
    backButton.onclick = () => {
        paused = false;
        gameState = "start";
        reset();
        levelSelect();
    }
    main.appendChild(backButton);
}
mainMenu();

document.onkeydown = (e) => {
    keys[e.key] = true;

}

document.onkeyup = (e) => {
    keys[e.key] = false;
}