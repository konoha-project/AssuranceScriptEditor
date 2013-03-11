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
}

//-------------------------------------

DCaseAPI.getArgumentList = function() {
	try {
		return this.call("getArgumentList", {}).argumentIdList;
	} catch(e) {
		return [];
	}
};

DCaseAPI.getCommitList = function(arg) {
	try {
		return this.call("getCommitList", { argumentId: arg }).commitIdList;
	} catch(e) {
		return [];
	}
};

DCaseAPI.getDCase = function(argId, commitId) {
	var r = this.call("getNodeTree", { commitId: commitId });
	return new DCase(r.tree, argId, commitId);
};

DCaseAPI.createDCase = function(desc, userId) {
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
	var r = this.call("createTopGoal", {
		tree:	tree, userId: userId
	});
	return new DCase(tree, r.argmentId, r.commitId);
};

DCaseAPI.search = function(text) {
	return this.call("search", {text: text});
}

DCaseAPI.commit = function(tree, commitId, msg, userId) {
	return this.call("commit", {
		tree: tree,
		commitId: commitId, 
		message: msg,
		userId: userId
	});
}

