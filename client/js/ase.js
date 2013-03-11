var ASE = function(body) {
	var self = this;
	var $body = this.$body = $(body);
	var viewer = this.viewer = new DCaseViewer(document.getElementById("viewer"));
	var timeline = this.timeline = new TimeLine($body);

	//--------------------------------------------------------

	var copiedNode = null;
	var userId = document.cookie.match(/userName=(\w+);?/)[1];

	//--------------------------------------------------------

	timeline.onDCaseSelected = function(argId, commitId) {
		if(self.checkCommited()) {
			var dcase = DCaseAPI.getNodeTree(argId, commitId);
			viewer.setDCase(dcase);
			return true;
		} else {
			return false;
		}
	};

	//--------------------------------------------------------

	this.insertToSelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			var sel = DCaseNode.SELECTABLE_TYPES[view.node.type];
			DNodeEditWindow.open(null, sel, function(type, desc) {
				viewer.getDCase().insertNode(view.node, type, desc);
			});
		}
	};

	this.removeSelectedNode = function() {
		var view = viewer.getSelectedNode();
		if(view != null) {
			var parents = view.node.parents;
			if(parents.length > 0) {
				if(confirm("ノードを削除しますか？")) {
					viewer.getDCase().removeNode(view.node);
				}
			}
		}
	};

	this.createNewDCase = function() {
		if(self.checkCommited()) {
			DNodeEditWindow.open(null, ["Goal"], function(type, desc) {
				var name = "new DCase";
				var dcase = DCaseAPI.createDCase(name, desc, userId);
				viewer.setDCase(dcase);
				timeline.repaint(dcase);
				self.updateDCaseList();
			});
		}
	};

	this.commit = function() {
		var msg = prompt("コミットメッセージを入力して下さい");
		if(msg != null) {
			if(viewer.getDCase().commit(msg, userId)) {
				alert("コミットしました");
				timeline.repaint();
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
				viewer.getDCase().applyOperation(op);
				viewer.structureUpdated();
			} else {
				alert("そのタイプは貼付けられません");
			}
		}
	};

	this.listupDCase = function(callback) {
		$.each(DCaseAPI.getDCaseList(), function(i, arg) {
			callback(arg);
		});
	};

	this.updateDCaseList = function() {
		var $m = $("#menu-dcase");
		$m.empty();

		$("<li></li>")
			.html("<a href=\"#\">新規</a>")
			.click(function() {
				self.createNewDCase();
			})
			.appendTo($m);
		$("<li></li>")
			.addClass("divider")
			.appendTo($m);
		self.listupDCase(function(dcase) {
			var commitList = DCaseAPI.getCommitList(dcase);
			var latest = commitList[commitList.length-1];
			$("<li></li>")
				.html("<a href=\"#\">" + dcase.dcaseName+ "</a>")
				.click(function() {
					if(self.checkCommited()) {
						var dcase0 = DCaseAPI.getNodeTree(dcase.dcaseId, latest.commitId);
						viewer.setDCase(dcase0);
						timeline.repaint(dcase0);
					}
				})
				.appendTo($m);
		});
	};

	this.checkCommited = function() {
		var dcase = viewer.getDCase();
		if(dcase != null && dcase.isChanged()) {
			if(!confirm("未コミットの変更がありますが，破棄しますか?")) {
				return false;
			}
		}
		return true;
	};

	$(window).bind("beforeunload", function(e) {
		var dcase = viewer.getDCase();
		if(dcase != null && dcase.isChanged()) {
			return "未コミットの変更があります";
		}
	});

	self.updateDCaseList();

	//--------------------------------------------------------

	this.searchNode = function(text, types, beginDate, endDate, callback) {
		var root = viewer.getDCase().getTopGoal();
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

	this.searchDCase = function(text, types, beginDate, endDate, callback) {
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
		var commitId = viewer.getDCase().commitId;
		var url = URL_EXPORT + "?" + commitId + "." + type;
		window.open(url, "_black");
	};

	//--------------------------------------------------------

	$("#menu-commit").click(function() {
		self.commit();
	});

	$("#menu-undo").click(function() {
		if(viewer.getDCase().undo()) {
			viewer.structureUpdated();
		}
	});

	$("#menu-redo").click(function() {
		if(viewer.getDCase().redo()) {
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

