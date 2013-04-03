DCaseViewer.prototype.setDragHandler = function() {
	var self = this;
	var x0 = 0;
	var y0 = 0;
	var flag = false;
	var bounds = {};

	this.dragStart = function(x, y) {
		if(flag) {
			this.dragCancel();
		}
		if(self.rootview == null) return;
		x0 = x;
		y0 = y;
		flag = true;
		var size = self.treeSize();
		bounds = {
			l : 20 - size.w * self.scale - self.shiftX,
			r : self.$root.width() - 20 - self.shiftX,
			t : 20 - size.h * self.scale - self.shiftY,
			b : self.$root.height() - 20 - self.shiftY
		};
		self.repaintAll(0);
	}
	this.drag = function(x, y) {
		if(flag) {
			var dx = (x - x0);
			var dy = (y - y0);
			if(dx != 0 || dy != 0) {
				self.dragX = Math.max(bounds.l, Math.min(bounds.r, dx));
				self.dragY = Math.max(bounds.t, Math.min(bounds.b, dy));
				self.repaintAll(0);
			}
		}
	}

	this.dragCancel = function() {
		self.shiftX += self.dragX;
		self.shiftY += self.dragY;
		self.dragX = 0;
		self.dragY = 0;
		self.repaintAll(0);
		flag = false;
	}

	this.dragEnd = function(view) {
		if(flag) {
			if(self.dragX == 0 && self.dragY == 0) {
				self.setSelectedNode(view);
			} else {
				self.shiftX += self.dragX;
				self.shiftY += self.dragY;
				self.dragX = 0;
				self.dragY = 0;
				self.repaintAll(0);
			}
			flag = false;
		}
	}
}

DCaseViewer.prototype.setPointerHandler = function() {
	var self = this;
	var root = this.$root;
	var touchCount = 0;
	var d = 0;
	var scale0 = 0;
	var sx = 0;
	var sy = 0;
	var x0, y0;
	var r = null;
	function dist(p1, p2) {
		return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
	}

	if(window.navigator.msPointerEnabled) {
		var downEvent = "MSPointerDown";
		var moveEvent = "MSPointerMove";
		var upEvent   = "MSPointerUp";
		$(root)[0].style.msTouchAction = 'none';
		var msTouch   = true;
		document.addEventListener("MSPointerCancel", function(e){ removeTouchPoint(e); }, false);
		document.addEventListener("MSGestureInit", function(e){ e.preventManipulation(); }, false);
		document.addEventListener("MSGestureHold", function(e){ e.preventDefault(); }, false);
	}else {
		var downEvent = "mousedown";
		var moveEvent = "mousemove";
		var upEvent   = "mouseup";
		var msTouch   = false;
	}
	
	var pointers = {};
	var pids = [];
	
	var getRect = function(){ return root[0].getBoundingClientRect; };

	var pointerDown = function(){
		if(self.moving || !self.drag_flag) return;
		if(pids.length == 1) {
			touchCount = 1;
			var p0 = pointers[pids[0]];
			self.dragStart(p0.x, p0.y);
		} else if(pids.length == 2) {
			touchCount = 2;
			r = root[0].getBoundingClientRect();
			scale0 = self.scale;
			var p0 = pointers[pids[0]];
			var p1 = pointers[pids[1]];
			d = dist(p0, p1);
			x0 = (p0.x + p1.x) / 2;
			y0 = (p0.y + p1.y) / 2;
			sx = self.shiftX;
			sy = self.shiftY;
		}
	}
	
	var pointerMove = function() {
		if(touchCount == 1) {
			var p0 = pointers[pids[0]];
			self.drag(p0.x, p0.y);
		} else if(touchCount == 2) {
			var p0 = pointers[pids[0]];
			var p1 = pointers[pids[1]];
			var a = dist(p0, p1);
			scale = Math.min(Math.max(scale0 * (a / d), SCALE_MIN), SCALE_MAX);
			var x1 = (p0.x + p1.x) / 2;
			var y1 = (p0.y + p1.y) / 2;
			var x = sx + (1 - scale / scale0) * (x0 - r.left - sx) + (x1 - x0);
			var y = sy + (1 - scale / scale0) * (y0 - r.top  - sy) + (y1 - y0);
			self.setLocation(x, y, scale);
		}
	}

	var pointerUp = function() {
		self.dragEnd();
		touchCount = 0;
	}

	$(root).mousewheel(function(e, delta) {
		e.preventDefault();
		e.stopPropagation();
		if(self.moving) return;
		var b = 1.0 + delta * 0.04;
		var scale = Math.min(Math.max(self.scale * b, SCALE_MIN), SCALE_MAX);
		if(scale != SCALE_MIN && scale != SCALE_MAX) {
			var r = root[0].getBoundingClientRect();
			var x1 = self.drag_flag ? e.pageX - r.left : $(root).width()/2;
			var y1 = self.drag_flag ? e.pageY - r.top  : $(root).height()/2;
			var x = x1 - (x1 - self.shiftX) * b;
			var y = y1 - (y1 - self.shiftY) * b;
			self.setLocation(x, y, scale);
		}
	});
	
	$(root).on(downEvent, function(e) {
		e = e.originalEvent;
		var id = msTouch ? e.pointerId : 1;
		pointers[id] = {x: e.pageX, y: e.pageY, index: pids.length};
		pids.push(id);
		pointerDown(); 
	});
	$(root).on(moveEvent, function(e) {
		e.stopPropagation();
		e = e.originalEvent;
		var id = msTouch ? e.pointerId : 1;
		if(pointers[id]) {
			pointers[id].x = e.pageX;
			pointers[id].y = e.pageY;
		}
		pointerMove();
	});
	$(root).on(upEvent, function(e) {
		e = e.originalEvent;
		var id = msTouch ? e.pointerId : 1;
		pids.splice(pointers[id].index, 1);
		delete pointers[id];
		for(var i = 0; i < pids.length; ++i){
			pointers[pids[i]].index = i;
		}
		pointerUp();
	});

	var touchHandler = function(e) {
		e.preventDefault();
		var touches = e.originalEvent.changedTouches;
		for(var i = 0; i < touches.length; ++i) {
			var t = touches[i];
			var id = t.identifier;
			if(e.type == "touchstart") {
				pointers[id] = {x: t.pageX, y: t.pageY, index: pids.length};
				pids.push(id);
				pointerDown();
			}
			else if(e.type == "touchmove") {
				pointers[id].x = t.pageX;
				pointers[id].y = t.pageY;
				pointerMove();
			}
			else if(e.type == "touchend") {
				pids.splice(pointers[id].index, 1);
				delete pointers[id];
				for(var i = 0; i < pids.length; ++i){
					pointers[pids[i]].index = i;
				}
				pointerUp();
			}
		}
	};

	$(root).on("touchstart", touchHandler);
	$(root).on("touchmove", touchHandler);
	$(root).on("touchend", touchHandler);
}

DCaseViewer.prototype.addEventHandler = function() {
	this.setDragHandler();
	this.setPointerHandler();
}

