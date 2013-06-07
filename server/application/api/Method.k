Import("Lib.Curl");
Import("JavaScript.Array");
Import("JavaScript.String");
Import("JavaScript.Regexp");
Import("JavaStyle.Object");
Import("Syntax.StringInterpolation");
Import("Syntax.GlobalVariable");
Import("Syntax.JavaStyleClass");
Import("Syntax.CStyleWhile");
Import("Konoha.NameSpace");
Import("Type.File");
Import("Type.Json");
Import("Konoha.Map");
Import("Deos.DCaseCloud");

Load("redmine.k");
//Load("monitor.k");

Json Map2Json(Map[String] map) {
	int i = 0;
	String[] keys = map.keys();
	Json json = new Json();
	while(i < keys.getSize()) {
		json.setString(keys[i],map[keys[i]]);
		i = i + 1;
	}
	return json;
}

class MonitorData {
	String preset;
	int monitorId;
	Map[String] params;

	MonitorData(String preset, int monitorId, Map[String] params) {
		this.preset    = preset;
		this.monitorId = monitorId;
		this.params    = params;
	}

	Json toJson() {
		Json json =  new Json();
		json.setString("Preset",this.preset);
		json.setString("MonitorId",this.monitorId.toString());
		json.set("Params",Map2Json(this.params));
		return json;
	}
}

class AbstractMonitor {
	String url;
	CurlHttpClient http;

	AbstractMonitor(String url) {
		this.url  = url;
	}

	@Public Json Send_Receive() {
		return new Json();
	}

	@Public void Send_AddMonitor(int dcaseId, MonitorData[] dataList) {}
}

class MonitorClient extends AbstractMonitor {

	@Public Json Send_Receive() {
		this.http = new CurlHttpClient(url + "receive");
	}

	@Public void Send_AddMonitor(int dcaseId, MonitorData[] dataList) {
		this.http = new CurlHttpClient(url + "monitor");
		int i = 0;
		Json json = new Json([]);
		while(i < dataList.getSize()) {
			json.add(dataList[i].toJson());
			i = i + 1;
		}
		Json j = new Json();
		j.setString("DCaseId", dcaseId.toString());
		j.set("Monitors", json);
		this.http.postJson(j);
	}

}

DCaseModel    model     = new DCaseModel(user(), pass());
IssueAPI      api       = new IssueAPI(RedmineURL(), RedmineKey());//new RedmineAPI(RedmineURL(), RedmineKey());
AbstractMonitor monitor   = new MonitorClient(MonitorURL());

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
	global.api.createProject(dcaseName, "id" + res.getInt("dcaseId"));
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

boolean isExistIssue(int dcaseId, int nodeId) {
	Json json = global.api.getTicketsByDcaseId(dcaseId);
	String id = nodeId.toString();
	int i = 0;
	while(i < json.getSize()) {
		String s = json[i].getString("subject");
		if(s.search(id) >= 0) {
			return true;
		}
		i = i + 1;
	}
	return false;
}

void createMonitorIssue(Json nodeList, int dcaseId) {
	int i = 0;
	int len = nodeList.getSize();
	while(i < len) {
		if(nodeList[i].getString("NodeType") == "Monitor") {
			int nodeId = nodeList[i].getInt("ThisNodeId");
			if(isExistIssue(dcaseId,nodeId) == false) {
				String description = nodeList[i].getString("Description");
				global.api.createTicket(dcaseId, nodeId, description);
			}
		}
		i = i + 1;
	}
}

Json getMonitorContext(Json nodeList, int[] childIds) {
	int i = 0;
	int j = 0;
	int len = nodeList.getSize();
	while(i < childIds.getSize()) {
		while(j < len) {
			if(childIds[i] == nodeList[j].getInt("ThisNodeId")) {
				if(nodeList[j].getString("NodeType") == "Context") {
					return nodeList[j];
				}
			}
			j = j + 1;
		}
		i = i + 1;
	}
	return new Json();
}

String[] getAnnotation(String[] lines) {
	String[] ret = [];
	int j = 0;
	while(j < lines.getSize()) {
		if(lines[j][0] == "@") {
			ret.add(lines[j].slice(1));
		}
		j = j + 1;
	}
	return ret;
}

MonitorData createMonitorData(Json monitor, Json context) {
	String[] params_line = context.getString("Description").split("\n");
	String[] preset_line = monitor.getString("Description").split("\n");

	String[] params = getAnnotation(params_line);
//	String[] preset = preset_raw.match(/^@(.*)$/);
	String[] preset = getAnnotation(preset_line);

	Map[String] map = new Map[String];
	int i = 0;
	while(i < params.getSize()) {
		String[] kv = params[i].split(" ");
		map.set(kv[0], kv[1]);
		i = i + 1;
	}

	return new MonitorData(preset[0], monitor.getInt("ThisNodeId"), map);
}

MonitorData[] createMonitorList(Json nodeList) {
	int i = 0;
	int len = nodeList.getSize();
	MonitorData[] data = [];

	while(i < len) {
		if(nodeList[i].getString("NodeType") == "Monitor") {
			int nodeId     = nodeList[i].getInt("ThisNodeId");
			int[] childIds = ConvertToIntList(nodeList[i].get("Children"));
			Json context = getMonitorContext(nodeList, childIds);
			data.add(createMonitorData(nodeList[i],context));
		}
		i = i + 1;
	}

	return data;
}

void commit (Json request, int id) {
	Json tree = request.get("tree");
	int prev_id = request.getInt("commitId");
	int userId = request.getInt("userId");
	String message = request.getString("commitMessage");
	Json res = global.model.Commit(tree,prev_id,userId,message,0);
	MonitorData[] data = createMonitorList(tree.get("NodeList"));
	if(data.getSize() > 0) {
		global.monitor.Send_AddMonitor(res.getInt("dcaseId"), data);
		//createMonitorIssue(tree.get("NodeList"),res.getInt("dcaseId"));
	}
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

void AddRebuttal(Json request, int id) {
	int dcaseId = request.getString("DCaseId").toint();
	int monitorId = request.getString("MonitorId").toint();
	Json res = global.model.AddRebuttal(dcaseId, monitorId);
	Json response = createMessage(res, id);
	stdout.print(response);
}

void renameDCase(Json request, int id) {
	int dcaseId = request.getInt("dcaseId");
	String name = request.getString("name");
	String res = global.model.RenameDCase(dcaseId, name);
	Json response = createMessage(res.toJson(), id);
	stdout.print(response);
}
void deleteDCase(Json request, int id) {
	int dcaseId = request.getInt("dcaseId");
	String res = global.model.DeleteDCase(dcaseId);
	Json response = createMessage(res.toJson(), id);
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
		this.functions.set("AddRebuttal"  , AddRebuttal);
		this.functions.set("renameDCase"  , renameDCase);
		this.functions.set("deleteDCase"  , deleteDCase);
	}
}
