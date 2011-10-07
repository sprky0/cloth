/**
 * app!
 */
function app(options) {

	this.init(options);

	// this.options = options;

	return this;

};

app.prototype.options = {};
app.prototype.interval = 500;
app.prototype.timer = false;

app.prototype.is_dragging = false;
app.prototype.user_x = 0;
app.prototype.user_y = 0;
app.prototype.last_user_x = 0;
app.prototype.last_user_y = 0;

// be a pointmap soon
app.prototype.pointmap = false;

app.prototype.init = function(o) {

	for( i in o )
		this.options[i] = o[i];	

	this.pointmap = [];
	this.points = [];
	this.swatches = [];		
	this.pointmap = new point_map();

	var context = this.options.context;

	var canvas = this.options.canvas;
	var context = this.options.context;
	var w = this.options.w;
	var h = this.options.h;
	var x_offset = this.options.x_offset;
	var y_offset = this.options.y_offset;
	var x_scale = this.options.x_scale;
	var y_scale = this.options.y_scale;

	for(var x = 0; x <= w / x_scale; x++) {

		for(var y = 0; y <= h / y_scale; y++) {

			var p = new point(x_offset + x * x_scale, y_offset + y * y_scale, x, y);
			this.points.push( p );
			this.pointmap.add( x, y, p );

		}

	}
	
	if (this.pointmap.e(x,y) && this.pointmap.e(x,y+1) && this.pointmap.e(x+1,y+1) && this.pointmap.e(x,y+1)) {

		var s = new swatch({
			src : "images/dog.png",
			x : x,
			y : y
			// pass corners here -- remove all drawing stuff and move that to app redraw
		});
		this.swatches.push(s);
		
	}

};

app.prototype.run = function() {

	var _app = this;

	// this.cycle();

	// return;

	this.timer = setInterval(
		function() {_app.cycle();},
		this.interval
	);
	
	return this;

};

app.prototype.cycle = function() {

	// Local vars

	var context = this.options.context;

	var canvas = this.options.canvas;
	var context = this.options.context;
	var w = this.options.w;
	var h = this.options.h;
	var x_offset = this.options.x_offset;
	var y_offset = this.options.y_offset;
	var x_scale = this.options.x_scale;
	var y_scale = this.options.y_scale;


	// Interaction

	if (this.is_dragging) {

		var t = this.get_point_near( this.user_x, this.user_y );
		var p = this.pointmap.e( t.x, t.y );

		p.x = this.user_x;
		p.y = this.user_y;
		
		console.log( p );

	}

	// Clear
	
	// @todo -- only clear + redraw parts that are updated
	context.clearRect ( 0 , 0 , w , h );

	// Redraw!

	for (var i = 0; i < this.pointmap.length; i++) {

		var c_point = this.pointmap.i(i);
		
		

		context.fillText(c_point.gridx + ", " + c_point.gridy, c_point.x, c_point.y);

		continue;


		// context.beginPath();
		// context.arc(c_point.x, c_point.y, 3, 0, Math.PI*2, true);
		// context.closePath();
		// context.fill();

		var x = c_point.gridx;
		var y = c_point.gridy;

		if (this.pointmap.e(x,y) && this.pointmap.e(x,y+1) && this.pointmap.e(x+1,y+1) && this.pointmap.e(x,y+1)) {

			// context.beginPath();

			/*

			context.fillStyle = "rgba(" + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + "," + parseInt(Math.random() * 255) + ",1)";
			context.fillRect(
				this.pointmap.e(x,y).x,
				this.pointmap.e(x,y).y,
				this.pointmap.e(x + 1,y + 1).x -	this.pointmap.e(x,y).x,
				this.pointmap.e(x + 1,y + 1).y -	this.pointmap.e(x,y).y
			);

			context.moveTo(this.pointmap.e(x,y).x, this.pointmap.e(x,y).y);
			context.lineTo(this.pointmap.e(x,y).x, this.pointmap.e(x,y).y );
			context.lineTo(this.pointmap.e(x+1,y+1).x, this.pointmap.e(x+1,y+1).y );

			context.moveTo(this.pointmap.e(x,y+1).x, this.pointmap.e(x,y+1).y );
			context.lineTo(this.pointmap.e(x,y+1).x, this.pointmap.e(x,y+1).y );
			context.lineTo(this.pointmap.e(x+1,y).x, this.pointmap.e(x+1,y).y );

			context.closePath();

			context.stroke();
			context.fill();
			
			*/

		}
	}

};

app.prototype.interaction_start = function() {
	this.is_dragging = true;
};

app.prototype.interaction_stop = function() {
	this.is_dragging = false;
};

app.prototype.move_to = function(x,y) {
	this.last_user_x = this.user_x;
	this.last_user_y = this.user_y;
	this.user_x = x;
	this.user_y = y;
};

app.prototype.get_point_near = function(x,y) {

	x = Math.round( x / this.options.x_scale );
	y = Math.round( y / this.options.y_scale );

	// maybe keep a distance map too -- actual positions, and check against that?  then their original position can be the "return" and their current position is more accurate

	return {x:x,y:y};

};


/**
 * Swatch object
 */
function swatch(options) {

	var _swatch = this;

	this.context = options.context;
	this.x = options.x;
	this.y = options.y;

	this.image = new Image();
	this.image.load = function() {
		_swatch.ready();
	};
	this.image.src = options.src;

	return this;

};

swatch.prototype.image = null;
swatch.prototype.x = 0;
swatch.prototype.y = 0;

swatch.prototype.edges = {
	t : -1,
	r : -1,
	b : -1,
	l : -1
};

swatch.prototype.ready = function() {};





// pixel x y vs gridxy
function point(x,y, gridx, gridy) {
	this.x = x;
	this.y = y;
	this.gridx = gridx || 0;
	this.gridy = gridy || 0;
	return this;
}
point.prototype.x = 0;
point.prototype.y = 0;
point.prototype.gridx = 0;
point.prototype.gridy = 0;
// point.prototype.meta = {};

function point_map() {
	return this;	
}

point_map.prototype.length = 0;

point_map.prototype.gridmap = [];
point_map.prototype.flatmap = [];

point_map.prototype.add = function(x,y,p) {

	if (!this.gridmap[x])
		this.gridmap[x] = [];

	this.gridmap[x][y] = p;
	this.flatmap.push( this.gridmap[x][y] );

	this.length = this.flatmap.length;

	return this;
};

point_map.prototype.e = function(x,y) {
	return ( this.gridmap[x] && this.gridmap[x][y] ) ? this.gridmap[x][y] : false;
}

point_map.prototype.i = function(i) {
	return this.flatmap[i] || null;
}



