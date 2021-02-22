function Crab({
    x,
    y
}) {
    let localTick = 0;
    const body = Bodies.rectangle(x, y, 50, 50, {
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
    let direction = 0;
    let health = 50;
    let dead = false;
    let stun = 0;
    return {
        get body() {
            return body;
        },
        draw() {
            localTick++;
            push();
            translate(body.position.x, body.position.y);
            rotate(body.angle);
            noSmooth();
            imageMode(CENTER);
            let timeScale = min(localTick / 30, 1);
            image(crabImage, 0, 0, 50 * timeScale, 50 * timeScale);
            pop();
        },
        move() {
            stun -= 1;
            const angleToPlayer = Math.atan2(player.position.y - body.position.y, player.position.x - body.position.x);
            direction += angleDifference(direction, angleToPlayer) / 10;
            const playerAngleToThis = Math.atan2(body.position.y - player.position.y, body.position.x - player.position.x);
            Body.setAngularVelocity(body, angleDifference(body.angle, direction) / 10);
            let speed = 2;
            if (stun > 0) {
                speed = 0;
                Body.setVelocity(body, { x: body.velocity.x * 0.5, y: body.velocity.y * 0.5 });
            }
            if (dist(body.position.x, body.position.y, player.position.x, player.position.y) > 150) {
                Body.setVelocity(body, { x: body.velocity.x + speed * Math.cos(body.angle), y: body.velocity.y + speed * Math.sin(body.angle) });
            }
            if (dist(body.position.x, body.position.y, player.position.x, player.position.y) < 125) {
                Body.setVelocity(body, { x: body.velocity.x - 2 * speed * Math.cos(body.angle), y: body.velocity.y - 2 * speed * Math.sin(body.angle) });
            }
            if (localTick % 45 === 0) {
                Body.applyForce(player, { x: 0, y: 0 }, { x: Math.cos(playerAngleToThis) * 0.1, y: Math.sin(playerAngleToThis) * 0.1 });
            }
            if (localTick % 60 === 0) {
                for (let i = 0; i < 2; i++) {
                    const bullet = Bodies.rectangle(body.position.x + 15 * Math.cos(body.angle), body.position.y + 15 * Math.sin(body.angle), 5, 15, {
                        angle: body.angle
                    });
                    bullet.source = "crab";
                    let offset = i === 0 ? -Math.PI / 6 : Math.PI / 6;
                    Body.setVelocity(bullet, { x: 10 * Math.cos(body.angle + offset), y: 10 * Math.sin(body.angle + offset) });
                    bullets.push(bullet);
                    World.add(engine.world, bullet);
                }
            }
            let oldDir = direction;
            let nearestBullets = bullets.filter(bullet => {
                return dist(bullet.position.x, bullet.position.y, body.position.x, body.position.y) < 100 && bullet.source !== "crab";
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
            bullets.forEach(bullet => {
                if (Detector.collisions([
                        [bullet, body]
                    ], engine).length > 0 && bullet.source !== "crab" && !dead) {
                    if (localProxy.upgrades.speed.level >= 5) {
                        stun += 3;
                    }
                    if (!sounds.hit.isPlaying()) {
                        sounds.hit.setVolume(0.2 * localProxy.soundVolume);
                        sounds.hit.play();
                    }
                    health -= 1 + 0.25 * localProxy.upgrades.defense.level;
                    bullets.splice(bullets.indexOf(bullet), 1);
                    World.add(engine.world, bullet);
                    if (health < 1) {
                        localProxy.coins += floor(random(30, 50));
                        enemies.splice(enemies.indexOf(this), 1);
                        this.remove();
                        sounds.boom.setVolume(random(0.25, 0.5) * localProxy.soundVolume);
                        sounds.boom.rate(random(0.75, 1.25));
                        sounds.boom.play();
                        dead = true;
                        emitters.push(Emitter({
                            x: body.position.x,
                            y: body.position.y,
                            minSize: 1,
                            maxSize: 1,
                            distributionSize: 0,
                            colors: [
                                [255, 255, 255]
                            ],
                            rate: Infinity,
                            startingParticles: 30,
                            magnitude: 2,
                            duration: 30,
                            particleDuration: 30,
                            display: "line",
                            lineSize: 8
                        }));
                    }
                }
            });
        },
        add() {
            World.add(engine.world, body);
        },
        remove() {
            World.remove(engine.world, body);
        }
    }
}