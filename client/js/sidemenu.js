var SideMenu = function(root, viewer) {
	var self = this;
	var timeline = new TimeLine(root, viewer);

	//FIXME
	var userId = 1234;

	//--------------------------------------------------------

	this.insertToSelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			var sel = DNode.SELECTABLE_TYPES[view.node.type];
			DNodeEditWindow.open(null, sel, function(newNode) {
				var op = new InsertOperation(view.node, newNode);
				viewer.getArgument().applyOperation(op);
				viewer.structureUpdated();
			});
		}
	}

	this.removeSelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			var parents = view.node.parents;
			if(parents.length > 0) {
				if(confirm("ノードを削除しますか？")) {
					var op = new RemoveOperation(parents[0], view.node);
					viewer.getArgument().applyOperation(op);
					viewer.structureUpdated();
				}
			}
		}
	}

	this.createNewArgument = function() {
		DNodeEditWindow.open(null, ["Goal"], function(newNode) {
			if(checkCommited()) {
				viewer.setArgument(DCaseAPI.createArgument(newNode, userId));
				timeline.repaint();
				updateArgumentList();
			}
		});
	};

	this.commit = function() {
		var msg = prompt("コミットメッセージを入力して下さい");
		if(msg != null) {
			if(viewer.getArgument().commit(msg, userId)) {
				timeline.repaint();
				alert("コミットしました");
			}
		}
	};

	//--------------------------------------------------------

	$("#menu-search input").blur(function(e) {
		clearInterval(this.interval_id);
		delete this.interval_id;
	}).keydown(function (e) {
		if (e.keyCode == 13) { // Enter key
			var i = this;
			var r = DCaseAPI.search(i.value);
			self.search_inc(i.value);
		}
	});

	this.search = function(text) {
		var $res = $("#menu-search ul");
		$res.empty();
		text = text.toLowerCase();
		function getPreviewText(target, text) { // [TODO] add color
			var index = target.toLowerCase().indexOf(text);
			var ret = target.substr(0, index) +
				"<b>" + target.substr(index, text.length) +
				"</b>" + target.substr(index + text.length)
			return ret;
		};
		function showResult($res, v, name, desc) {
			$("<ul>")
					.addClass("sidemenu-result")
					.html("<li>" + name + "</li>")
					//.html("<li>" + name + "<ul>" + desc + "</ul></li>")
					.click(function() {
						viewer.centerize(v, 500);
					})
					.appendTo($res);
		};
		function cmp(v) {
			var name = v.node.name;
			var desc = v.node.text;
			var d_index = desc.toLowerCase().indexOf(text);
			var n_index = name.toLowerCase().indexOf(text);
			if(d_index != -1 || n_index != -1) {
				var ptext = getPreviewText(desc, text);
				showResult($res, v, name, ptext);
			}
			v.forEachNode(cmp);
		}
		cmp(viewer.rootview);
	}

	var prev_isesarch = "";
	this.search_inc = function(text) {
		if(text !== prev_isesarch) {
			this.search(text);
		}
		prev_isesarch = text;
	}

	// init search list
	//this.search("");

	//--------------------------------------------------------

	var URL_EXPORT = "cgi/view.cgi";

	this.exportTree = function(type) {
		var commitId = viewer.getArgument().commitId;
		var url = URL_EXPORT + "?" + commitId + "." + type;
		window.open(url, "_black");
	};

	$("#menu-export-json").click(function() {
		self.exportTree("json");
	});

	$("#menu-export-png").click(function() {
		self.exportTree("png");
	});

	$("#menu-export-script").click(function() {
		self.exportTree("dscript");
	});

	//--------------------------------------------------------

	function checkCommited() {
		var arg = viewer.getArgument();
		if(arg != null && arg.isChanged()) {
			if(!confirm("未コミットの変更がありますが，破棄しますか?")) {
				return false;
			}
		}
		return true;
	}

	function updateArgumentList() {
		var $m = $("#menu-argument");
		$m.empty();

		$("<li></li>")
			.html("<a href=\"#\">新規</a>")
			.click(function() {
				self.createNewArgument();
			})
			.appendTo($m);
		$("<li></li>")
			.addClass("divider")
			.appendTo($m);

		$.each(DCaseAPI.getArgumentList(), function(i, arg) {
			var cl = DCaseAPI.getCommitList(arg);
			var br = cl[cl.length-1]
			$("<li></li>")
				.html("<a href=\"#\">" + br + "</a>")
				.click(function() {
					if(checkCommited()) {
						viewer.setArgument(DCaseAPI.getArgument(arg, br));
						timeline.repaint();
					}
				})
				.appendTo($m);
		});
	}
	updateArgumentList();

	$("#menu-commit").click(function() {
		self.commit();
	});

	$("#menu-undo").click(function() {
		if(viewer.getArgument().undo()) {
			viewer.structureUpdated();
		}
	});

	$("#menu-redo").click(function() {
		if(viewer.getArgument().redo()) {
			viewer.structureUpdated();
		}
	});

};

