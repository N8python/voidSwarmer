function Anvil({
    x,
    y,
    angle = 0
}) {
    const body = Bodies.rectangle(x, y, 50, 50, {
        angle
    });
    let localTick = 0;
    let activationTime = floor(random(70, 150));
    return {
        isAnvil: true,
        draw() {
            localTick++;
            push();
            translate(body.position.x, body.position.y);
            rotate(body.angle);
            imageMode(CENTER);
            noSmooth();
            let timeScale = min(localTick / 30, 1);
            image(anvilImage, 0, 0, 50 * timeScale, 50 * timeScale);
            pop();
            if (body.position.x < 0 || body.position.x > width || body.position.y < 0 || body.position.y > height) {
                this.remove();
                enemies.splice(enemies.indexOf(this), 1);
            }
        },
        move() {
            if (localTick > activationTime) {
                Body.setVelocity(body, { x: body.velocity.x + Math.cos(body.angle + Math.PI / 2), y: body.velocity.y + Math.sin(body.angle + Math.PI / 2) });
            }
            if (Detector.collisions([
                    [player, body]
                ], engine).length > 0) {
                player.health -= 1;
                if (!sounds.anvil.isPlaying()) {
                    sounds.anvil.rate(0.5);
                    sounds.anvil.setVolume(0.3 * localProxy.soundVolume);
                    sounds.anvil.play();
                }
            }
        },
        get body() {
            return body;
        },
        add() {
            World.add(engine.world, body);
        },
        remove() {
            World.remove(engine.world, body);
        }
    }
}