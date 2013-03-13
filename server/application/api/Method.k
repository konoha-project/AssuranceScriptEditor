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

Json createMessage(Json result, int id) {
	Json json = new Json();
	json.setString("jsonrpc", "2.0");
	json.setInt("id", id);
	json.set("result", result);
	return json;
}

void getDCaseList (Json request, int id) {
	Json dcaseList = global.model.getDCaseList();
	Json res = new Json();
	res.set("dcaseList", dcaseList);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void createDCase (Json request, int id) {
	Json   tree      = request.get("tree");
	String dcaseName = request.getString("dcaseName");
	int    userId    = request.getInt("userId");
	Json res = global.model.createDCase(tree, dcaseName, userId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void getCommitList (Json request, int id) {
	int dcaseId = request.getInt("dcaseId");
	Json commitIdList = global.model.GetCommitList(dcaseId);
	Json res = new Json();
	res.set("commitList", commitIdList);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void commit (Json request, int id) {
	Json tree = request.get("tree");
	int prev_id = request.getInt("commitId");
	int userId = request.getInt("userId");
	String message = request.getString("commitMessage");
	int commitId = global.model.Commit(tree,prev_id,userId,message);
	Json res = new Json();
	res.setInt("commitId",commitId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void getDCase(Json request, int id) {
	int dcaseId = request.getInt("dcaseId");
	Json res = global.model.getDCase(dcaseId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void getNodeTree (Json request, int id) {
	int commitId = request.getInt("commitId");
	Json tree = global.model.GetNodeTree(commitId);
	Json res = new Json();
	res.set("tree",tree);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void searchDCase(Json request, int id) {
	String text = request.getString("text");
	Json result = global.model.search(text);
	Json res = new Json();
	res.set("searchResultList", result);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void register(Json request, int id) {
	String user = request.getString("userName");
	String pass = request.getString("password");
	int userId = global.model.register(user,pass);
	Json res = new Json();
	res.setInt("userId", userId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void login(Json request, int id) {
	String user = request.getString("userName");
	String pass = request.getString("password");
	int userId = global.model.login(user,pass);
	Json res = new Json();
	res.setInt("userId", userId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

class JsonRPCServer {
	Map[Func[void, Json, int]] functions;

	JsonRPCServer() {
		functions = new Map[Func[void, Json, int]]();
	}

	void dispatch(String key, Json request, int id) {
		Func[void, Json, int] f = this.functions.get(key);
		f(request, id);
	}

	void registerFunctions() {
		this.functions.set("createDCase"  , createDCase);
		this.functions.set("getDCase"     , getDCase);
		this.functions.set("searchDCase"  , searchDCase);
		this.functions.set("commit"       , commit);
		this.functions.set("getDCaseList" , getDCaseList);
		this.functions.set("getNodeTree"  , getNodeTree);
		this.functions.set("getCommitList", getCommitList);
		this.functions.set("login"        , login);
		this.functions.set("register"     , register);
	}
}
