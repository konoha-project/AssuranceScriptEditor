var ASE = function(body, defaultDCaseId) {
	var self = this;

	//--------------------------------------------------------

	var copiedNode = null;
	var matchResult = document.cookie.match(/userId=(\w+);?/);
	var userId = matchResult ? parseInt(matchResult[1]) : null;

	var $body = this.$body = $(body);
	var viewer = this.viewer = new DCaseViewer(document.getElementById("viewer"),
			null, userId != null);
	var timeline = this.timeline = new TimeLine($body);

	//--------------------------------------------------------

	$("#menu-history-toggle").click(function() {
		timeline.visible();
	});

	timeline.onDCaseSelected = function(dcaseId, commitId) {
		if(self.checkCommited()) {
			var tree = DCaseAPI.getNodeTree(commitId);
			viewer.setDCase(new DCase(tree, dcaseId, commitId));
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
				var id = 0;
				var tree = {
					NodeList: [{
						ThisNodeId: id,
						NodeType: "Goal",
						Description: desc,
						Children: [],
					}],
					TopGoalId: id,
					NodeCount: 1,
				};
				var r = DCaseAPI.createDCase(name, tree, userId);
				var dcase = new DCase(tree, r.dcaseId, r.commitId);
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
				self.updateDCaseList();
				timeline.repaint(viewer.getDCase());
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
			if(view.node.appendableTypes().indexOf(copiedNode.type) != -1) {
				viewer.getDCase().pasteNode(view.node, copiedNode);
			} else {
				alert("そのタイプは貼付けられません");
			}
		}
	};

	this.updateDCaseList = function() {
		var $m = $("#menu-dcase");
		$m.empty();

		if(userId != null) {
			$("<li></li>")
				.html("<a href=\"#\">新規</a>")
				.click(function() {
					self.createNewDCase();
				})
				.appendTo($m);
			$("<li></li>")
				.addClass("divider")
				.appendTo($m);
		}

		$.each(DCaseAPI.getDCaseList(), function(i, dcase) {
			$("<li></li>")
				.html("<a href=\"#\">" + dcase.dcaseName+ "</a>")
				.click(function() {
					if(self.checkCommited()) {
						var r = DCaseAPI.getDCase(dcase.dcaseId);
						var dcase0 = new DCase(r.tree, dcase.dcaseId, r.commitId);
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
	if(defaultDCaseId != 0) {
		var r = DCaseAPI.getDCase(defaultDCaseId);
		var dcase = new DCase(r.tree, defaultDCaseId, r.commitId);
		viewer.setDCase(dcase);
		timeline.repaint(dcase);
	}

	//--------------------------------------------------------

	this.searchNode = function(text, types, beginDate, endDate, callback, callbackOnNoResult) {
		var dcase = viewer.getDCase();
		var root = dcase ? dcase.getTopGoal() : undefined;
		if(!root) {
			if(callbackOnNoResult) {
				callbackOnNoResult();
			}
			return;
		}
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

	this.updateSearchResult = function(text) {
		$('#search-query').popover('show');
		var $res = $("#search_result_ul");
		$res.empty();
		text = text.toLowerCase();
		var result = DCaseAPI.searchDCase(text);
		if(result.length == 0) {
			$res.append("<li>No Results</li>");
		} else {
			for(var i = 0; i < result.length; ++i) {
				var res = result[i];
				$("<li>")
				.text(res.dcaseId)
				.click(function() {
					viewer.centerize(v, 500);
				})
				.appendTo($res);
			}
		}
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

	var colorThemes = [
		viewer.default_colorTheme,
		{
			themeName: "TiffanyBlue",
			fill: {
				"Goal"    : "#b4d8df",
				"Context" : "#dbf5f3",
				"Subject" : "#dbf5f3",
				"Strategy": "#b4d8df",
				"Evidence": "#dbf5f3",
				"Solution": "#dbf5f3",
				"Rebuttal": "#eeaaaa",
			},
			__proto__: viewer.default_colorTheme
		},
		{
			themeName: "simple",
			fill: {
				"Goal"    : "#ffffff",
				"Context" : "#ffffff",
				"Subject" : "#ffffff",
				"Strategy": "#ffffff",
				"Evidence": "#ffffff",
				"Solution": "#ffffff",
				"Rebuttal": "#ffffff",
			},
			stroke: {
				"Goal"    : "#000000",
				"Context" : "#000000",
				"Subject" : "#000000",
				"Strategy": "#000000",
				"Evidence": "#000000",
				"Solution": "#000000",
				"Rebuttal": "#000000",
			},
			__proto__: viewer.default_colorTheme
		},
	];

	(function() {
		var $ul = $("#menu-change-theme");
		$.each(colorThemes, function(i, theme) {
			var sample = "";
			$.each(DCaseNode.TYPES, function(i, type) {
				sample += "<span style=\"color: " + theme.fill[type] + ";\">■</span>";
			});
			var $li = $("<li></li>")
				.html("<a href=\"#\">" + sample + theme.themeName + "</a>")
				.appendTo($ul);
			$li.click(function() {
				viewer.setColorTheme(theme);
			});
		});
	}());

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

