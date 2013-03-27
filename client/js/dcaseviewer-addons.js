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

	self.$divText.addClass("node-text-editable");

	function showInplace() {
		if($edit == null) {
			var cc = 0;
			self.$divText.css("display", "none");
			self.viewer.$root.css("-moz-user-select", "text");

			$edit = $("<textarea></textarea>")
				.addClass("node-inplace")
				.css("top", self.$divText.offset().y)
				.attr("value", self.node.desc)
				.appendTo(self.$div)
				.focus()
				.mousedown(function(e) { e.stopPropagation(); })
				.mousewheel(function(e) { e.stopPropagation(); })
				.dblclick(function(e) {
					if(cc >= 2) e.stopPropagation();
					cc = 0;
				})
				.click(function(e) { cc++; e.stopPropagation(); })
				.blur(function() {
					var newDesc = $edit.attr("value");
					var node = self.node;
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
			self.$divText.css("display", "block");
			self.viewer.$root.css("-moz-user-select", "none");
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
		function edit_close() {
			$edit.remove();
			$edit = null;
			self.viewer.$root.css("-moz-user-select", "text");
		}
		function edit_activate() {
			if(!edit_active) {
				edit_active = true;
				edit_lock = true;
				$edit.css("opacity", 0.95);
				self.viewer.$root.css("-moz-user-select", "text");
				self.viewer.$root.one("click", function() {
					var text = $edit.find("textarea").attr("value");
					if(text != "") {
						self.viewer.getDCase().insertNode(self.node, type_selected, text);
					}
					edit_close();
				});
			}
		}
		function clear_timeout() {
			if(timeout != null) {
				clearTimeout(timeout);
				timeout = null;
			}
		}
		if(visible) {
		var types = self.node.appendableTypes();
		if(self.node.contexts.length > 0) {
			types = types.slice(0);//clone
			for(var i=0; i<self.node.contexts.length; i++) {
				types.splice(types.indexOf(self.node.contexts[i].type), 1);
			}
		}
			if($edit == null && types.length > 0) {
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
				$.each(types, function(i, type) {
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
					.mousedown(function(e) { e.stopPropagation(); })
					.mousewheel(function(e) { e.stopPropagation(); })
					.dblclick(function(e) { e.stopPropagation(); })
					.one("keydown", function() { edit_activate(); });

				$edit.ready(function() {
					$("textarea").css("height", $ul.height());
				});

				edit_lock = false;
				edit_hover = false;
				edit_active = false;
			}
			clear_timeout();
		} else if($edit != null) {
			if(!edit_lock && !edit_hover) {
				if(timeout == null) {
					timeout = setTimeout(function() {
						edit_close();
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
				.css("display", self.$divText.css("display"))
				.appendTo(self.$div);
	
			$("<a href=\"#\"></a>").addClass("icon-plus")
				.css({ position: "absolute",bottom: 4, left: 4, })
				.hover(function() {
					showNewNode(true);
				}, function() {
					showNewNode(false);
				})
				.appendTo($toolbox);
	
			var $menu = $("#edit-menulist").clone()
				.css({ position: "absolute",bottom: 4, left: 24, display: "block" })
				.appendTo($toolbox);

			$menu.find("#ml-cut").click(function() {
				self.viewer.clipboard = self.node.deepCopy();
				self.viewer.getDCase().removeNode(self.node);
				console.log("cut");
			});

			$menu.find("#ml-copy").click(function() {
				self.viewer.clipboard = self.node.deepCopy();
				console.log("copied");
			});

			$menu.find("#ml-paste").click(function() {
				var node = self.viewer.clipboard;
				if(node != null) {
					if(self.node.appendableTypes().indexOf(node.type) != -1) {
						self.viewer.getDCase().pasteNode(self.node, node);
						console.log("pasted");
					} else {
						alert("そのタイプは貼付けられません");
					}
				}
			});

			if(self.node.parents.length != 0) {
				$menu.find("#ml-delete").click(function() {
					self.viewer.getDCase().removeNode(self.node);
				});
			} else {
				$menu.find("#ml-delete").parent("li").addClass("disabled");
				$menu.find("#ml-cut").parent("li").addClass("disabled");
			}

			$menu.find("#ml-export").click(function() {
				//TODO
			});

			$menu.find("#ml-openall").click(function() {
				self.viewer.expandBranch(self, true, true);
			});

			$menu.find("#ml-closeall").click(function() {
				self.viewer.expandBranch(self, false, true);
			});

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

var DNodeView_ToolBox_uneditable = function(self) {
	var $toolbox = null;
	
	function showToolbox(visible) {
		if(visible) {
			if($toolbox != null) return;
			$toolbox = $("<div></div>")
				.css("display", self.$divText.css("display"))
				.appendTo(self.$div);
			var $menu = $("#edit-menulist").clone()
				.css({ position: "absolute",bottom: 4, left: 4, display: "block" })
				.appendTo($toolbox);

			$menu.find("#ml-copy").click(function() {
				self.viewer.clipboard = self.node.deepCopy();
				console.log("copied");
			});

			$menu.find("#ml-cut").remove();
			$menu.find("#ml-paste").remove();
			$menu.find("#ml-delete").remove();

			$menu.find("#ml-export").click(function() {
				//TODO
			});

			$menu.find("#ml-openall").click(function() {
				self.viewer.expandBranch(self, true, true);
			});

			$menu.find("#ml-closeall").click(function() {
				self.viewer.expandBranch(self, false, true);
			});

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

