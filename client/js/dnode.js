//-----------------------------------------------------------------------------

var DCaseNode = function(id, name, type, desc) {
	this.id = id;
	this.name = name;
	this.type = type;
	this.desc = desc;
	this.children = [];
	this.context = null;
	this.parents = [];

	this.updateFlags();
	if(type == "Solution") {
		this.isDScript = true;
	}
	if(type == "Context" || type == "Subject" || type == "Rebuttal") {
		this.isContext = true;
	}
};

DCaseNode.prototype.isContext = false;
DCaseNode.prototype.isArgument = false;
DCaseNode.prototype.isUndeveloped = false;
DCaseNode.prototype.isDScript = false;

//-----------------------------------------------------------------------------

DCaseNode.prototype.getNodeCount = function() {
	return this.children.length + (this.context != null ? 1 : 0);
};

DCaseNode.prototype.eachNode = function(f) {
	$.each(this.children, function(i, node) {
		f(node);
	});
	if(this.context != null) {
		f(this.context);
	}
};

DCaseNode.prototype.traverse = function(f, parent, index) {
	f(this, parent, index);
	var self = this;
	$.each(this.children, function(i, node) {
		node.traverse(f, self, i);
	});
	if(this.context != null) {
		f(this.context);
	}
};

DCaseNode.prototype.deepCopy = function() {//FIXME id
	var node = new DCaseNode(this.id, this.name, this.type, this.desc);
	this.eachNode(function(child) {
		node.addChild(child.deepCopy());
	});
	return node;
};

//-----------------------------------------------------------------------------

DCaseNode.prototype.insertChild = function(node, index) {
	if(!node.isContext) {
		this.children.splice(index, 0, node);
	} else {
		this.context = node;
	}
	node.parents.push(this);
	this.updateFlags();
};

DCaseNode.prototype.removeChild = function(node) {
	if(this.context == node) {
		this.context = null;
	} else {
		var i = this.children.indexOf(node);
		this.children.splice(i, 1);
	}
	node.parents.splice(node.parents.indexOf(this), 1);
	this.updateFlags();
};

DCaseNode.prototype.updateFlags = function() {
	if(this.type == "Goal") {
		this.isArgument = this.context != null;
		this.isUndeveloped = this.children.length == 0;
	}
};

DCaseNode.prototype.getHtmlDescription = function() {
	if(this.desc == "") {
		return "<font color=\"gray\">(no description)</font>";
	} else {
		return this.desc
			.replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/\n/g, "<br>");
	}
};

DCaseNode.prototype.isAppendableType = function(type) {
	var types = DCaseNode.SELECTABLE_TYPES[this.type];
	return types.indexOf(type) != -1;
};

DCaseNode.prototype.toJson = function() {
	var children = [];
	this.eachNode(function(node) {
		children.push(node.toJson());
	});
	return {
		id: this.id,
		name: this.name,
		type: this.type,
		description: this.desc,
		children: children
	};
};

//-----------------------------------------------------------------------------

DCaseNode.TYPES = [
	"Goal", "Context", "Subject",
	"Strategy", "Evidence", "Solution", "Rebuttal"
];

DCaseNode.SELECTABLE_TYPES = {
	"Goal": [ "Goal", "Context", "Subject", "Strategy", "Evidence", "Solution" ],
	"Context": [],
	"Subject": [],
	"Strategy": [ "Context", "Goal" ],
	"Evidence": [ "Rebuttal" ],
	"Solution": [ "Context", "Rebuttal" ],
	"Rebuttal": [],
};

DCaseNode.NAME_PREFIX = {
	"Goal": "G_",
	"Context": "C_",
	"Subject": "Sub_",
	"Strategy": "S_",
	"Evidence": "E_",
	"Solution": "Sol_",
	"Rebuttal": "R_",
};

//-----------------------------------------------------------------------------

var DCase = function(tree, argId, commitId) {
	this.node = null;
	this.commitId = commitId;
	this.argId = argId;
	this.opQueue = [];
	this.undoCount = 0;
	this.nodeCound = 0;
	this.typeCount = {};
	this.view = [];

	var types = DCaseNode.TYPES;
	for(var i=0; i<types.length; i++) {
		this.typeCount[types[i]] = 1;
	}
	if(tree != null) {
		this.decode(tree);
	} else {
		// TODO: add topgoal
	}
};

//-----------------------------------------------------------------------------

DCase.prototype.decode = function(tree) {
	function contextParams(params) {
		var s = "";
		for(key in params) {
			s += "@" + key + " : " + params[key] + "\n";
		}
		return s;
	}

	var self = this;
	var nodes = [];
	for(var i=0; i<tree.NodeList.length; i++) {
		var c = tree.NodeList[i];
		nodes[c.ThisNodeId] = c;
	}
	function create(id) {
		var data = nodes[id];
		var type = data.NodeType;
		var desc = data.Description;
		var node = self.createNode(type, desc);
		for(var i=0; i<data.Children.length; i++) {
			node.insertChild(create(data.Children[i]));
		}
		return node;
	}
	var topId = tree.TopGoalId;
	this.node = create(topId);
};

DCase.prototype.encode = function() {
	var tl = [];
	var node = this.node;
	node.traverse(function(node) {
		var c = [];
		node.eachNode(function(node) {
			c.push(node.id);
		});
		tl.push({
			ThisNodeId: node.id,
			NodeType: node.type,
			Description: node.desc,
			Children: c,
		});
	});
	var tree = {
		NodeList: tl,
		TopGoalId: node.id,
		NodeCount: this.nodeCount
	};
	return tree;
};

//-----------------------------------------------------------------------------

DCase.prototype.isChanged = function() {
	return this.opQueue.length - this.undoCount > 0;
};

DCase.prototype.getArgumentId = function() {
	return this.argId;
};

DCase.prototype.getCommitId = function() {
	return this.commitId;
};

DCase.prototype.getTopGoal = function() {
	return this.node;
};

//-----------------------------------------------------------------------------

DCase.prototype.createNode = function(type, desc) {
	var id = this.nodeCount++;
	var name = DCaseNode.NAME_PREFIX[type] + (this.typeCount[type]++);
	return new DCaseNode(id, name, type, desc);
};

DCase.prototype.insertNode = function(parent, type, desc, index) {
	var self = this;
	if(index == null) {
		index = parent.children.length;
	}
	var node = this.createNode(type, desc);
	this.applyOperation({
		redo: function() {
			parent.insertChild(node, index);
			self.nodeInserted(parent, node, index);
		},
		undo: function() {
			parent.removeChild(node);
			self.nodeRemoved(parent, node);
		},
	});
};

DCase.prototype.removeNode = function(parent, node) {
	var self = this;
	var index = this.parent[0].children.indexOf(node);
	this.applyOperation({
		redo: function() {
			parent.removeChild(node);
			self.nodeRemoved(parent, node);
		},
		undo: function() {
			parent.insertChild(node, index);
			self.nodeInserted(parent, node, index);
		},
	});
};

DCase.prototype.setDescription = function(node, desc) {
	var self = this;
	var oldDesc = node.desc;
	this.applyOperation({
		redo: function() {
			node.desc = desc;
			self.nodeChanged(node);
		},
		undo: function() {
			node.desc = oldDesc;
			self.nodeChanged(node);
		},
	});
};

DCase.prototype.undo = function() {
	var n = this.opQueue.length;
	if(n > this.undoCount) {
		this.undoCount++;
		var op = this.opQueue[n - this.undoCount];
		op.undo();
		return true;
	} else {
		return false;
	}
};

DCase.prototype.redo = function() {
	if(this.undoCount > 0) {
		var op = this.opQueue[this.opQueue.length - this.undoCount];
		this.undoCount--;
		op.redo();
		return true;
	} else {
		return false;
	}
};

DCase.prototype.applyOperation = function(op) {
	this.opQueue.splice(this.opQueue.length - this.undoCount, this.undoCount, op);
	this.undoCount = 0;
	op.redo();
};

DCase.prototype.commit = function(msg, userId) {
	var tree = this.encode();
	var r = DCaseAPI.commit(tree, this.commitId, msg, userId);
	this.commitId = r.commitId;
	this.undoCount = 0;
	this.opQueue = [];
	return true;
};

//-----------------------------------------------------------------------------

DCase.prototype.nodeInserted = function() {};
DCase.prototype.nodeRemoved = function(){};
DCase.prototype.nodeChanged = function(){};

