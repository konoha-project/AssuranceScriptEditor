Import("Type.Json");
Import("Syntax.CStyleWhile");
Import("Syntax.CStyleFor");
Import("Syntax.Null");
Import("Syntax.GlobalVariable");
Import("Syntax.StringInterpolation");
Import("Java.Class");
Import("Konoha.NameSpace");
Import("Konoha.Map");
Import("Konoha.Sql");
Import("JavaStyle.Object");
Import("JavaScript.Array");
Import("JavaScript.String");
Import("JavaScript.Regexp");
Import("JavaScript.Date");

class PreparedStatement {
	Connection con;
	String[] queue;
	int id;

	//TODO Array.join()
	String join() {
		if(this.queue.getSize() == 0) {
			return "";
		}
		int i = 0;
		String ret = " USING ";
		while(i < this.queue.getSize()-1) {
			ret = ret + this.queue[i] + ",";
			i = i + 1;
		}
		ret = ret + this.queue[this.queue.getSize()-1];
		return ret;
	}

	String EscapeSQL(String str) {
		return str.replace(/'/g, "\\\'");
	}

	PreparedStatement(Connection con, String sql) {
		this.con = con;
		this.queue = [];
		this.con.query("PREPARE stmt1 FROM '${sql}'");
	}

	void setSHA2(String param, String value) {
		value = this.EscapeSQL(value);
		this.con.query("SET ${param} = SHA2('${value}',256)");
		this.queue.add(param);
	}

	void setString(String param, String value) {
		value = this.EscapeSQL(value);
		this.con.query("SET ${param} = '${value}'");
		this.queue.add(param);
	}

	void setInt(String param, int value) {
		this.con.query("SET ${param} = ${value}");
		this.queue.add(param);
	}

	void setBoolean(String param, boolean value) {
		if(value) {
			this.con.query("SET ${param} = TRUE");
		}else {
			this.con.query("SET ${param} = FALSE");
		}
		this.queue.add(param);
	}

	ResultSet execute() {
		ResultSet r = this.con.query("EXECUTE stmt1 "+this.join());
		this.id = this.con.getInsertId();
		this.con.query("DEALLOCATE PREPARE stmt1");
		return r;
	}

	int getInsertId(){
		return this.id;
	}
}

class DataBase {
	Connection con;

	DataBase(String userName, String password) {
		this.con = new Connection("mysql://${userName}:${password}@localhost:3306");
		this.con.query("USE dcase;");
	}

	PreparedStatement newPreparedStatement(String q) {
		return new PreparedStatement(this.con, q);
	}

}

@Public String EscapeBS(String str) {
	RegExp p = new RegExp("\\","g");
	return str.replace(p, "\\\\");
}

@Public String EscapeDq(String str) {
	return str.replace(/\"/g,"\\\\\\\"");
}

@Public String EscapeCR(String str) {
	return str.replace(/\n/g, "\\n");
}

class DCaseModel {
	DataBase db;

	@Public DCaseModel(String userName, String password) {
		this.db = new DataBase(userName, password);
	}

	void updatePrev(int prevId) {
		PreparedStatement p = this.db.newPreparedStatement("UPDATE commit SET latest_flag=FALSE WHERE id=?");
		p.setInt("@a",prevId);
		p.execute();
	}

	void insertNode(Json node, int id) {
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `node`(`this_node_id`,`description`,`node_type`,`commit_id`) VALUES(?,?,?,?)");
		p.setInt("@a",node.getInt("ThisNodeId"));
		p.setString("@b",node.getString("Description"));
		p.setString("@c",node.getString("NodeType"));
		p.setInt("@d",id);
		p.execute();
	}

	@Public void insertNodeList(Json tree, int id) {
		Json nodeList = tree.get("NodeList");
		int i = 0;
		while(i < nodeList.getSize()) {
			this.insertNode(nodeList[i],id);
			i = i + 1;
		}
	}

	@Public Json Commit(Json tree, int prev_id, int user_id, String message, int dcase_id) {
		if(dcase_id == 0) {
			dcase_id = this.getDCaseId(prev_id);
		}
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `commit`(`data`,`date_time`,`prev_commit_id`,`latest_flag`, `dcase_id`, `user_id`, `message`) VALUES(?,?,?,TRUE,?,?,?)");
		p.setString("@a",EscapeBS(tree.toString()));
		p.setInt("@b"   , new Date().getTime());
		p.setInt("@c"   , prev_id);
		p.setInt("@d"   , dcase_id);
		p.setInt("@e"   , user_id);
		p.setString("@f", message);
		p.execute();
		if(prev_id!=0) {
			this.updatePrev(prev_id);
		}
		int id = p.getInsertId();
		insertNodeList(tree,id);
		Json ret = new Json();
		ret.setInt("commitId", id);
		ret.setInt("dcaseId", dcase_id);
		return ret;
	}

	int _createDcase(int user_id,String dcaseName) {
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `dcase`(`user_id`,`name`) VALUES(?,?)");
		p.setInt("@a",user_id);
		p.setString("@b",dcaseName);
		p.execute();
		return p.getInsertId();
	}

	int getDCaseId(int commit_id) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT dcase_id FROM commit WHERE id=?");
		p.setInt("@a",commit_id);
		ResultSet r = p.execute();
		r.next();
		return r.getInt("dcase_id");
	}

	@Public Json createDCase(Json tree, String dcaseName, int user_id) {
		int dcase_id = this._createDcase(user_id, dcaseName);
		int commit_id = this.Commit(tree,0,user_id,"Initial Commit",dcase_id).getInt("commitId");
		Json ret = new Json();
		ret.setInt("dcaseId",dcase_id);
		ret.setInt("commitId",commit_id);
		return ret;
	}

	@Public Json getDCase(int dcaseId) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT name,commit.id as commitId,data FROM dcase INNER JOIN commit ON dcase.id=commit.dcase_id WHERE dcase.id=? AND latest_flag=TRUE AND delete_flag=FALSE");
		p.setInt("@a",dcaseId);
		ResultSet r = p.execute();
		r.next();
		Json json = new Json();
		json.setInt("commitId",r.getInt("commitId"));
		json.set("tree", Json.parse(EscapeCR(r.getString("data"))));
		json.setString("dcaseName",r.getString("name"));
		return json;
	}

	@Public Json GetNodeTree(int commit_id) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT data,date_time,prev_commit_id FROM commit WHERE id=?");
		p.setInt("@a",commit_id);
		ResultSet r = p.execute();
		r.next();
		return Json.parse(EscapeCR(r.getString("data"))); //FIXME Escape
	}

	@Public Json getDCaseList() {
		PreparedStatement p = this.db.newPreparedStatement("SELECT dcase.id,name,user_name FROM dcase INNER JOIN user ON dcase.user_id=user.id INNER JOIN commit ON dcase.id=commit.dcase_id WHERE delete_flag=FALSE AND latest_flag=TRUE ORDER BY commit.date_time DESC");
		ResultSet r = p.execute();
		Json ret = new Json([]);
		while(r.next()) {
			Json json = new Json();
			json.setInt("dcaseId", r.getInt("id"));
			json.setString("dcaseName", r.getString("name"));
			json.setString("userName", r.getString("user_name"));
			json.set("latestCommit",this.getLatestCommit(r.getInt("id")));
			ret.add(json);
		}
		return ret;
	}

	Json getCommitJson(ResultSet r) {
		Json json = new Json();
		json.setInt("commitId",r.getInt("id"));
		json.setInt("time",r.getInt("date_time"));
		json.setString("commitMessage",EscapeDq(r.getString("message")));
		json.setInt("userId",r.getInt("user_id")); //FIXME
		json.setString("userName",r.getString("user_name"));
		return json;
	}

	Json getLatestCommit(int dcase_id) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT commit.id,date_time,message,user_id,user_name FROM commit INNER JOIN user ON commit.user_id=user.id WHERE dcase_id=? AND latest_flag=TRUE");
		p.setInt("@a",dcase_id);
		ResultSet r = p.execute();
		r.next();
		return this.getCommitJson(r);
	}

	@Public Json getCommitList(int dcaseId) {
		Json commit = this.getLatestCommit(dcaseId);
		Json ret = new Json([]);
		int id = commit.getInt("commitId");
		while(id != 0) {
			PreparedStatement p = this.db.newPreparedStatement("SELECT commit.id,date_time,message,user_id,user_name,prev_commit_id FROM commit INNER JOIN user ON commit.user_id=user.id WHERE commit.id=?");
			p.setInt("@a",id);
			ResultSet r = p.execute();
			r.next();
			id = r.getInt("prev_commit_id");
			ret.add(this.getCommitJson(r));
			if(id==0) {
				break;
			}
		}
		Json reverse = new Json([]);
		int i = ret.getSize()-1;
		while(i>=0) {
			reverse.add(ret[i]);
			i = i - 1;
		}
		return reverse;
	}

	@Public Json search(String text) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT dcase_id,this_node_id,description,dcase.name FROM node INNER JOIN commit ON node.commit_id=commit.id INNER JOIN dcase ON commit.dcase_id=dcase.id WHERE latest_flag=TRUE AND description LIKE ?");
		p.setString("@a","%"+text+"%");
		ResultSet r = p.execute();
		Json ret = new Json([]);
		while(r.next()) {
			Json json = new Json();
			json.setInt("dcaseId",r.getInt("dcase_id"));
			json.setInt("nodeId",r.getInt("this_node_id"));
			json.setString("dcaseName",EscapeCR(r.getString("name")));
			json.setString("description",EscapeCR(r.getString("description")));
			ret.add(json);
		}
		return ret;
	}

	String salt(String pass) {
		return pass + "G0y7cf3$:ydLVkx4I/50"; //FIXME
	}

	@Public int register(String user, String pass) {
		String ps_h = this.salt(pass);
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `user`(`user_name`,`password_hash`,`created_at`) VALUES(?,?,NOW())");
		p.setString("@a",user);
		p.setSHA2("@b",ps_h);
		p.execute();
		return p.getInsertId();
	}

	@Public int login(String user, String pass) {
		String ps_h = this.salt(pass);
		PreparedStatement p = this.db.newPreparedStatement("SELECT id FROM user WHERE user_name=? AND password_hash=?");
		p.setString("@a",user);
		p.setSHA2("@b",ps_h);
		ResultSet r = p.execute();
		r.next();
		return r.getInt("id");
	}

	Json _addRebuttal(Json nodeList, int monitorId, int rebuttalId) {
		Json ret = new Json([]);
		int i = 0;
		while(i < nodeList.getSize()) {
			if(nodeList[i].getInt("ThisNodeId") == monitorId) {
				nodeList[i].get("Children").add(rebuttalId);
				Json reb = new Json();
				reb.setInt("ThisNodeId",rebuttalId);
				reb.setString("Description","Rebuttal");
				reb.set("Children",new Json([]));
				reb.setString("NodeType","Rebuttal");
				ret.add(reb);
			}
			ret.add(nodeList[i]);
			i = i + 1;
		}
		return ret;
	}

	@Public Json AddRebuttal(int dcaseId, int monitorId) {
		Json json = this.getDCase(dcaseId);
		Json tree = json.get("tree");
		int prev_id = json.getInt("commitId");
		int user_id = 4; //FIXME
		String message = "Add Rebuttal";

		tree.set("NodeList", this._addRebuttal(tree.get("NodeList"), monitorId, tree.getInt("NodeCount") + 1/*FIXME*/));
		return this.Commit(tree, prev_id, user_id, message, dcaseId);
	}

	@Public String RenameDCase(int dcaseId, String name) {
		PreparedStatement p = this.db.newPreparedStatement("UPDATE dcase SET name=? WHERE id=?");
		p.setString("@a",name);
		p.setInt("@b",dcaseId);
		p.execute();
		return "OK";
	}

	@Public String DeleteDCase(int dcaseId) {
		PreparedStatement p = this.db.newPreparedStatement("UPDATE dcase SET delete_flag=TRUE WHERE id=?");
		p.setInt("@a",dcaseId);
		p.execute();
		return "OK";
	}
}
