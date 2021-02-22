function drawCircle(body) {
    circle(body.position.x, body.position.y, body.circleRadius * 2);
}

function drawVertices(vertices) {
    beginShape();
    for (var i = 0; i < vertices.length; i++) {
        vertex(vertices[i].x, vertices[i].y);
    }
    endShape(CLOSE);
}

function drawConstraint(c) {
    line(c.bodyA.position.x + c.pointA.x, c.bodyA.position.y + c.pointA.y, c.bodyB.position.x + c.pointB.x, c.bodyB.position.y + c.pointB.y);
}