function Emitter({
    x,
    y,
    minSize,
    maxSize,
    distributionSize,
    colors,
    rate,
    startingParticles,
    duration,
    particleDuration,
    magnitude,
    minAngle = 0,
    maxAngle = 360,
    display = "circle",
    lineSize = 1,
    overlay = false
}) {
    let oldX;
    let oldY;
    if (overlay) {
        oldX = x;
        oldY = y;
        x = x - player.head.position.x;
        y = y - player.head.position.y;
    }
    const particle = () => ({
        x: x + random(-distributionSize, distributionSize),
        y: y + random(-distributionSize, distributionSize),
        angle: random(minAngle, maxAngle),
        size: random(minSize, maxSize),
        color: colors[floor(random(colors.length))],
        tick: 0
    })
    let tick = 0;
    let particles = [];
    for (let i = 0; i < startingParticles; i++) {
        particles.push(particle());
    }
    return {
        draw() {
            if (overlay) {
                x = oldX - player.head.position.x;
                y = oldY - player.head.position.y;
            }
            if (tick % rate === 0) {
                particles.push(particle());
            }
            particles.forEach((particle, i) => {
                if (duration === Infinity) {
                    fill(...particle.color.concat((1 - particle.tick / particleDuration) * 255));
                    if (display === "circle") {
                        stroke(0, 0, 0, (1 - particle.tick / particleDuration) * 255)
                    } else if (display === "line") {
                        stroke(...particle.color.concat((1 - particle.tick / particleDuration) * 255));
                    }
                } else {
                    fill(...particle.color.concat((1 - tick / duration) * (1 - particle.tick / particleDuration) * 255));
                    if (display === "circle") {
                        stroke(0, 0, 0, (1 - tick / duration) * (1 - particle.tick / particleDuration) * 255);
                    } else if (display === "line") {
                        stroke(...particle.color.concat((1 - tick / duration) * (1 - particle.tick / particleDuration) * 255));
                    }
                }
                if (display === "circle") {
                    if (overlay) {
                        circle(player.head.position.x + particle.x, player.head.position.y + particle.y, particle.size);
                    } else {
                        circle(particle.x, particle.y, particle.size);
                    }
                } else if (display === "line") {
                    strokeWeight(particle.size);
                    if (overlay) {
                        const xP = player.head.position.x + particle.x;
                        const yP = player.head.position.y + particle.y;
                        line(xP, yP, xP + magnitude * cos(radians(particle.angle)) * lineSize, yP + magnitude * sin(radians(particle.angle)) * lineSize);
                    } else {
                        line(particle.x, particle.y, particle.x + magnitude * cos(radians(particle.angle)) * lineSize, particle.y + magnitude * sin(radians(particle.angle)) * lineSize);
                    }
                    strokeWeight(1);
                }
                particle.x += magnitude * cos(radians(particle.angle));
                particle.y += magnitude * sin(radians(particle.angle));
                particle.tick++;
                if (particle.tick === particleDuration) {
                    particles.splice(i, 1);
                }
                stroke(0);
            })
            tick++;
            if (tick === duration) {
                emitters.splice(emitters.indexOf(this), 1);
            }
        },
        get tick() {
            return tick;
        }
    }
}