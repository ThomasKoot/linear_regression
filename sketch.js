var generate;
var points = [];
var range;
var reset;
var dragged_point = -1;
var timestamp = 0;
var point_size = 10;
var order = 1;
var theta = []
var lr = .1;
var design_matrix;
var iterations = 0;
var mouseTime = 0;


function setup() {

	generate = createButton("GENERATE");		
	range = createSlider(0, 6, 1, 1);			
	canvas = createCanvas(500, 500);
	reset = createButton('RESET');
	reset.parent('reset-div')
	reset.mousePressed(reset_canvas)
	generate.mousePressed(setup_design_matrix)
	canvas.parent('sketch-div');
  	p = createP("");							
  	range.parent('slider-div');
  	range.input(update_range);
  	canvas.mousePressed(update_points);
  	canvas.mouseReleased(undo_drag);
  	generate.parent('generate-div')
  	generate.class('button_class')
  	reset.class('button_class')

  	for (var i = 0; i<=order ; i++) {
  		theta.push(.1)
  	}

}

function draw() {
	background(255);
	if(mouseIsPressed == true && mouseInRange()) {
		mouseTime += 1;
	} else {
		mouseTime = 0;
	}
	if (mouseTime > 20 && dragged_point < 0) {
		splat_random()
		if (design_matrix) {
			setup_design_matrix()
		}
	}
	if (design_matrix) {
		cost_function(design_matrix);
		theta = update_theta(design_matrix);
		display_function(theta)
	} else {
		display_points();
	}
	check_points(points);

	
}

function update_points() {
	//checks if the mouse is clicked on an existing point, if so, the index of that point is allocated to dragged_point
	//if the mouse clicks on an empty spot, that point is appended to the points array. When double-clicking on a point, 
	//the point is removed from the points array
	removing = false;
	if (frameCount - timestamp < 12) {
		removing = true;
	}
	timestamp = frameCount;

	mouse = new p5.Vector(mouseX, mouseY);
	for (var i = 0; i<points.length; i++) {
		mapped_point = new p5.Vector(mapX(points[i].x), mapY(points[i].y));
		if (mouse.dist(mapped_point) < 8) {
			dragged_point = i
		}
	}
	if (dragged_point < 0 && removing == false) {
		append_point();
	} else if (dragged_point >= 0 && removing == true) {
		points.splice(dragged_point, 1);
		undo_drag();
		if (design_matrix) {setup_design_matrix();}
	}
}

function undo_drag() {
	dragged_point = -1;
}

function append_point() {
	var x = map(mouseX, 0, width, 0, 1);
	var y = map(mouseY, height, 0, 0, 1);
	points.push(new p5.Vector(x, y))
	if (design_matrix) {setup_design_matrix();}
}

function check_points(points) {
	//checks if the mouse hoovers over a point and invokes display_coordinates if that's the case.
	//to avoid overlap, this function only shows the coordinates of one point. If a point is dragged, 
	//it always displays the coordinates of the dragged point.
	if (dragged_point >=0 && mouseInRange) {										
		points[dragged_point].x = map(mouseX, 0, width, 0, 1);
		points[dragged_point].y = map(mouseY, height, 0, 0, 1);
		if (design_matrix) {setup_design_matrix();}
		}
		
	
}

function display_coordinates(mapped_point, unmapped_point) {
	//display the coordinates of a point, formatted to two decimals and swaps the alignment of the text if the point is
	//close to the right border
	fill(0)
	if (mapped_point.x > width - 80) {offset = -73} else {offset = 10}
			var x = int(unmapped_point.x * 100)/100;						
			var y = int(unmapped_point.y * 100)/100;
			message = '['+ x + ' , ' + y +']';
			text(message, mapped_point.x + offset, mapped_point.y + 3);
}

function mapX(x) {
	return map(x, 0, 1, 0, width)
}

function mapY(y) {
	return map(y, 0, 1, height, 0)
}

function display_points() {
	noStroke()
	fill(127)
	for (var i = 0; i < points.length; i++) {
		ellipse(mapX(points[i].x), mapY(points[i].y), point_size, point_size)
	}
}

function setup_design_matrix() {
	design_matrix = generate_matrix(points.length, order+1);
	print(design_matrix)
	y = []

	for (var i = 0; i<points.length; i++) {
		for (var j = 0; j<=order; j++) {
			design_matrix[i][j] = pow(points[i].x, j) 
			y[i] = points[i].y
		}
	}
	theta = update_theta(design_matrix)
}


function generate_matrix(m, n) {
	matrix = new Array(m);
	for (var i = 0; i<m; i++) {
		matrix[i] = new Array(n)
	}
	return matrix
}

function cost_function(X) {
	cost = 0;
	for (var i = 0; i<X.length; i++) {
		h_x = 0;
		for (var j = 0; j <= order; j++) {
			h_x += X[i][j] * theta[j]
		}
		current_cost = pow(h_x - y[i], 2)


		fill(30 + current_cost*2000, 240 - current_cost*2000, 0)
		noStroke()
		ellipse(mapX(points[i].x), mapY(points[i].y), point_size, point_size)
		cost += current_cost
	}
}

function update_theta(X) {
	theta_temp = [];
	for (var jj = 0; jj < theta.length; jj++) {
		der = 0;	
		for (var i = 0; i < X.length; i++) {
			hypo = 0;
			for (var j = 0; j < theta.length; j++){
				hypo += (X[i][j] * theta[j])
			}
			der += (hypo - y[i]) * X[i][jj]
		}
		theta_temp.push(theta[jj] - (der/X.length) * lr)
	}
	iterations += 1;
	return(theta_temp)

}

function splat_random() {
	mouse = new p5.Vector(mouseX, mouseY)
	rv = p5.Vector.random2D()
	rv.mult(pow(Math.random(),2) * 60).add(mouse)
	x = map(rv.x, 0, width, 0, 1);
	y = map(rv.y, height, 0, 0, 1);
	points.push(new p5.Vector(x, y))
}

function update_range() {
	order = range.value();
	old_theta = theta
	theta = []
	if (old_theta.length > order+1) {
		for (var i = 0; i<=order; i++) {
  			theta.push(old_theta[i])
  		}
	} else {
		for (var i = 0; i<=order; i++) {
  			if (i < old_theta.length) {
  				theta.push(old_theta[i])
  			} else {
  				theta.push(0)
  			}
		}
	}	
	print(order);
	if (design_matrix) {setup_design_matrix();}
}

function display_function(par) {
	stroke(0);
	strokeWeight(2);
	var px;
	var py;
	for (var x = 0; x < 1; x += 0.01) {
		result = 0;
		for (var j = 0; j < par.length; j++) {
			result += par[j] * pow(x, j)
		}
		if (px) {
			line(mapX(x), mapY(result), mapX(px), mapY(py))
			px = x;
			py = result;
		} else {
			px = x;
			py = result;
		}
	}
}

function reset_canvas() {
	theta = []
	for (var i = 0; i<=order; i++) {
  		theta.push(.1)
  	}
  	design_matrix = null
  	points = []
}

function mouseInRange() {
	if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
		return true;
	} else {
		return false;
	}
}

