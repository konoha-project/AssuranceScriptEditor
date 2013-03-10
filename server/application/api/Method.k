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

void getDCaseList (Json request) {
	Json dcaseList = global.model.getDCaseList();
	Json res = new Json();
	res.set("dcaseList", dcaseList);
	Json response = createMessage(res);
	stdout.print(response);
}

void createDCase (Json request) {
	Json   tree      = request.get("tree");
	String dcaseName = request.getString("dcaseName");
	int    userId    = request.getInt("userId");
	Json res = global.model.createDCase(tree, dcaseName, userId);
	Json response = createMessage(res);
	stdout.print(response);
}

void getCommitList (Json request) {
	int dcaseId = request.getInt("dcaseId");
	Json commitIdList = global.model.GetCommitList(dcaseId);
	Json res = new Json();
	res.set("commitIdList", commitIdList);
	Json response = createMessage(res);
	stdout.print(response);
}

void commit (Json request) {
	Json tree = request.get("tree");
	int prev_id = request.getInt("commitId");
	int userId = request.getInt("userId");
	String message = request.getString("commitMessage");
	int commitId = global.model.Commit(tree,prev_id,userId,message);
	Json res = new Json();
	res.setInt("commitId",commitId);
	Json response = createMessage(res);
	stdout.print(response);
}

void getNodeTree (Json request) {
	int commitId = request.getInt("commitId");
	System.p(request);
	Json tree = global.model.GetNodeTree(commitId);
	Json res = new Json();
	res.set("tree",tree);
	Json response = createMessage(res);
	stdout.print(response);
}

void searchDCase(Json request) {
	String text = request.getString("text");
	Json result = global.model.Search(text);
	Json res = new Json();
	res.set("SearchResult", result);
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
		this.functions.set("createDCase"  , createDCase);
		this.functions.set("searchDCase"  , searchDCase);
		this.functions.set("commit"       , commit);
		this.functions.set("getDCaseList" , getDCaseList);
		this.functions.set("getNodeTree"  , getNodeTree);
		this.functions.set("getCommitList", getCommitList);
		this.functions.set("login"        , login);
		this.functions.set("register"     , register);
	}
}
