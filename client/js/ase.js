var ASE = function(body, defaultDCaseId) {
	var self = this;

	//--------------------------------------------------------

	var copiedNode = null;
	var matchResult = document.cookie.match(/userId=(\w+);?/);
	var userId = matchResult ? parseInt(matchResult[1]) : null;

	if(defaultDCaseId == 0) {
		$("#dcase-manager").css("display", "block");

		if(userId != null) {
			$("#dcase-create").click(function() {
				var name = $("#inputDCaseName").attr("value");
				var desc = $("#inputDesc").attr("value");
				var error = false;
				if(name == "") {
					$("#newdcase-name").addClass("error");
					error = true;
				} else {
					$("#newdcase-name").removeClass("error");
				}
				if(desc == "") {
					$("#newdcase-desc").addClass("error");
					error = true;
				}
				if(error) return;
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
				location.href = "./?dcaseId=" + r.dcaseId;
			});
		} else {
			$("#dcase-create").addClass("disabled");
		}

		var $tbody = $("#dcase-select-table");
		$.each(DCaseAPI.getDCaseList(), function(i, dcase) {
			var id = dcase.dcaseId;
			var name = dcase.dcaseName;
			var user = "owner user";
			var lastDate = "?/??";
			var lastUser = "last user";
			var html = "<td><a href=\"./?dcaseId=" + id + "\">" + name + 
					"</a></td><td>" + user + "</td><td>" + lastDate + "</td><td>" +
					lastUser + "</td>";
			$("<tr></tr>")
				.html(html)
				.click(function() {
					if(self.checkCommited()) {
						var r = DCaseAPI.getDCase(dcase.dcaseId);
						var dcase0 = new DCase(r.tree, dcase.dcaseId, r.commitId);
						viewer.setDCase(dcase0);
						timeline.repaint(dcase0);
					}
				})
				.appendTo($tbody);
		});
		return;
	}

	$("#viewer").css("display", "block");
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

	this.commit = function() {
		var msg = prompt("コミットメッセージを入力して下さい");
		if(msg != null) {
			if(viewer.getDCase().commit(msg, userId)) {
				alert("コミットしました");
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
		viewer.getDCase().undo();
	});

	$("#menu-redo").click(function() {
		viewer.getDCase().redo();
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

	//--------------------------------------------------------

	(function() {
		// update color theme
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

		// show DCase
		var r = DCaseAPI.getDCase(defaultDCaseId);
		var dcase = new DCase(r.tree, defaultDCaseId, r.commitId);
		viewer.setDCase(dcase);
		timeline.repaint(dcase);
	}());

};

