var DNodeView_ExpandBranch = function(self) {
	var DBLTOUCH_THRESHOLD = 300;
	var count = 0;
	var time = null;

	self.$div.dblclick(function(e) {
		self.viewer.expandBranch(self);
	});

	self.$div.bind("touchstart", function(e) {
		var touches = e.originalEvent.touches;
		count = touches.length;
	});
	
	self.$div.bind("touchend", function(e) {
		self.viewer.dragEnd(self);
		if(time != null && (e.timeStamp - time) < DBLTOUCH_THRESHOLD) {
			self.viewer.expandBranch(self);
			time = null;
		}
		if(count == 1) {
			time = e.timeStamp;
		} else {
			time = null;
		}
	});
};

//-----------------------------------------------------------------------------

var DNodeView_InplaceEdit = function(self) {
	var $edit = null;

	function showInplace() {
		if($edit == null) {
			var cc = 0;
			self.$divText.text("");

			$edit = $("<textarea></textarea>")
				.addClass("node-inplace")
				.css("top", self.$divText.offset().y)
				.attr("value", self.node.desc)
				.appendTo(self.$div)
				.focus()
				.mousedown(function(e) { e.stopPropagation(); })
				.mouseup(function(e) { e.stopPropagation(); })
				.mousemove(function(e) { e.stopPropagation(); })
				.dblclick(function(e) {
					if(cc >= 2) e.stopPropagation();
					cc = 0;
				})
				.click(function(e) { cc++; e.stopPropagation(); })
				.mousewheel(function(e) { e.stopPropagation(); })
				.blur(function() {
					var newDesc = $edit.attr("value");
					var node = self.node;
					self.$divText.html(node.getHtmlDescription());
					if(node.desc != newDesc) {
						self.viewer.getDCase().setDescription(node, newDesc);
					}
					closeInplace();
				});
		}
	}
		
	function closeInplace() {
		if($edit != null) {
			$edit.remove();
			$edit = null;
		}
	}

	self.$divText.click(function() {
		showInplace();
	});

	self.$div.dblclick(function(e) {
		closeInplace();
	});
};

//-----------------------------------------------------------------------------

var DNodeView_ToolBox = function(self) {
	var edit_lock = false;
	var edit_hover = false;
	var edit_active = false;
	var $edit = null;
	var timeout = null;

	function showNewNode(visible) {
		var type_selected = null;
		if(visible) {
			if($edit == null && self.node.appendableTypes().length > 0) {
				function edit_activate() {
					if(!edit_active) {
						edit_active = true;
						edit_lock = true;
						$edit.css("opacity", 0.95);
						self.viewer.$root.one("click", function() {
							var text = $edit.find("textarea").attr("value");
							if(text != "") {
								self.viewer.getDCase().insertNode(self.node, type_selected, text);
							}
							$edit.remove();
							$edit = null;
						});
					}
				}
				function clear_timeout() {
					if(timeout != null) {
						clearTimeout(timeout);
						timeout = null;
					}
				}
				// create
				$edit = $("#edit-newnode").clone()
				.css({
					display: "block",
					left: 0, top: self.$div.height(),
					opacity: 0.6,
				})
				.hover(function() {
					edit_hover = true;
					clear_timeout();
				}, function() {
					edit_hover = false;
					showNewNode(false);
				})
				.one("click", function() { edit_activate(); })
				.click(function(e) { e.stopPropagation(); })
				.appendTo(self.$div);
	
				var $ul = $edit.find("ul");
				$ul.empty();
				$.each(self.node.appendableTypes(), function(i, type) {
					var $li = $("<li></li>")
						.html("<a href=\"#\">" + type + "</a>")
						.click(function() {
							type_selected = type;
							$("li").removeClass("active");
							$li.addClass("active");
							$("textarea").focus();
						})
						.appendTo($ul);
					if(i == 0) {
						$li.addClass("active");
						type_selected = type;
					}
				});
				$edit.find("textarea")
					.focus()
					.one("keydown", function() { edit_activate(); });

				edit_lock = false;
				edit_hover = false;
				edit_active = false;
			}
			clear_timeout();
		} else if($edit != null) {
			if(!edit_lock && !edit_hover) {
				if(timeout == null) {
					timeout = setTimeout(function() {
						$edit.remove();
						$edit = null;
					}, 100);
				}
			}
		}
	};

	var $toolbox = null;
	
	function showToolbox(visible) {
		if(visible) {
			if($toolbox != null) return;
			$toolbox = $("<div></div>")
				.appendTo(self.$div);
	
			$("<a href=\"#\"><i></i></a>").addClass("icon-plus")
				.css({ position: "absolute",bottom: 4, left: 4, })
				.hover(function() {
					showNewNode(true);
				}, function() {
					showNewNode(false);
				})
				.appendTo($toolbox);
	
			$("<a href=\"#\"><i></i></a>").addClass("icon-remove")
				.css({ position: "absolute",bottom: 4, left: 24, })
				.click(function(e) {
					if(confirm("ノードを削除しますか？")) {
						self.viewer.getDCase().removeNode(self.node);
					}
				})
				.appendTo($toolbox);
		} else {
			$toolbox.remove();
			$toolbox = null;
		}
	};

	self.$div.hover(function() {
		showToolbox(true);
	}, function() {
		showToolbox(false);
	});
};

