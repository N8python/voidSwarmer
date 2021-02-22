function angleDifference(angle1, angle2) {
    const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
}
const typeRef = {
    "melee": {
        image: () => arrow,
        color: [255, 255, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 20,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 75,
        enemyFearRadius: 20,
        damage: 0.25,
        width: 7,
        height: 13,
        speed: 4,
        coins: 0
    },
    "drone": {
        image: () => arrow,
        color: [255, 255, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 20,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 75,
        enemyFearRadius: 20,
        damage: 0.5,
        width: 7,
        height: 13,
        speed: 3,
        coins: 0
    },
    "gravity": {
        image: () => arrowGravity,
        color: [0, 0, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 20,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 75,
        enemyFearRadius: 20,
        damage: 1,
        width: 7,
        height: 13,
        speed: 3,
        coins: 1
    },
    "ranged": {
        image: () => arrowRanged,
        color: [255, 0, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 10,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 100,
        enemyFearRadius: 30,
        damage: 1,
        width: 7,
        height: 13,
        speed: 5,
        coins: 1
    },
    "rabbit": {
        image: () => rabbitImage,
        color: [255, 255, 255],
        viewDist: 300,
        matching: 20,
        avoidance: 10,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 100,
        enemyFearRadius: 50,
        damage: 5,
        width: 32,
        height: 39,
        speed: 5,
        coins: 5
    },
    "sunstick": {
        image: () => sunstickImage,
        color: [255, 255, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 20,
        centerTrend: 200,
        targetAlignment: 4,
        bulletFearRadius: 100,
        enemyFearRadius: 50,
        damage: 1.5,
        width: 7,
        height: 21,
        speed: 6,
        coins: 2
    },
    "smallrabbit": {
        image: () => rabbitImage,
        color: [255, 255, 255],
        viewDist: 200,
        matching: 20,
        avoidance: 15,
        centerTrend: 200,
        targetAlignment: 5,
        bulletFearRadius: 80,
        enemyFearRadius: 40,
        damage: 2.5,
        width: 14,
        height: 18,
        speed: 8,
        coins: 1
    },
    "tinyrabbit": {
        image: () => rabbitImage,
        color: [255, 255, 255],
        viewDist: 150,
        matching: 20,
        avoidance: 20,
        centerTrend: 200,
        targetAlignment: 3,
        bulletFearRadius: 75,
        enemyFearRadius: 20,
        damage: 0.5,
        width: 7,
        height: 9,
        speed: 12,
        coins: 0
    }
}

function Enemy({
    x,
    y,
    direction,
    speed,
    type,
    localTick = 0,
    target = { x: 500, y: 350 }
}) {
    let color = typeRef[type].color;
    if (!direction) {
        direction = random(Math.PI * 2);
    }
    if (!speed) {
        speed = typeRef[type].speed;
        if (localProxy.upgrades.speed.level === 3) {
            speed *= 2 / 3;
        }
    }
    let body = Bodies.rectangle(x, y, typeRef[type].width, typeRef[type].height, {
        angle: direction,
        frictionAir: 0.5,
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
    let dead = false;
    let directionUpdate;
    let stun = 0;
    return {
        add() {
            World.add(engine.world, [body])
        },
        draw() {
            push();
            translate(body.position.x, body.position.y);
            rotate(body.angle + Math.PI / 2);
            const timeScale = max(min(1, localTick / 60), 0.01);
            noSmooth();
            image(typeRef[type].image(), 0, 0, typeRef[type].width * timeScale, typeRef[type].height * timeScale);
            pop();
        },
        move() {
            localTick++;
            const distToTarget = dist(body.position.x, body.position.y, target.x, target.y);
            target.x = player.position.x + player.velocity.x * ((type === "ranged") ? distToTarget / 30 : 0);
            target.y = player.position.y + player.velocity.y * ((type === "ranged") ? distToTarget / 30 : 0);
            if (distToTarget < 150 && localProxy.upgrades.defense.level > 9) {
                if (Math.random() < 0.05) {
                    localProxy.coins += typeRef[type].coins;
                    emitters.push(Emitter({
                        x: body.position.x,
                        y: body.position.y,
                        minSize: 1,
                        maxSize: 1,
                        distributionSize: 0,
                        colors: [
                            color
                        ],
                        rate: Infinity,
                        startingParticles: 7,
                        magnitude: 0.5,
                        duration: 30,
                        particleDuration: 30,
                        display: "line",
                        lineSize: 8
                    }));
                    enemies.splice(enemies.indexOf(this), 1);
                    this.remove();
                    dead = true;
                    this.onDeath();
                }
            }
            let backUp = 1;
            if (type === "ranged" && distToTarget < 150) {
                backUp = -1;
            }
            if (stun > 0) {
                backUp = 0;
            }
            stun--;
            Body.setVelocity(body, { x: body.velocity.x + speed * backUp * Math.cos(body.angle), y: body.velocity.y + speed * backUp * Math.sin(body.angle) });
            Body.setAngularVelocity(body, body.angularVelocity + (direction - body.angle) / 10);
            let nearestEnemies = enemies.filter(enemy => {
                return enemy.type && dist(enemy.body.position.x, enemy.body.position.y, body.position.x, body.position.y) < typeRef[type].viewDist && enemy !== this;
            });
            let oldDir = direction;
            if (nearestEnemies.length > 0) {
                let averageDirection = nearestEnemies.map(x => x.direction).reduce((t, v) => t + v) / nearestEnemies.length;
                direction += angleDifference(oldDir, averageDirection) / typeRef[type].matching;
                const averageX = nearestEnemies.map(x => x.body.position.x).reduce((t, v) => t + v) / nearestEnemies.length;
                const averageY = nearestEnemies.map(x => x.body.position.y).reduce((t, v) => t + v) / nearestEnemies.length;
                const toCenter = Math.atan2(averageY - body.position.y, averageX - body.position.x);
                direction += angleDifference(oldDir, toCenter) / typeRef[type].centerTrend;
                let toCloseEnemies = nearestEnemies.filter(enemy => {
                    return dist(enemy.body.position.x, enemy.body.position.y, body.position.x, body.position.y) < typeRef[type].enemyFearRadius;
                });
                if (toCloseEnemies.length > 0) {
                    //let averageAvoidDirection = toCloseEnemies.map(x => x.direction).reduce((t, v) => t + v) / toCloseEnemies.length;
                    //direction -= angleDifference(oldDir, averageAvoidDirection) / 20; //
                    let xOffsets = [];
                    let yOffsets = [];
                    toCloseEnemies.forEach(enemy => {
                        xOffsets.push(enemy.body.position.x - body.position.x);
                        yOffsets.push(enemy.body.position.y - body.position.y);
                    });
                    const angleAway = Math.atan2(-(yOffsets.reduce((t, v) => t + v) / yOffsets.length), -(xOffsets.reduce((t, v) => t + v) / xOffsets.length));
                    direction += angleDifference(oldDir, angleAway) / typeRef[type].avoidance;
                }
            }
            if (target.x && target.y) {
                const angleToTarget = Math.atan2(target.y - body.position.y, target.x - body.position.x);
                if (localProxy.upgrades.defense.level >= 5) {
                    if (Math.random() < 0.33) {
                        direction -= random(0.5, 2) * angleDifference(oldDir, angleToTarget) / typeRef[type].targetAlignment;
                    } else {
                        direction += angleDifference(oldDir, angleToTarget) / typeRef[type].targetAlignment;
                    }
                } else {
                    direction += angleDifference(oldDir, angleToTarget) / typeRef[type].targetAlignment;
                }
            }
            bullets.forEach(bullet => {
                if (Detector.collisions([
                        [bullet, body]
                    ], engine).length > 0 && !dead) {
                    localProxy.coins += typeRef[type].coins;
                    emitters.push(Emitter({
                        x: body.position.x,
                        y: body.position.y,
                        minSize: 1,
                        maxSize: 1,
                        distributionSize: 0,
                        colors: [
                            color
                        ],
                        rate: Infinity,
                        startingParticles: 7,
                        magnitude: 0.5,
                        duration: 30,
                        particleDuration: 30,
                        display: "line",
                        lineSize: 8
                    }));
                    enemies.splice(enemies.indexOf(this), 1);
                    if (localProxy.upgrades.offense.level < 5) {
                        bullets.splice(bullets.indexOf(bullet), 1);
                    } else {
                        let multiplyChance = 0;
                        if (localProxy.upgrades.offense.level >= 7) {
                            multiplyChance = 0.25;
                        }
                        if (localProxy.upgrades.offense.level > 9) {
                            multiplyChance = 0.5;
                        }
                        if (Math.random() < multiplyChance) {
                            const bulletAngle = bullet.angle;
                            const offsets = [-Math.PI / 8, Math.PI / 8];
                            offsets.forEach(offset => {
                                const b = Bodies.rectangle(bullet.position.x + 3 * Math.cos(bulletAngle + offset), bullet.position.y + 3 * Math.sin(bulletAngle + offset), 5, 5, {
                                    angle: bulletAngle + offset
                                });
                                b.source = "player";
                                Body.setVelocity(b, { x: 30 * Math.cos(bulletAngle + offset), y: 30 * Math.sin(bulletAngle + offset) });
                                bullets.push(b);
                                World.add(engine.world, b);
                            })
                        }
                    }
                    this.remove();
                    if (localProxy.upgrades.offense.level < 5) {
                        World.remove(engine.world, bullet);
                    }
                    if (localProxy.upgrades.speed.level >= 5) {
                        nearestEnemies.forEach(enemy => {
                            enemy.stun();
                        })
                    }
                    dead = true;
                    this.onDeath();
                }
            });
            let nearestBullets = bullets.filter(bullet => {
                return dist(bullet.position.x, bullet.position.y, body.position.x, body.position.y) < typeRef[type].bulletFearRadius;
            });
            if (nearestBullets.length > 0) {
                let xOffsets = [];
                let yOffsets = [];
                nearestBullets.forEach(bullet => {
                    xOffsets.push(bullet.position.x - body.position.x);
                    yOffsets.push(bullet.position.y - body.position.y);
                });
                const angleAway = Math.atan2(-(yOffsets.reduce((t, v) => t + v) / yOffsets.length), -(xOffsets.reduce((t, v) => t + v) / xOffsets.length));
                direction += angleDifference(oldDir, angleAway);
            }
            if (Detector.collisions([
                    [player, body]
                ], engine).length > 0 && !dead) {
                player.health -= typeRef[type].damage;
                enemies.splice(enemies.indexOf(this), 1);
                emitters.push(Emitter({
                    x: body.position.x,
                    y: body.position.y,
                    minSize: 1,
                    maxSize: 1,
                    distributionSize: 0,
                    colors: [
                        color
                    ],
                    rate: Infinity,
                    startingParticles: 7,
                    magnitude: 0.5,
                    duration: 30,
                    particleDuration: 30,
                    display: "line",
                    lineSize: 8
                }));
                this.remove();
                dead = true;
                this.onDeath();
            }
            enemies.forEach(enemy => {
                if (enemy.isAnvil && Detector.collisions([
                        [enemy.body, body]
                    ], engine).length > 0 && !dead) {
                    enemies.splice(enemies.indexOf(this), 1);
                    emitters.push(Emitter({
                        x: body.position.x,
                        y: body.position.y,
                        minSize: 1,
                        maxSize: 1,
                        distributionSize: 0,
                        colors: [
                            color
                        ],
                        rate: Infinity,
                        startingParticles: 7,
                        magnitude: 0.5,
                        duration: 30,
                        particleDuration: 30,
                        display: "line",
                        lineSize: 8
                    }));
                    this.remove();
                    dead = true;
                    this.onDeath();
                }
            })
            if (type === "ranged") {
                const angleToTarget = Math.atan2(target.y - body.position.y, target.x - body.position.x);
                if (Math.random() < 0.03 && angleDifference(angleToTarget, body.angle) < 0.5) {
                    const bullet = Bodies.rectangle(body.position.x + 15 * Math.cos(body.angle), body.position.y + 15 * Math.sin(body.angle), 5, 5, {
                        angle: body.angle
                    });
                    bullet.source = "enemy";
                    Body.setVelocity(bullet, { x: 10 * Math.cos(body.angle), y: 10 * Math.sin(body.angle) });
                    bullets.push(bullet);
                    World.add(engine.world, bullet);
                }
            }
            if (directionUpdate !== undefined) {
                direction += directionUpdate;
                directionUpdate = undefined;
            }
        },
        stun() {
            stun += 20;
        },
        onDeath() {
            if (!sounds.enemyDeath.isPlaying()) {
                sounds.enemyDeath.setVolume(0.1 * localProxy.soundVolume);
                sounds.enemyDeath.rate(random(0.5, 1.5));
                sounds.enemyDeath.play();
            } else if (Math.random() < 0.25) {
                sounds.enemyDeath.setVolume(0.1 * localProxy.soundVolume);
                sounds.enemyDeath.rate(random(0.5, 1.5));
                sounds.enemyDeath.play();
            }
            if (type === "rabbit") {
                let multiplier = 1;
                if (localProxy.upgrades.offense.level >= 3) {
                    multiplier = 0.75;
                }
                if (localProxy.upgrades.defense.level >= 7) {
                    multiplier = 0.5;
                }
                for (let i = 0; i < floor(random(3, 6) * multiplier); i++) {
                    const e = Enemy({
                        x: body.position.x + random(-16, 16),
                        y: body.position.y + random(-16, 16),
                        localTick: 120,
                        type: "smallrabbit"
                    });
                    e.add();
                    enemies.push(e);
                }
            }
            if (type === "smallrabbit") {
                let multiplier = 1;
                if (localProxy.upgrades.offense.level >= 3) {
                    multiplier = 0.75;
                }
                for (let i = 0; i < floor(random(3, 6) * multiplier); i++) {
                    const e = Enemy({
                        x: body.position.x + random(-8, 8),
                        y: body.position.y + random(-8, 8),
                        localTick: 120,
                        type: "tinyrabbit"
                    });
                    e.add();
                    enemies.push(e);
                }
            }
        },
        get body() {
            return body;
        },
        get type() {
            return type;
        },
        get direction() {
            return direction;
        },
        turnToward(x, y, amt) {
            const angle = Math.atan2(y - body.position.y, x - body.position.x);
            directionUpdate = (angle / direction) / amt;
        },
        remove() {
            World.remove(engine.world, [body])
        }
    }
}