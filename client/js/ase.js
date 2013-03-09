var ASE = function(body) {
	var self = this;
	var $body = this.$body = $(body);
	var viewer = this.viewer = new DCaseViewer(document.getElementById("viewer"));
	var timeline = this.timeline = new TimeLine($body);

	//--------------------------------------------------------

	var copiedNode = null;
	var userId = document.cookie.match(/userName=(\w+);?/)[1];

	//--------------------------------------------------------

	timeline.onArgumentSelected = function(argId, commitId) {
		if(self.checkCommited()) {
			var arg = DCaseAPI.getArgument(argId, commitId);
			viewer.setArgument(arg);
			return true;
		} else {
			return false;
		}
	};

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
	};

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
	};

	this.createNewArgument = function() {
		DNodeEditWindow.open(null, ["Goal"], function(newNode) {
			if(self.checkCommited()) {
				var arg = DCaseAPI.createArgument(newNode, userId);
				viewer.setArgument(arg);
				timeline.repaint(arg);
				updateArgumentList();
			}
		});
	};

	this.commit = function() {
		var msg = prompt("コミットメッセージを入力して下さい");
		if(msg != null) {
			if(viewer.getArgument().commit(msg, userId)) {
				var arg = DCaseAPI.getArgument(arg, br);
				timeline.repaint();
				alert("コミットしました");
			}
		}
	};

	this.copySelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			copiedNode = view.node.deepCopy();
		}
	};

	this.pasteToSelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			if(view.node.isAppendableType(copiedNode.type)) {
				var op = new InsertOperation(view.node, copiedNode.deepCopy());
				viewer.getArgument().applyOperation(op);
				viewer.structureUpdated();
			} else {
				alert("そのタイプは貼付けられません");
			}
		}
	};

	this.listupArgument = function(callback) {
		$.each(DCaseAPI.getArgumentList(), function(i, arg) {
			callback(arg);
		});
	};

	this.updateArgumentList = function() {
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
		self.listupArgument(function(arg) {
			var cl = DCaseAPI.getCommitList(arg);
			var br = cl[cl.length-1];
			$("<li></li>")
				.html("<a href=\"#\">" + br.commitId + "</a>")
				.click(function() {
					if(self.checkCommited()) {
						var arg = DCaseAPI.getArgument(arg, br);
						viewer.setArgument(arg);
						timeline.repaint(arg);
					}
				})
				.appendTo($m);
		});
	};

	this.checkCommited = function() {
		var arg = viewer.getArgument();
		if(arg != null && arg.isChanged()) {
			if(!confirm("未コミットの変更がありますが，破棄しますか?")) {
				return false;
			}
		}
		return true;
	};

	$(window).bind("beforeunload", function(e) {
		var a = viewer.getArgument();
		if(a != null && a.isChanged()) {
			return "未コミットの変更があります";
		}
	});

	self.updateArgumentList();

	//--------------------------------------------------------

	this.searchNode = function(text, types, beginDate, endDate, callback) {
		var root = viewer.getArgument().getTopGoal();
		root.traverse(function(node) {
			var name = node.name;
			var desc = node.text;
			var d_index = desc.toLowerCase().indexOf(text);
			var n_index = name.toLowerCase().indexOf(text);
			if(d_index != -1 || n_index != -1) {
				callback(node);
				//var ptext = getPreviewText(desc, text);
				//callback($res, v, name, ptext);
			}
		});
	};

	this.searchArgument = function(text, types, beginDate, endDate, callback) {
		//TODO
	};

	this.updateSearchResult = function() {
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
		self.searchNode(text, 0, 0, 0, 0, function(node) {
			var ptext = getPreviewText(node.desc, node.text);
			showResult($res, v, node.name, ptext);
		});
	};

	//--------------------------------------------------------

	var URL_EXPORT = "cgi/view.cgi";

	this.exportTree = function(type) {
		var commitId = viewer.getArgument().commitId;
		var url = URL_EXPORT + "?" + commitId + "." + type;
		window.open(url, "_black");
	};

	//--------------------------------------------------------

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

	$("#menu-copy").click(function() {
		self.copySelectedNode();
	});

	$("#menu-paste").click(function() {
		self.pasteToSelectedNode();
	});

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

	$(".tool-new").click(function() {
		self.insertToSelectedNode();
	});

	$(".tool-edit").click(function() {
		self.editSelectedNode();
	});

	$(".tool-remove").click(function() {
		self.removeSelectedNode();
	});

	$(".tool-play").click(function() {
		var v = viewer.getSelectedNode();
		viewer.showDScriptExecuteWindow(v.node.getDScriptNameInEvidence());
	});

};

