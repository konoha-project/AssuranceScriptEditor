var DCaseAPI = new Object();

DCaseAPI.cgi = "cgi/api.cgi";

DCaseAPI.default_success_callback = function(result) {
	// do nothing
};

DCaseAPI.default_error_callback = function(req, stat, err) {
	alert("ajax error");
};

DCaseAPI.call = function(method, params, callback, error_callback) {
	var cmd = {
		jsonrpc: "2.0",
		method: method,
		version: "1.0",
		params: params
	};
	var async = callback != null;
	if(callback == null) callback = this.default_success_callback;
	if(error_callback == null) error_callback = this.default_error_callback;
	var res = $.ajax({
		type: "POST",
		url: this.cgi,
		async: async,
		data: JSON.stringify(cmd),
		dataType: "json",
		success: function(response) {
			callback(response.result);
		},
		error: error_callback
	});
	if(!async) {
		return JSON.parse(res.responseText).result;
	}
};

//-------------------------------------

DCaseAPI.getDCaseList = function(callback, error) {
	try{
		return this.call("getDCaseList", {}, callback, error).dcaseList;
	}catch(e){
		return [];
	}
};

DCaseAPI.createDCase = function(name, desc, userId, callback, error) {
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
	}, callback, error);
	return new DCase(tree, r.dcaseId, r.commitId);
};

DCaseAPI.getCommitList = function(dcaseId, callback, error) {
	return this.call("getCommitList", { dcaseId:dcaseId }, callback, error).commitList;
};

DCaseAPI.commit = function(tree, msg, commitId, userId, callback, error) {
	return this.call("commit", {
		tree: tree,
		commitMessage: msg,
		commitId: commitId, 
		userId: userId
	}, callback, error).commitId;
};

DCaseAPI.getNodeTree = function(dcaseId, commitId, callback, error) {
	var r = this.call("getNodeTree", { commitId: commitId }, callback, error);
	return new DCase(r.tree, dcaseId, commitId);
};

DCaseAPI.searchDCase = function(text, callback, error) {
	return this.call("searchDCase", { text: text }, callback, error).searchResultList;
};

