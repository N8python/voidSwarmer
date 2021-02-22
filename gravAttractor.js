function GravAttractor({
    x,
    y
}) {
    let localTick = 0;
    return {
        draw() {
            localTick++;
            push();
            translate(x, y);
            rotate(localTick / (50 - Math.log(localTick) * 10));
            imageMode(CENTER);
            if (localTick > 180) {
                tint(255, 255, 255, 255 - ((localTick - 180) * 4))
            }
            image(gaImage, 0, 0, 32, 32);
            pop();
            if (localTick > 250) {
                enemies.splice(enemies.indexOf(this), 1);
            }
        },
        move() {
            if (dist(x, y, player.position.x, player.position.y) > 45) {
                const power = 0.2 * Math.min(localTick / 60, 1);
                const angleToEnemy = Math.atan2(y - player.position.y, x - player.position.x);
                const enemyDist = dist(player.position.x, player.position.y, x, y) / 18;
                Body.applyForce(player, { x: 0, y: 0 }, { x: (power * Math.cos(angleToEnemy)) / enemyDist, y: (power * Math.sin(angleToEnemy)) / enemyDist });
            }
            enemies.forEach(enemy => {
                if (enemy.type) {
                    if (dist(x, y, enemy.body.position.x, enemy.body.position.y) > 45) {
                        enemy.turnToward(x, y, 2);
                    }
                }
            })
        }
    }
}