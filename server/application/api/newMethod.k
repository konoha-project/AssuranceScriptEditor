Import("JavaScript.Array");
Import("JavaStyle.Object");
Import("Syntax.StringInterpolation");
Import("Syntax.GlobalVariable");
Import("Syntax.JavaStyleClass");
Import("Syntax.CStyleWhile");
Import("MiniKonoha.NameSpace");
Import("Type.File");
Import("Type.Json");
Import("MiniKonoha.Map");
Import("Deos.DCaseCloud");

DCaseModel model = new DCaseModel("dcasedb", "dcasedb");

const IntList=Array[int];
@Public IntList ConvertToIntList(Json json) {
	IntList a = [];
	int i, length = json.getSize();
	while (i < length) {
		a.add(json.getInt(i));
		i = i + 1;
	}
	return a;
}

@Public Json ConvertFromIntList(int[] intlist) {
	Json a = new Json([]);
	int i, length = intlist.getSize();
	while (i < length) {
		a.add(intlist[i]);
		i = i + 1;
	}
	return a;
}

Json createMessage(Json result) {
	Json json = new Json();
	json.setString("jsonrpc", "2.0");
	json.setString("version", "1.0");
	json.set("result", result);
	return json;
}

void Commit (Json request) {
	Json tree = request.get("tree");
	int prev_id = request.getInt("commitId");
	int commitId = global.model.Commit(tree,prev_id);
	Json res = new Json();
	res.setInt("commitId",commitId);
	Json response = createMessage(res);
	stdout.print(response);
}

void getArgumentList (Json request) {
	int[] commitId = global.model.getArgumentList();
	Json res = new Json();
	res.set("commitId", ConvertFromIntList(commitId));
	Json response = createMessage(res);
	stdout.print(response);
}

void getNodeTree (Json request) {
	int commitId = request.getInt("commitId");
	Json tree = global.model.GetNodeTree(commitId);
	Json res = new Json();
	res.set("tree",tree);
	Json response = createMessage(res);
	stdout.print(response);
}

void CreateTopGoal (Json request) {
	Json tree = request.get("tree");
	int commitId = global.model.CreateTopGoal(tree);
	Json res = new Json();
	res.setInt("commitId",commitId);
	Json response = createMessage(res);
	stdout.print(response);
}

class JsonRPCServer {
	Map[Func[void, Json]] functions;

	JsonRPCServer() {
		functions = new Map[Func[void, Json]]();
	}

	void dispatch(String key,Json request) {
		Func[void, Json] f = this.functions.get(key);
		f(request);
	}

	void registerFunctions() {
		this.functions.set("CreateTopGoal"        ,CreateTopGoal);
//		this.functions.set("FindNodeByDescription",FindNodeByDescription);
//		this.functions.set("FindContextByAttribute",FindContextByAttribute);
		this.functions.set("commit"               ,Commit);
//		this.functions.set("getNode"              ,getNode);
		this.functions.set("getArgumentList"      ,getArgumentList);
		this.functions.set("getNodeTree"          ,getNodeTree);
//		this.functions.set("getNodeTreeFromSnapshotId",getNodeTreeFromSnapshotId);
//		this.functions.set("getNodeTreeBetween"   ,getNodeTreeBetween);
//		this.functions.set("OpenProcessContext"   ,OpenProcessContext);
		//this.functions.set("CloseProcessContext",CloseProcessContext);
//		this.functions.set("getProcessContextIds" ,getProcessContextIds);
//		this.functions.set("getSnapshotList"      ,getSnapshotList);
//		this.functions.set("getSnapshotIds"       ,getSnapshotIds);
		//this.functions.set("getContext"           ,getContext);
//		this.functions.set("Support"              ,Support);
//		this.functions.set("Rebuttal"             ,Rebuttal);
	}
}
