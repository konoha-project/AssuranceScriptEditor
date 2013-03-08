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

void commit (Json request) {
	Json tree = request.get("tree");
	int prev_id = request.getInt("commitId");
	int userId = request.getInt("userId");
	String message = request.getInt("message");
	int commitId = global.model.Commit(tree,prev_id,userId,message);
	Json res = new Json();
	res.setInt("commitId",commitId);
	Json response = createMessage(res);
	stdout.print(response);
}

void getArgumentList (Json request) {
	int[] argumentIdList = global.model.getArgumentList();
	Json res = new Json();
	res.set("argumentIdList", ConvertFromIntList(argumentIdList));
	Json response = createMessage(res);
	stdout.print(response);
}

/*
void getBranchList (Json request) {
	int argumentId = request.getInt("argumentId");
	int[] commitIdList = global.model.getBranchList(argumentId);
	Json res = new Json();
	res.set("commitIdList", ConvertFromIntList(commitIdList));
	Json response = createMessage(res);
	stdout.print(response);
}
*/

void getNodeTree (Json request) {
	int commitId = request.getInt("commitId");
	Json tree = global.model.GetNodeTree(commitId);
	Json res = new Json();
	res.set("tree",tree);
	Json response = createMessage(res);
	stdout.print(response);
}

void createTopGoal (Json request) {
	Json tree   = request.get("tree");
	int  userId = request.getInt("userId");
	Json res = global.model.CreateTopGoal(tree, userId);
	Json response = createMessage(res);
	stdout.print(response);
}

void getCommitList (Json request) {
	int argumentId = request.getInt("argumentId");
	int[] commitIdList = global.model.GetCommitList(argumentId);
	Json res = new Json();
	res.set("commitIdList", ConvertFromIntList(commitIdList));
	Json response = createMessage(res);
	stdout.print(response);
}

void search(Json request) {
	String text = request.getString("text");
	int[] commitIdList = global.model.Search(text);
	Json res = new Json();
	res.set("commitIdList", ConvertFromIntList(commitIdList));
	Json response = createMessage(res);
	stdout.print(response);
}

void register(Json request) {
	String user = request.getString("userName");
	String pass = request.getString("password");
	int userId = global.model.register(user,pass);
	Json res = new Json();
	res.setInt("userId", userId);
	Json response = createMessage(res);
	stdout.print(response);
}

void login(Json request) {
	String user = request.getString("userName");
	String pass = request.getString("password");
	int userId = global.model.login(user,pass);
	Json res = new Json();
	res.setInt("userId", userId);
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
		this.functions.set("createTopGoal"        ,createTopGoal);
		this.functions.set("search"               ,search);
//		this.functions.set("FindContextByAttribute",FindContextByAttribute);
		this.functions.set("commit"               ,commit);
//		this.functions.set("getNode"              ,getNode);
		this.functions.set("getArgumentList"      ,getArgumentList);
//		this.functions.set("getBranchList"        ,getBranchList);
		this.functions.set("getNodeTree"          ,getNodeTree);
//		this.functions.set("getNodeTreeFromSnapshotId",getNodeTreeFromSnapshotId);
//		this.functions.set("getNodeTreeBetween"   ,getNodeTreeBetween);
//		this.functions.set("OpenProcessContext"   ,OpenProcessContext);
		//this.functions.set("CloseProcessContext",CloseProcessContext);
//		this.functions.set("getProcessContextIds" ,getProcessContextIds);
		this.functions.set("getCommitList"        ,getCommitList);
		this.functions.set("login"                ,login);
		this.functions.set("register"             ,register);
//		this.functions.set("getSnapshotIds"       ,getSnapshotIds);
		//this.functions.set("getContext"         ,getContext);
//		this.functions.set("Support"              ,Support);
//		this.functions.set("Rebuttal"             ,Rebuttal);
	}
}
