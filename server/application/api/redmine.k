Import("Lib.Curl");
Import("JavaScript.Array");
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

Load("config.k");
Load("Http.k");

class IssueAPI {
	String url;
	String key;
	CurlHttpClient http;

	IssueAPI(String url, String key) {
		this.url  = url;
		this.key  = key;
	}

	@Public void createProject(String name, String identifier) { }
	@Public String createTicket(int dcaseId, int nodeId, String description/*,int assignee FIXME*/) {
		return "";
	}
	@Public Json getTicketsByDcaseId(int dcaseId) {
		return new Json([]);
	}
	//@Public int createChildTicket(int dcaseId, int nodeId, int parentTicketId, description, assigned) => chikectId
	//updateTicket(TicketId, UpdateContents) => boolean
	@Public boolean closeTicket(int dcaseId, int nodeId, String description) {
		return false;
	}
}

class RedmineAPI extends IssueAPI {


	@Public void createProject(String name, String identifier) {
		this.http = new CurlHttpClient(url + "projects.json");
		Map[String] m = new Map[String];
		m.set("key",key);
		m.set("project[name]",name);
		m.set("project[identifier]",identifier);
		//m.set("project[description]",description);
		this.http.post(m);
	}

	//ticketId
	@Public String createTicket(int dcaseId, int nodeId, String description/*,int assignee FIXME*/) {
		this.http = new CurlHttpClient(url + "issues.json");
		Map[String] m = new Map[String];
		m.set("key",key);
		m.set("issue[project_id]", "id"+dcaseId);
		m.set("issue[tracker_id]","2");
		m.set("issue[subject]","モニターノードの設定作成:"+nodeId);
		m.set("issue[description]", description);

		return this.http.post(m);
	}

	//@Public int createChildTicket(int dcaseId, int nodeId, int parentTicketId, description, assigned) => chikectId

	//Array[Ticket]
	@Public Json getTicketsByDcaseId(int dcaseId) {
		this.http = new CurlHttpClient(url + "issues.json");
		Map[String] m = new Map[String];
		//m.set("key",key);
		m.set("project_id", "id"+dcaseId);

		return Json.parse(this.http.get(m)).get("issues");
	}
	//getTicketsByNodeId(nodeId) => Array[Ticket]
	//getTicketByTicketId(ticketId) => Ticket


}
