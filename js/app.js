/**
 * app!
 */
function app(options) {

	this.init(options);

	// this.options = options;

	return this;

};

app.prototype.options = {};
app.prototype.interval = 400;
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
	
	for (var i = 0; i < this.pointmap.length; i++) {

		var c_point = this.pointmap.i(i);

		var x = c_point.gridx;
		var y = c_point.gridy;

		if (this.pointmap.e(x,y) && this.pointmap.e(x,y+1) && this.pointmap.e(x+1,y+1) && this.pointmap.e(x,y+1)) {

			this.swatches.push(new swatch({
				src : "http://hal.ajbnet.com/Cloth/images/dog.png",
				x : c_point.gridx,
				y : c_point.gridy,
				edges : {
					tl : this.pointmap.e(x,y),
					tr : this.pointmap.e(x+1,y),
					br : this.pointmap.e(x+1,y+1),
					bl : this.pointmap.e(x,y+1)
				},
				canvas : this.options.canvas,
				context : this.options.context
				// pass corners here -- remove all drawing stuff and move that to app redraw
			}));

		}
	}

};

app.prototype.run = function() {

	var _app = this;

	// this.cycle();

	// return;

	// this.timer = setTimeout(
	//	function() {_app.cycle();},
	//	this.interval
	// );

	_app.cycle(true);
	
	return this;

};

app.prototype.cycle = function(loop) {

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

		p.set_x(this.user_x);
		p.set_y(this.user_y);

	}

	// Redraw!
	/*
	for (var i = 0; i < this.pointmap.length; i++) {

		var c_point = this.pointmap.i(i);
		context.fillText(c_point.gridx + ", " + c_point.gridy, c_point.x, c_point.y);

	}
	*/

	for(var i =0; i < this.swatches.length; i++) {

		this.swatches[i].clear();
		this.swatches[i].draw();

	}

	if (loop) {
		
		var _app = this;
	
		this.timer = setTimeout(
			function() {_app.cycle(true);},
			this.interval
		);
		
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

//	console.log( x, y );

	x = Math.round( x / this.options.x_scale );
	y = Math.round( y / this.options.y_scale );

//	x = parseInt(x / this.options.x_scale);
//	y = parseInt(y / this.options.y_scale);

//	x = 0;
//	y = 0;

	return {x:x,y:y};
};


/**
 * Swatch object
 */
function swatch(options) {

	this.canvas = options.canvas;
	this.context = options.context;
	this.x = options.x;
	this.y = options.y;
	this.edges = options.edges;

	if (typeof(options.src) == "string") {

		var _swatch = this;

		this.image = new Image();
		this.image.onload = function() {
			_swatch.ready();
		};
		this.image.src = options.src;

	} else {

		// cloned image data?
		this.image = image.src;	
		this.ready();

	}

//	this.clone_canvas = document.createElement("canvas");
//	this.clone_context = this.clone_canvas.getContext("2d");

	return this;

};

// first draw
swatch.prototype.drawn = false;

swatch.prototype.canvas = null;
swatch.prototype.context = null;

swatch.prototype.image = null;
swatch.prototype.image_loaded = false;

// these are included in the edges ... might be able to just rmove it, unless this is the original grid position
swatch.prototype.x = 0;
swatch.prototype.y = 0;

swatch.prototype.edges = {
	tl : -1,
	tr : -1,
	br : -1,
	bl : -1
};

swatch.prototype.ready = function() {

	this.image_loaded = true;

};

swatch.prototype.clear = function() {

	// if (this.drawn && (this.edges.tl.has_changed() || this.edges.tr.has_changed() || this.edges.bl.has_changed() || this.edges.br.has_changed())) {
	// this doesn't take into account the skew -- would be bad news
	// this.context.clearRect ( 0 , 0 , 50 , 50 );
	// }

};

swatch.prototype.draw = function() {

	if (false === this.image_loaded)
		return false;

	// only draw if we need to
	if (!this.drawn || this.edges.tl.has_changed() || this.edges.tr.has_changed() || this.edges.bl.has_changed() || this.edges.br.has_changed()) {

		var p = new proj({
			// canvas: this.canvas,
			// target : this.context,
			subdivisionLimit : 2, // very low res scaling to keep things fast :(
			patchSize : 500
		});

		p.distort(
			this.image, this.context,
			this.edges.tl.x, this.edges.tl.y,
			this.edges.tr.x, this.edges.tr.y,
			this.edges.bl.x, this.edges.bl.y,
			this.edges.br.x, this.edges.br.y
		);

		p.destroy();

		this.drawn = true;

	}
	
	return false;

};




// pixel x y vs gridxy
function point(x,y, gridx, gridy) {

	this.x = x;
	this.y = y;

	this.last_x = x;
	this.last_y = y;

	this.gridx = gridx || 0;
	this.gridy = gridy || 0;

	return this;
}

point.prototype.x = 0;
point.prototype.y = 0;
point.prototype.last_x = 0;
point.prototype.last_y = 0;

point.prototype.gridx = 0;
point.prototype.gridy = 0;

point.prototype.set_x = function(x) {
	this.last_x = this.x;
	this.x = x;
}

point.prototype.set_y = function(y) {
	this.last_y = this.y;
	this.y = y;
}

point.prototype.has_changed = function() {
	return (this.x != this.last_x || this.y != this.last_y);
}




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



