function Floater({
    x,
    y
}) {
    const body = Bodies.rectangle(x, y, 25, 50, {
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
    let localTick = 0;
    let xVel = random(-0.1, 0.1);
    let yVel = random(-0.1, 0.1);
    let health = 50;
    let dead = false;
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
            image(floaterImage, 0, 0, 25 * timeScale, 50 * timeScale);
            pop();
        },
        move() {
            if (Detector.collisions([
                    [player, body]
                ], engine).length > 0) {
                player.health -= 0.5;
            }
            Body.setVelocity(body, { x: body.velocity.x + Math.cos(localTick / 100) * 0.25 * xVel, y: body.velocity.y + Math.sin(localTick / 100) * 0.25 * yVel });
            xVel += random(-0.01, 0.01);
            yVel += random(-0.01, 0.01);
            const playerAngleToThis = Math.atan2(body.position.y - player.position.y, body.position.x - player.position.x);
            Body.applyForce(player, { x: 0, y: 0 }, { x: Math.cos(playerAngleToThis) * 0.005, y: Math.sin(playerAngleToThis) * 0.005 });
            bullets.forEach(bullet => {
                if (Detector.collisions([
                        [bullet, body]
                    ], engine).length > 0 && bullet.source !== "crab" && !dead) {
                    localProxy.coins += floor(random(30, 50));
                    health -= 1 + 0.25 * localProxy.upgrades.defense.level;
                    bullets.splice(bullets.indexOf(bullet), 1);
                    World.add(engine.world, bullet);
                    if (health < 1) {
                        localProxy.coins += floor(random(5, 10));
                        enemies.splice(enemies.indexOf(this), 1);
                        this.remove();
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
                            magnitude: 1.5,
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