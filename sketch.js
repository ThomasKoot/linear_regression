//variables for the DOM elements

var generate;
var range;
var reset;
var learning_rate;
var p;
var info_button;
var info_text;
var info_header;
var resume;

// variables for the calculation

var points = [];
var order = 1;
var theta = []
var lr = .1;
var design_matrix;
var iterations = 0;

//variables for the UI

var mouseTime = 0;
var showing_info = false;
var running = false;
var started = false;
var dragged_point = -1;
var timestamp = 0;
var point_size = 10;

function setup() {

	//asssigning the DOM-elements

	info_button = createButton("INFO")
	generate = createButton("START");	
	range = createSlider(0, 6, 1, 1);			
	canvas = createCanvas(500, 500);
	reset = createButton('RESET');
	p = createP("DEGREE: 1");
	learning_rate = createSlider(0, 1.1, 0.1, 0)
	info_text = createP(info_string())
	info_header = createP("Interactive animation of a gradient descent algoritm <br>programming by Thomas Koot<hr>")
	resume = createButton("RESUME >>")

	//putting the DOM-elements in place

	info_button.parent('info_button');
	reset.parent('reset-div')
	canvas.parent('sketch-div');
	range.parent('extra_info')
  	p.parent('extra_info')
  	generate.parent('generate-div')
  	learning_rate.parent('extra_info')
  	info_header.parent('sketch-div')
  	info_text.parent('sketch-div')
  	resume.parent('sketch-div')

  	//assigning classes and ID's to the DOM-elements

	info_button.class('main_button')
	info_button.id('info')
	info_text.hide();
	resume.id('resume');
	resume.hide();
	info_header.id('info_header') 
	info_header.hide()

	learning_rate.id('small_slider')
  	learning_rate.style("order: 4;")
  	
  	generate.class('button_class')
  	reset.class('button_class')
  	range.id('small_slider');
  	range.style('order: 2');
  	p.style('order: 1;')
  	info_text.style('text-align: justify; text-justify: inter-word; padding: 0px 20px 0px 20px; font-family: open sans; font-size: 14px;')
  	resume.class('main_button')

  	//assigning appropriate functions to the DOM-elements

	info_button.mousePressed(show_info)
	learning_rate.input(update_lr)
	reset.mousePressed(reset_canvas)
	generate.mousePressed(start_stop)
  	range.input(update_range);
  	canvas.mousePressed(update_points);
  	canvas.mouseReleased(undo_drag);
  	resume.mousePressed(show_info);
  	
  	//initialize theta
  	
  	for (var i = 0; i<=order ; i++) {
  		theta.push(.1)
  	}
  	frameRate(30) 
}

function draw() {

	background(255);
	if(mouseIsPressed == true && mouseInRange()) {
		mouseTime += 1;
	} else {
		mouseTime = 0;
	}
	if (mouseTime > 10 && dragged_point < 0) {
		splat_random()
		if (running) {
			setup_design_matrix()
		}
	}

	if (started) {
		if (running) {
			i = 2;
			while (i > 0) {
				theta = update_theta(design_matrix);
				i -= 1;
			}

			
		}
		cost_function(design_matrix);
		display_function(theta);
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
		if (started) {setup_design_matrix();}
	}
}

function undo_drag() {
	dragged_point = -1;
}

function append_point() {
	var x = map(mouseX, 0, width, 0, 1);
	var y = map(mouseY, height, 0, 0, 1);
	points.push(new p5.Vector(x, y))
	if (started) {setup_design_matrix();}
}

function check_points(points) {
	//check if a point is dragged and move it to the mouse location when that's the case
	if (dragged_point >=0 && mouseInRange) {										
		points[dragged_point].x = map(mouseX, 0, width, 0, 1);
		points[dragged_point].y = map(mouseY, height, 0, 0, 1);
		if (started) {setup_design_matrix();}
		}
}

function mapX(x) {
	return map(x, 0, 1, 0, width)
}

function mapY(y) {
	return map(y, 0, 1, height, 0)
}

function display_points() {
	//display the points that the user has drawn to the screen. Only active before gradient descent has begun
	//(started == true)
	noStroke()
	fill(127)
	for (var i = 0; i < points.length; i++) {
		ellipse(mapX(points[i].x), mapY(points[i].y), point_size, point_size)
	}
}

function setup_design_matrix() {
	//update the design matrix with the points currently on the screen and the currently selected order
	design_matrix = generate_matrix(points.length, order+1);
	y = []
	for (var i = 0; i<points.length; i++) {
		for (var j = 0; j<=order; j++) {
			design_matrix[i][j] = pow(points[i].x, j) 
			y[i] = points[i].y
		}
	}
}


function generate_matrix(m, n) {
	matrix = new Array(m);
	for (var i = 0; i<m; i++) {
		matrix[i] = new Array(n)
	}
	return matrix
}

function cost_function(X) {
	//calculates the squared cost of all points, and draws the points to the screen in a color appropriate to their cost
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
	//runs an iteration of gradient descent and updates theta acoordingly
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
	//throws a random point on the screen randomly positioned, but close to the mouse location.
	mouse = new p5.Vector(mouseX, mouseY)
	rv = p5.Vector.random2D()
	rv.mult(pow(Math.random(),2) * 60).add(mouse)
	x = map(rv.x, 0, width, 0, 1);
	y = map(rv.y, height, 0, 0, 1);
	points.push(new p5.Vector(x, y))
	if (started) {setup_design_matrix();}
}

function update_range() {
	//updates theta to reflect the newly selected order. Keeps the parameters of theta that can be kept
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
	if (design_matrix) {setup_design_matrix();}
	p.html('DEGREE: ' + order)
}

function display_function(par) {
	//display the function evaluated with the current theta (passed through the par argument)
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
	//initializes the canvas
	theta = []
	for (var i = 0; i<=order; i++) {
  		theta.push(.1)
  	}
  	design_matrix = null
  	points = []
  	started = false;
  	running = false;
  	generate.html('START');
  	iterations = 0;
}

function mouseInRange() {
	//checks if the mouse is on the canvas and returns an appropriate boolean
	if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
		return true;
	} else {
		return false;
	}
}

function start_stop() {
	//starts and stops the running of gradient descent and updates the button text. 
	if (started) {
		if (running) {
			generate.html('START');
			running = false;
		} else {
			setup_design_matrix();
			generate.html('STOP');
			running = true;
		}
	} else {
		started = true;
		setup_design_matrix();
		generate.html('STOP');
		running = true;
	}
}

function update_lr() {
	lr = pow(learning_rate.value(), 2);
}

function show_info() {
	if (showing_info) {
		info_header.hide();
		info_text.hide();
		resume.hide();
		canvas.show();
		showing_info = false;
	} else {
		showing_info = true;
		canvas.hide();
		running = false;
		generate.html('START')
		info_header.show()
		info_text.show();
		resume.show()
	}
}

function info_string() {
	message = "\
	The gradient descent algoritm tries to find the best fit line through a given set of points. The 'dataset' and all\
	the parameters can be manipulated in real-time to see the effect on the functioning of the algoritm. The algoritm\
	runs at approximately 60 iterations per second, but can be slower depending on the amount of points and\
	processor capacity. <br>\
	<ul>\
	<li>Click the screen to add a point to the dataset.</li>\
	<li>Keep the mouse pressed to keep adding points near the mouse location.</li>\
	<li>Double click to delete a point.</li>\
	<li>The DEGREE slider specifies the degree of the polynomial that is used to fit the dataset.</li>\
	<li>The LEARNING RATE slider specifies the amount of change to the parameters through each iteration. A very high\
	learning rate can cause the algoritm to diverge.</li>\
	</ul>"
	return message
}


