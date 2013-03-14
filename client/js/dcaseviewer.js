var SVG_NS = "http://www.w3.org/2000/svg";

var ANIME_MSEC = 250;
var X_MARGIN = 30;
var Y_MARGIN = 100;
var SCALE_MIN = 0.1;
var SCALE_MAX = 6.0;
var FONT_SIZE = 13;
var MIN_DISP_SCALE = 4 / FONT_SIZE;
var DEF_WIDTH = 200;

//-----------------------------------------------------------------------------

var DCaseViewer = function(root, dcase, editable) {

	this.$root = $(root);
	root.className = "viewer-root";

	var $svgroot = $(document.createElementNS(SVG_NS, "svg")).css({
		position: "absolute", left: 0, top: 0, width: "100%", height: "100%"
	}).appendTo(this.$root);
	this.$svg = $(document.createElementNS(SVG_NS, "g"))
		.attr("transform", "translate(0, 0)")
		.appendTo($svgroot);
	this.$dom = $("<div></div>").css({
		position: "absolute", left: 0, top: 0, width: "100%", height: "100%"
	}).appendTo(this.$root);

	//------------------------------------

	this.dcase = null;
	this.nodeViewMap = {};
	this.moving = false;
	this.shiftX = 0;
	this.shiftY = 0;
	this.dragX = 0;
	this.dragY = 0;
	this.scale = 1.0;
	this.location_updated = false;
	this.drag_flag = true;
	this.selectedNode = null;
	this.rootview = null;

	this.viewer_addons = [

	];
	this.nodeview_addons = [
		DNodeView_ExpandBranch,
	];
	if(editable) {
		this.nodeview_addons.push(DNodeView_InplaceEdit);
		this.nodeview_addons.push(DNodeView_ToolBox);
	}

	//------------------------------------

	var self = this;
	(function() {
		$.each(self.viewer_addons, function(i, addon) {
			addon(self);
		});
		self.setDCase(dcase);
		self.addEventHandler();
	}());
};

DCaseViewer.prototype.default_colorTheme = {
	themeName: "default",
	stroke: {
		"Goal"    : "none",
		"Context" : "none",
		"Subject" : "none",
		"Strategy": "none",
		"Evidence": "none",
		"Solution": "none",
		"Rebuttal": "none",
	},
	fill: {
		"Goal"    : "#E0E0E0",
		"Context" : "#C0C0C0",
		"Subject" : "#C0C0C0",
		"Strategy": "#B0B0B0",
		"Evidence": "#D0D0D0",
		"Solution": "#D0D0D0",
		"Rebuttal": "#EEAAAA",
	},
	selected: "#F08080",
	hovered : "#8080F0",
};

DCaseViewer.prototype.colorTheme = DCaseViewer.prototype.default_colorTheme;

//-----------------------------------------------------------------------------

DCaseViewer.prototype.getDCase = function() {
	return this.dcase;
};

DCaseViewer.prototype.setDCase = function(dcase) {
	var self = this;
	
	if(this.dcase != null) {
		this.dcase.removeListener(self);
	}
	if(dcase != null) {
		dcase.addListener(self);
	}

	this.dcase = dcase;
	this.nodeViewMap = {};

	this.$svg.empty();
	this.$dom.empty();

	if(dcase == null) {
		//TODO show new_dcase button
		return;
	}

	function create(node, parent) {
		var view = new DNodeView(self, node, parent);
		self.nodeViewMap[node.id] = view;
		node.eachNode(function(child) {
			create(child, view);
		});
		return view;
	}
	this.rootview = create(dcase.getTopGoal(), null);

	setTimeout(function() {
		function f(v) {//FIXME
			var b = v.svg.outer(200, v.$divText.height() + 60);
			v.bounds.w = b.w;
			v.bounds.h = b.h;
			v.forEachNode(function(e) {
				f(e);
			});
		}
		f(self.rootview);
		self.rootview.updateLocation(0, 0);
		self.shiftX = (self.$root.width() - self.treeSize().w * self.scale)/2;
		self.shiftY = 60;
		self.location_updated = true;
		self.repaintAll();
	}, 100);
};

//-----------------------------------------------------------------------------

DCaseViewer.prototype.getNodeView = function(node) {
	return this.nodeViewMap[node.id];
};

DCaseViewer.prototype.setSelectedNode = function(view) {
	if(view != null) {
		view.selected = true;
		view.updateColor();
	}
	if(this.selectedNode != null) {
		this.selectedNode.selected = false;
		this.selectedNode.updateColor();
	}
	this.selectedNode = view;
};

DCaseViewer.prototype.getSelectedNode = function() {
	return this.selectedNode;
};

DCaseViewer.prototype.treeSize = function() {
	return this.rootview.getTreeBounds();
};

DCaseViewer.prototype.createSvg = function(name) {
	var obj = document.createElementNS(SVG_NS, name);
	this.$svg.append(obj);
	return obj;
};

DCaseViewer.prototype.setColorTheme = function(theme) {
	if(theme != null) {
		this.colorTheme = theme;
	} else {
		delete this.colorTheme;
	}
	this.repaintAll();
};

//-----------------------------------------------------------------------------

DCaseViewer.prototype.structureUpdated = function(ms) {
	this.setDCase(this.dcase);
};

DCaseViewer.prototype.nodeInserted = function(parent, node, index) {
	var self = this;
	var parentView = this.getNodeView(parent);
	var view = new DNodeView(this, node, parentView);
	self.nodeViewMap[node.id] = view;

	parentView.nodeChanged();

	setTimeout(function() {
		self.location_updated = true;
		self.repaintAll();
	}, 100);
};

DCaseViewer.prototype.nodeRemoved = function(parent, node, index) {
	var self = this;
	var parentView = this.getNodeView(parent);
	var view = this.getNodeView(node);
	view.remove(parentView);
	delete self.nodeViewMap[node.id];

	parentView.nodeChanged();

	setTimeout(function() {
		self.location_updated = true;
		self.repaintAll();
	}, 100);
};

DCaseViewer.prototype.nodeChanged = function(node) {
	var self = this;
	var view = this.getNodeView(node);
	view.nodeChanged();
	setTimeout(function() {
		function f(v) {//FIXME
			var b = v.svg.outer(200, v.$divText.height() + 60);
			v.bounds.w = b.w;
			v.bounds.h = b.h;
		}
		f(view);
		self.location_updated = true;
		self.repaintAll();
	}, 100);
};

//-----------------------------------------------------------------------------

DCaseViewer.prototype.centerize = function(view, ms) {
	if(this.rootview == null) return;
	this.selectedNode = view;
	var b = view.bounds;
	this.shiftX = -b.x * this.scale + (this.$root.width() - b.w * this.scale) / 2;
	this.shiftY = -b.y * this.scale + this.$root.height() / 5 * this.scale;
	this.repaintAll(ms);
};

DCaseViewer.prototype.repaintAll = function(ms) {
	if(this.rootview == null) return;
	var self = this;

	var dx = Math.floor(self.shiftX + self.dragX);
	var dy = Math.floor(self.shiftY + self.dragY);

	var a = new Animation();

	a.moves(self.$svg[0].transform.baseVal.getItem(0).matrix, { e: dx, f: dy });
	a.moves(self.$dom, { left: dx, top: dy });

	if(ms == 0 || ms == null) {
		if(self.location_updated) {
			self.rootview.updateLocation(0, 0);
			self.location_updated = false;
			self.rootview.animeStart(a);
		}
		a.animeFinish();
		return;
	}
	self.rootview.updateLocation(0, 0);
	self.rootview.animeStart(a);
	self.moving = true;
	var begin = new Date();
	var id = setInterval(function() {
		var time = new Date() - begin;
		var r = time / ms;
		if(r < 1.0) {
			a.anime(r);
		} else {
			clearInterval(id);
			a.animeFinish();
			self.moving = false;
		}
	}, 1000/60);
};

DCaseViewer.prototype.expandBranch = function(view, b) {
	if(b == undefined || b != view.childVisible) {
		var b0 = view.bounds;
		view.setChildVisible(!view.childVisible);
		this.rootview.updateLocation(0, 0);
		var b1 = view.bounds;
		this.shiftX -= (b1.x-b0.x) * this.scale;
		this.shiftY -= (b1.y-b0.y) * this.scale;
		this.location_updated = true;
		this.repaintAll(ANIME_MSEC);
	}
};

DCaseViewer.prototype.fit = function(ms) {
	if(this.rootview == null) return;
	var size = this.rootview.treeSize();
	this.scale = Math.min(
		this.root.width()  * 0.98 / size.x,
		this.root.height() * 0.98 / size.y);
	var b = this.rootview.bounds;
	this.shiftX = -b.x * this.scale + (this.$root.width() - b.w * this.scale) / 2;
	this.shiftY = -b.y * this.scale + (this.$root.height() - size.y * this.scale) / 2;
	this.repaintAll(ms);
};

//-----------------------------------------------------------------------------

var DNodeView = function(viewer, node, parentView) {
	var self = this;
	this.viewer = viewer;
	this.node = node;
	this.svg = new GsnShape[node.type](viewer);
	this.$div = $("<div></div>")
			.addClass("node-container")
			.width(DEF_WIDTH)
			.css("left", $(document).width())//FIXME
			.css("fontSize", FONT_SIZE)
			.appendTo(viewer.$dom);

	this.svgUndevel = null;
	this.argumentBorder = null;
	
	this.$divName = $("<div></div>")
		.addClass("node-name")
		.appendTo(this.$div);
	this.$divText = $("<div></div>")
		.addClass("node-text")
		.appendTo(this.$div);
	this.$divNodes = $("<div></div>")
		.addClass("node-closednodes")
		.appendTo(this.$div);

	this.children = [];
	this.context = null;
	this.line = null;
	this.bounds = { x: 0, y: 0, w: DEF_WIDTH, h: 100 };
	this.argumentBounds = {};
	this.visible = true;
	this.childVisible = true;
	this.childOpen = true;
	this.divNodesText = null;

	this.selected = false;
	this.hovered = false;

	if(parentView != null) {
		if(node.isContext) {
			this.line = viewer.createSvg("line");
			$(this.line).attr({
				fill: "none",
				stroke: "#404040",
				x1: 0, y1: 0, x2: 0, y2: 0,
				"marker-end": "url(#Triangle-white)",
			});
			parentView.context = this;
		} else {
			this.line = this.viewer.createSvg("path");
			$(this.line).attr({
				fill: "none",
				stroke: "#404040",
				d: "M0,0 C0,0 0,0 0,0",
				"marker-end": "url(#Triangle-black)",
			});
			parentView.children.push(this);
		}
	}

	this.$div.mouseup(function(e) {
		self.viewer.dragEnd(self);
	});

	this.$div.hover(function() {
		self.hovered = true;
		self.updateColor();
	}, function() {
		self.hovered = false;
		self.updateColor();
	});

	this.nodeChanged();

	$.each(viewer.nodeview_addons, function(i, addon) {
		addon(self);
	});
};

DNodeView.prototype.nodeChanged = function() {
	var node = this.node;
	var viewer = this.viewer;

	// undeveloped
	if(node.isUndeveloped && this.svgUndevel == null) {
		this.svgUndevel = $(document.createElementNS(SVG_NS, "polygon")).attr({
			fill: "none", stroke: "gray"
		}).appendTo(viewer.$svg);
	} else if(!node.isUndeveloped && this.svgUndevel != null){
		this.svgUndevel.remove();
		this.svgUndevel = null;
	}

	// argument
	if(node.isArgument && this.argumentBorder == null) {
		this.argumentBorder = $(document.createElementNS(SVG_NS, "rect")).attr({
			stroke: "#8080D0",
			fill: "none",
			"stroke-dasharray": 3,
		}).appendTo(viewer.$svg);
	} else if(!node.isArgument && this.argumentBorder != null) {
		this.argumentBorder.remove();
		this.argumentBorder = null;
	}

	// node name and description
	this.$divName.html(node.name);
	this.$divText.html(node.getHtmlDescription());
	var count = node.getNodeCount();
	if(count != 0) {
		this.divNodesText = count + " nodes...";
	} else {
		this.divNodesText = null;
		this.$divNodes.html("");
	}
};

DNodeView.prototype.updateColor = function() {
	var stroke;
	if(this.selected) {
		stroke = this.viewer.colorTheme.selected;
	} else if(this.hovered) {
		stroke = this.viewer.colorTheme.hovered;
	} else {
		stroke = this.viewer.colorTheme.stroke[this.node.type];
	}
	var fill = this.viewer.colorTheme.fill[this.node.type];
	this.svg.elems[0].setAttribute("stroke", stroke);
	this.svg.elems[0].setAttribute("fill", fill);
};

DNodeView.prototype.getTreeBounds = function() {
	return this.argumentBounds;
};

DNodeView.prototype.remove = function(parentView) {
	var self = this;
	this.forEachNode(function(view) {
		view.remove(self);
	});
	$(this.svg.elems[0]).remove();
	this.$div.remove();
	if(this.svgUndevel != null) $(this.svgUndevel).remove();
	if(this.argumentBorder != null) $(this.argumentBorder).remove();
	if(this.line != null) $(this.line).remove();

	if(this.node.isContext) {
		parentView.context = null;
	} else {
		parentView.children.splice(parentView.children.indexOf(this), 1);
	}
};

DNodeView.prototype.forEachNode = function(f) {
	if(this.context != null) {
		f(this.context);
	}
	var children = this.children;
	for(var i=0; i<children.length; i++) {
		f(children[i]);
	}
}

DNodeView.prototype.setChildVisible = function(b) {
	this.childVisible = b;
	this.childOpen = b;
	this.forEachNode(function(e) {
		e.setVisible(b);
	});
}

DNodeView.prototype.setVisible = function(b) {
	this.visible = b;
	if(b) {
		b = this.childOpen;
	}
	this.childVisible = b;
	this.forEachNode(function(e) {
		e.setVisible(b);
	});
}

DNodeView.prototype.updateLocation = function(x, y) {
	var ARG_MARGIN = this.node.isArgument ? 5 : 0;
	x += ARG_MARGIN;
	y += ARG_MARGIN;
	var x0 = x;
	var y0 = y;
	var w = this.bounds.w;
	var h = this.bounds.h;
	if(!this.visible || !this.childVisible) {
		this.forEachNode(function(e) {
			e.updateLocation(x, y);
		});
		this.bounds = { x: x, y: y, w: w, h: h };
		if(this.visible && this.node.isUndeveloped) {
			h += 40;
		}
		if(this.node.isArgument) {
			this.argumentBounds = {
				x: x0 - ARG_MARGIN,
				y: y0 - ARG_MARGIN,
				w: w + ARG_MARGIN * 2,
				h: h + ARG_MARGIN * 2
			};
			w += ARG_MARGIN;
			h += ARG_MARGIN;
		}
		if(this.visible) {
			return { x: x+w, cx: x+w, y: y+h };
		} else {
			return { x: x, cx: x, y: y };
		}
	}
	// calc context height
	var contextHeight = 0;
	var childrenY = y0 + h + Y_MARGIN;
	if(this.context != null) {
		var cy = this.context.updateLocation(x, y).y;
		contextHeight = cy-y0;
		childrenY = Math.max(childrenY, cy + X_MARGIN);
	}
	var maxHeight = Math.max(contextHeight, h);

	// update children location
	var cx = x;
	$.each(this.children, function(i, e) {
		if(i != 0) x += X_MARGIN;
		var size = e.updateLocation(x, childrenY);
		x = size.x;
		cx = size.cx;
		maxHeight = Math.max(maxHeight, size.y - y0);
	});
	var maxWidth = Math.max(w, x - x0);
	var maxCWidth = Math.max(w, cx - x0);

	// update this location
	this.bounds = {
		x: x0 + (maxCWidth-w)/2,
		y: y0 + Math.max((contextHeight-h)/2, 0),
		w: w,
		h: h
	};

	// update context location
	if(this.context != null) {
		x = this.bounds.x + w + Y_MARGIN;
		y = y0 + Math.max((h - contextHeight) / 2, 0);
		var p = this.context.updateLocation(x, y);
		maxWidth = Math.max(maxWidth, p.x - x0);
	}
	if(this.node.isUndeveloped) {
		maxHeight += 40;
	}
	this.argumentBounds = {
		x: x0 - ARG_MARGIN,
		y: y0 - ARG_MARGIN,
		w: maxWidth + ARG_MARGIN * 2,
		h: maxHeight + ARG_MARGIN * 2
	};
	return {
		cx: x0 + maxCWidth + ARG_MARGIN,
		x: x0 + maxWidth + ARG_MARGIN,
		y: y0 + maxHeight + ARG_MARGIN,
	};
}

DNodeView.prototype.animeStart = function(a, parent) {
	var self = this;
	var scale = this.viewer.scale;
	var b = this.bounds;
	a.show(this.svg.elems[0], this.visible);
	a.show(this.$div, this.visible);
	a.show(this.$divNodes, !this.childVisible);
	this.updateColor();

	var offset = this.svg.animate(a, b.x * scale, b.y * scale,
			b.w * scale, b.h * scale, scale);
	a.moves(this.$div, {
		left  : (b.x + offset.x) * scale,
		top   : (b.y + offset.y) * scale,
		width : (b.w - offset.x*2) * scale,
		height: (b.h - offset.y*2) * scale,
	});
	this.$div.css("fontSize", Math.floor(FONT_SIZE * scale));

	if(scale < MIN_DISP_SCALE) {
		a.show(this.$divText, false);
		a.show(this.$divName, false);
		if(this.divNodesText != null) {
			this.$divNodes.html("<p></p>");
		}
	} else {
		a.show(this.$divText, true);
		a.show(this.$divName, true);
		if(this.divNodesText != null) {
			this.$divNodes.html(this.divNodesText);
		}
	}
	
	if(this.line != null) {
		var l = this.line;
		var pb = parent.bounds;
		if(!this.node.isContext) {
			var start = l.pathSegList.getItem(0); // SVG_PATHSEG_MOVETO_ABS(M)
			var curve = l.pathSegList.getItem(1); // SVG_PATHSEG_CURVETO_CUBIC_ABS(C)
			var x1 = (pb.x + pb.w/2) * scale;
			var y1 = (pb.y + pb.h  ) * scale;
			var x2 = (b.x + b.w/2) * scale;
			var y2 = (b.y) * scale;
			a.show(l, parent.childVisible);
			a.moves(start, {
				x: x1,
				y: y1,
			});
			a.moves(curve, {
				x1: (9 * x1 + x2) / 10,
				y1: (y1 + y2) / 2,
				x2: (9 * x2 + x1) / 10,
				y2: (y1 + y2) / 2,
				x: x2,
				y: y2,
			});
		} else {
			var n = parent.node.type == "Strategy" ? 10 : 0;
			a.moves(l, {
				x1: (pb.x + pb.w - n) * scale,
				y1: (pb.y + pb.h/2) * scale,
				x2: (b.x) * scale,
				y2: (b.y + b.h/2) * scale,
			}).show(l, parent.childVisible);
		}
	}
	if(this.svgUndevel != null) {
		var sx = (b.x + b.w/2) * scale;
		var sy = (b.y + b.h) * scale;
		var n = 20 * scale;
		a.show(this.svgUndevel[0], this.visible);
		a.movePolygon(this.svgUndevel[0], [
			{ x: sx, y: sy },
			{ x: sx-n, y: sy+n },
			{ x: sx, y: sy+n*2 },
			{ x: sx+n, y: sy+n },
		]);
	}
	if(this.argumentBorder != null) {
		var n = 10;
		var b = this.argumentBounds;
		a.moves(this.argumentBorder[0], {
			x     : b.x * scale,
			y     : b.y * scale,
			width : b.w * scale,
			height: b.h * scale,
		});
		a.show(this.argumentBorder[0], this.visible);
	}
	this.forEachNode(function(e) {
		e.animeStart(a, self);
	});
}

