var DCaseAPI = new Object();

DCaseAPI.cgi = "cgi/api.cgi";

DCaseAPI.call = function(method, params) {
	var cmd = {
		jsonrpc: "2.0",
		method: method,
		version: "1.0",
		params: params
	};
	var res = $.ajax({
		type: "POST",
		url: DCaseAPI.cgi,
		async: false,
		data: JSON.stringify(cmd),
		dataType: "json",
		error: function(req, stat, err) {
			//alert(stat);
		}
	});
	try {
		var jres = JSON.parse(res.responseText);
		return jres.result;
	} catch(e) {
		console.log("json parse error!");
	}
};

//-------------------------------------

DCaseAPI.getDCaseList = function() {
	return this.call("getDCaseList", {}).dcaseList;
};

DCaseAPI.createDCase = function(name, desc, userId) {
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
	var r = this.call("createDCase", {
		dcaseName: name, tree: tree, userId: userId
	});
	return new DCase(tree, r.dcaseId, r.commitId);
};

DCaseAPI.getCommitList = function(dcaseId) {
	return this.call("getCommitList", { dcaseId:dcaseId }).commitList;
};

DCaseAPI.commit = function(tree, msg, commitId, userId) {
	return this.call("commit", {
		tree: tree,
		commitMessage: msg,
		commitId: commitId, 
		userId: userId
	}).commitId;
};

DCaseAPI.getNodeTree = function(dcaseId, commitId) {
	var r = this.call("getNodeTree", { commitId: commitId });
	return new DCase(r.tree, dcaseId, commitId);
};

DCaseAPI.searchDCase = function(text) {
	return this.call("searchDCase", { text: text }).searchResultList;
};

