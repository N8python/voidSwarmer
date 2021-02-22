function Factory({
    x,
    y
}) {
    const body = Bodies.rectangle(x, y, 64, 64, {
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
    let localTick = 0;
    let health = 200;
    let dead = false;
    let panicked = false;
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
            imageMode(CENTER);
            noSmooth();
            let timeScale = min(localTick / 30, 1);
            image(factoryImage, 0, 0, 64 * timeScale, 64 * timeScale);
            pop();
        },
        move() {
            let oldDir = direction;
            const angleToPlayer = Math.atan2(player.position.y - body.position.y, player.position.x - body.position.x);
            direction += angleDifference(direction, angleToPlayer) / 10;
            Body.setAngularVelocity(body, angleDifference(body.angle, direction) / 10);
            let speed = panicked ? 4 : 1;
            if (stun) {
                speed = 0;
                Body.setVelocity(body, { x: body.velocity.x * 0.5, y: body.velocity.y * 0.5 });
            }
            if (dist(body.position.x, body.position.y, player.position.x, player.position.y) > 300) {
                Body.setVelocity(body, { x: body.velocity.x + speed * Math.cos(body.angle), y: body.velocity.y + speed * Math.sin(body.angle) });
            }
            if (dist(body.position.x, body.position.y, player.position.x, player.position.y) < 200) {
                Body.setVelocity(body, { x: body.velocity.x - 2 * speed * Math.cos(body.angle), y: body.velocity.y - 2 * speed * Math.sin(body.angle) });
            }
            let nearestBullets = bullets.filter(bullet => {
                return dist(bullet.position.x, bullet.position.y, body.position.x, body.position.y) < 100 && bullet.source !== "crab";
            });
            if (nearestBullets.length > 0) {
                panicked = true;
                let xOffsets = [];
                let yOffsets = [];
                nearestBullets.forEach(bullet => {
                    xOffsets.push(bullet.position.x - body.position.x);
                    yOffsets.push(bullet.position.y - body.position.y);
                });
                const angleAway = Math.atan2(-(yOffsets.reduce((t, v) => t + v) / yOffsets.length), -(xOffsets.reduce((t, v) => t + v) / xOffsets.length));
                direction += angleDifference(oldDir, angleAway);
            } else {
                panicked = false;
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
                    health -= 1 + +0.25 * localProxy.upgrades.defense.level;
                    bullets.splice(bullets.indexOf(bullet), 1);
                    World.add(engine.world, bullet);
                    if (health < 1) {
                        localProxy.coins += floor(random(40, 70));
                        enemies.splice(enemies.indexOf(this), 1);
                        this.remove();
                        dead = true;
                        sounds.boom.setVolume(random(0.25, 0.5) * localProxy.soundVolume);
                        sounds.boom.rate(random(0.75, 1.25));
                        sounds.boom.play();
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
            if (localTick % 120 === 0 && enemies.length < 150 && dist(body.position.x, body.position.y, player.position.x, player.position.y) < 400) {
                let minX = body.position.x - 32 + Math.cos(body.angle) * 72;
                let minY = body.position.y - 32 + Math.sin(body.angle) * 72;
                let maxX = body.position.x + 32 + Math.cos(body.angle) * 72;
                let maxY = body.position.y + 32 + Math.sin(body.angle) * 72;
                for (let i = 0; i < min(random(20, 32)); i++) {
                    const e = Enemy({
                        x: random(minX, maxX),
                        y: random(minY, maxY),
                        type: "drone"
                    })
                    e.add();
                    enemies.push(e);
                }
            }
        },
        add() {
            World.add(engine.world, body);
        },
        remove() {
            World.remove(engine.world, body);
        }
    }
}