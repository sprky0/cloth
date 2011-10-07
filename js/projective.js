
function proj(options) {

	for(i in options)
		this[i] = options[i];

	return this;

};

proj.prototype.wireframe = true;
proj.prototype.subdivisionLimit = 4;
proj.prototype.patchSize = 50;

proj.prototype.counter = 0;

proj.prototype.mode = "image_src"; // or image_data

proj.prototype.image_src = false;
proj.prototype.imagedata = false;

proj.prototype.offset = null;
proj.prototype.canvas = null;
proj.prototype.ctx = null;

proj.prototype.target_ctx = null;

proj.prototype.transform = null;
proj.prototype.image = null;
proj.prototype.iw = 0;
proj.prototype.ih = 0;

/**
 * Refresh image.
 */
proj.prototype.load = function(image, callback) {

	var _proj = this;

	if (typeof(image) == "string") {

		this.mode = "image_src";
		this.image_src = new Image();
		this.image_src.onload = callback;
		this.image_src.src = image; // this.image;

	} else {

		this.mode = "image_data";
		this.image_data = image;
		callback();
		
	}

}

/**
 * Update the display to match a new point configuration.
 */
proj.prototype.update = function(x1,y1,x2,y2,x3,y3,x4,y4,dst) {

	if (dst)
		this.target_ctx = dst;

	// Get extents.
	var minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;

	var points = [[x1,y1],[x2,y2],[x3,y3],[x4,y4]];

	/*
	var points = [
		[0, 0], // TL
		[200, 0], // TR
		[0, 200], // BL
		[200, 200] // BR
	];
	*/

	for(var i = 0; i < points.length; i++) {
		points, function () {
			minX = Math.min(minX, Math.floor(points[i][0]));
			maxX = Math.max(maxX, Math.ceil(points[i][0]));
			minY = Math.min(minY, Math.floor(points[i][1]));
			maxY = Math.max(maxY, Math.ceil(points[i][1]));
		}
	}

	minX--;
	minY--;
	maxX++;
	maxY++;
	
	var width = maxX - minX;
	var height = maxY - minY;

	// Reshape canvas.

	/*
	this.canvas.style.left = minX + 'px';
	this.canvas.style.top = minY + 'px';
	this.canvas.width = width;
	this.canvas.height = height;
	*/

	switch(this.mode) {

		default:
			throw Exception("NO!");
			break;

		case "image_src":
			this.iw = this.image_src.width;
			this.ih = this.image_src.height;
			break;
			
		case "image_data":
			this.iw = this.image_data.width;
			this.ih = this.image_data.height;
			break;
	}

	// Measure texture.
	// iw = this.image.width;
	// ih = this.image.height;

	// Set up basic drawing context.
	this.ctx = this.canvas.getContext("2d");
	this.ctx.translate(-minX, -minY);
	this.ctx.clearRect(minX, minY, width, height);
	this.ctx.strokeStyle = "rgb(0,255,0)";

	transform = this.getProjectiveTransform(points);

	// Begin subdivision process.
	var ptl = transform.transformProjectiveVector([0, 0, 1]);
	var ptr = transform.transformProjectiveVector([1, 0, 1]);
	var pbl = transform.transformProjectiveVector([0, 1, 1]);
	var pbr = transform.transformProjectiveVector([1, 1, 1]);

	this.ctx.beginPath();
	this.ctx.moveTo(ptl[0], ptl[1]);
	this.ctx.lineTo(ptr[0], ptr[1]);
	this.ctx.lineTo(pbr[0], pbr[1]);
	this.ctx.lineTo(pbl[0], pbl[1]);
	this.ctx.closePath();
	this.ctx.clip();

	this.divide(0, 0, 1, 1, ptl, ptr, pbl, pbr, this.subdivisionLimit);

	if (this.wireframe) {
		this.ctx.beginPath();
		this.ctx.moveTo(ptl[0], ptl[1]);
		this.ctx.lineTo(ptr[0], ptr[1]);
		this.ctx.lineTo(pbr[0], pbr[1]);
		this.ctx.lineTo(pbl[0], pbl[1]);
		this.ctx.closePath();
		this.ctx.stroke();
	}

}

/**
 * Render a projective patch.
 */
proj.prototype.divide = function(u1, v1, u4, v4, p1, p2, p3, p4, limit) {

	// See if we can still divide.
	if (limit) {
		// Measure patch non-affinity.
		var d1 = [p2[0] + p3[0] - 2 * p1[0], p2[1] + p3[1] - 2 * p1[1]];
		var d2 = [p2[0] + p3[0] - 2 * p4[0], p2[1] + p3[1] - 2 * p4[1]];
		var d3 = [d1[0] + d2[0], d1[1] + d2[1]];
		var r = Math.abs((d3[0] * d3[0] + d3[1] * d3[1]) / (d1[0] * d2[0] + d1[1] * d2[1]));
	
		// Measure patch area.
		d1 = [p2[0] - p1[0] + p4[0] - p3[0], p2[1] - p1[1] + p4[1] - p3[1]];
		d2 = [p3[0] - p1[0] + p4[0] - p2[0], p3[1] - p1[1] + p4[1] - p2[1]];
		var area = Math.abs(d1[0] * d2[1] - d1[1] * d2[0]);
	
		// Check area > patchSize pixels (note factor 4 due to not averaging d1 and d2)
		// The non-affinity measure is used as a correction factor.
		if ((u1 == 0 && u4 == 1) || ((.25 + r * 5) * area > (this.patchSize * this.patchSize))) {
			// Calculate subdivision points (middle, top, bottom, left, right).
			var umid = (u1 + u4) / 2;
			var vmid = (v1 + v4) / 2;
			var pmid = transform.transformProjectiveVector([umid, vmid, 1]);
			var pt = transform.transformProjectiveVector([umid, v1, 1]);
			var pb = transform.transformProjectiveVector([umid, v4, 1]);
			var pl = transform.transformProjectiveVector([u1, vmid, 1]);
			var pr = transform.transformProjectiveVector([u4, vmid, 1]);
	
			// Subdivide.
			limit--;
			this.divide(u1, v1, umid, vmid, p1, pt, pl, pmid, limit);
			this.divide(umid, v1, u4, vmid, pt, p2, pmid, pr, limit);
			this.divide(u1, vmid, umid, v4, pl, pmid, p3, pb, limit);
			this.divide(umid, vmid, u4, v4, pmid, pr, pb, p4, limit);
	
			if (this.wireframe) {
				this.ctx.beginPath();
				this.ctx.moveTo(pt[0], pt[1]);
				this.ctx.lineTo(pb[0], pb[1]);
				this.ctx.stroke();
				this.ctx.beginPath();
				this.ctx.moveTo(pl[0], pl[1]);
				this.ctx.lineTo(pr[0], pr[1]);
				this.ctx.stroke();
			}
	
			return;
		}
	}

	// Render this patch.
	this.ctx.save();

	// Set clipping path.
	this.ctx.beginPath();
	this.ctx.moveTo(p1[0], p1[1]);
	this.ctx.lineTo(p2[0], p2[1]);
	this.ctx.lineTo(p4[0], p4[1]);
	this.ctx.lineTo(p3[0], p3[1]);
	this.ctx.closePath();
	//this.ctx.clip();
	
	// Get patch edge vectors.
	var d12 = [p2[0] - p1[0], p2[1] - p1[1]];
	var d24 = [p4[0] - p2[0], p4[1] - p2[1]];
	var d43 = [p3[0] - p4[0], p3[1] - p4[1]];
	var d31 = [p1[0] - p3[0], p1[1] - p3[1]];
	
	// Find the corner that encloses the most area
	var a1 = Math.abs(d12[0] * d31[1] - d12[1] * d31[0]);
	var a2 = Math.abs(d24[0] * d12[1] - d24[1] * d12[0]);
	var a4 = Math.abs(d43[0] * d24[1] - d43[1] * d24[0]);
	var a3 = Math.abs(d31[0] * d43[1] - d31[1] * d43[0]);
	var amax = Math.max(Math.max(a1, a2), Math.max(a3, a4));
	var dx = 0, dy = 0, padx = 0, pady = 0;
	
	// Align the transform along this corner.
	switch (amax) {
		case a1:
			this.ctx.transform(d12[0], d12[1], -d31[0], -d31[1], p1[0], p1[1]);
			// Calculate 1.05 pixel padding on vector basis.
			if (u4 != 1) padx = 1.05 / Math.sqrt(d12[0] * d12[0] + d12[1] * d12[1]);
			if (v4 != 1) pady = 1.05 / Math.sqrt(d31[0] * d31[0] + d31[1] * d31[1]);
			break;
		case a2:
			this.ctx.transform(d12[0], d12[1],	d24[0],	d24[1], p2[0], p2[1]);
			// Calculate 1.05 pixel padding on vector basis.
			if (u4 != 1) padx = 1.05 / Math.sqrt(d12[0] * d12[0] + d12[1] * d12[1]);
			if (v4 != 1) pady = 1.05 / Math.sqrt(d24[0] * d24[0] + d24[1] * d24[1]);
			dx = -1;
			break;
		case a4:
			this.ctx.transform(-d43[0], -d43[1], d24[0], d24[1], p4[0], p4[1]);
			// Calculate 1.05 pixel padding on vector basis.
			if (u4 != 1) padx = 1.05 / Math.sqrt(d43[0] * d43[0] + d43[1] * d43[1]);
			if (v4 != 1) pady = 1.05 / Math.sqrt(d24[0] * d24[0] + d24[1] * d24[1]);
			dx = -1;
			dy = -1;
			break;
		case a3:
			// Calculate 1.05 pixel padding on vector basis.
			this.ctx.transform(-d43[0], -d43[1], -d31[0], -d31[1], p3[0], p3[1]);
			if (u4 != 1) padx = 1.05 / Math.sqrt(d43[0] * d43[0] + d43[1] * d43[1]);
			if (v4 != 1) pady = 1.05 / Math.sqrt(d31[0] * d31[0] + d31[1] * d31[1]);
			dy = -1;
			break;
	}
	
	// Calculate image padding to match.
	var du = (u4 - u1);
	var dv = (v4 - v1);
	var padu = padx * du;
	var padv = pady * dv;
	
	var image = this.mode == "image_src" ? this.image_src : this.image_data;

	// target ??
	this.ctx.drawImage(
		image,
		u1 * this.iw,
		v1 * this.ih,
		Math.min(u4 - u1 + padu, 1) * this.iw,
		Math.min(v4 - v1 + padv, 1) * this.ih,
		dx, dy,
		1 + padx, 1 + pady
	);

	this.ctx.restore();

}

/**
 * Create a canvas at the specified coordinates.
 */
proj.prototype.createCanvas = function(x, y, width, height) {

	var c = document.createElement('canvas');
		c.width = width;
		c.height = height;
		
	return c;

};

/**
 * Calculate a projective transform that maps [0,1]x[0,1] onto the given set of points.
 */
proj.prototype.getProjectiveTransform = function(points) {

	var eqMatrix = new Matrix(9, 8, [
		[ 1, 1, 1,	 0, 0, 0, -points[3][0],-points[3][0],-points[3][0] ], 
		[ 0, 1, 1,	 0, 0, 0,	0,-points[2][0],-points[2][0] ],
		[ 1, 0, 1,	 0, 0, 0, -points[1][0], 0,-points[1][0] ],
		[ 0, 0, 1,	 0, 0, 0,	0, 0,-points[0][0] ],
		[ 0, 0, 0,	-1,-1,-1,	points[3][1], points[3][1], points[3][1] ],
		[ 0, 0, 0,	 0,-1,-1,	0, points[2][1], points[2][1] ],
		[ 0, 0, 0,	-1, 0,-1,	points[1][1], 0, points[1][1] ],
		[ 0, 0, 0,	 0, 0,-1,	0, 0, points[0][1] ]
	]);
	
	var kernel = eqMatrix.rowEchelon().values;
	var transform = new Matrix(3, 3, [
		[-kernel[0][8], -kernel[1][8], -kernel[2][8]],
		[-kernel[3][8], -kernel[4][8], -kernel[5][8]],
		[-kernel[6][8], -kernel[7][8],			 1]
	]);

	return transform;
};

/**
 * Initialize the handles and canvas.
 */
proj.prototype.distort = function(src,dst,x1,y1,x2,y2,x3,y3,x4,y4) {

	// non DOM transform canvas:
	// Create canvas and load image.
	// make a canvas the right size as the final here:

	if (!this.canvas)
		this.canvas = this.createCanvas(0, 0, 10000, 10000);

	var _proj = this;

	this.load(src, function(){

		_proj.update(
			x1,y1,
			x2,y2,
			x3,y3,
			x4,y4,
			dst
		);

	});

};
