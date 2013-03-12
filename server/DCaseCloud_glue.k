Import("Type.Json");
Import("Syntax.CStyleWhile");
Import("Syntax.Null");
Import("Syntax.GlobalVariable");
Import("Syntax.StringInterpolation");
Import("Java.Class");
Import("MiniKonoha.NameSpace");
Import("MiniKonoha.Map");
Import("MiniKonoha.Sql");
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
		this.con.query("SET ${param} = SHA2('${value}',256)"); //FIXME
		this.queue.add(param);
	}

	void setString(String param, String value) {
		value = this.EscapeSQL(value);
		this.con.query("SET ${param} = '${value}'"); //FIXME
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

	@Public int Commit(Json tree, int prev_id, int user_id, String message) {
		int dcase_id = this.getDCaseId(prev_id);
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `commit`(`data`,`date_time`,`prev_commit_id`,`latest_flag`, `dcase_id`, `user_id`, `message`) VALUES(?,?,?,TRUE,?,?,?)");
		p.setString("@a",tree.toString());
		p.setInt("@b"   , new Date().getTime());
		p.setInt("@c"   , prev_id);
		p.setInt("@d"   , dcase_id);
		p.setInt("@e"   , user_id);
		p.setString("@f", message);
		p.execute();
		this.updatePrev(prev_id);
		return p.getInsertId();
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
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `commit`(`data`,`date_time`,`prev_commit_id`,`latest_flag`, `message`, `dcase_id`, `user_id`) VALUES(?,?,0,TRUE,?,?,?)");
		p.setString("@a",tree.toString());
		p.setInt("@b", new Date().getTime());
		p.setString("@c","Initial Commit");
		p.setInt("@d", dcase_id);
		p.setInt("@e", user_id);
		p.execute();
		int commit_id = p.getInsertId();
		Json ret = new Json();
		ret.setInt("dcaseId",dcase_id);
		ret.setInt("commitId",commit_id);
		return ret;
	}

	@Public Json GetNodeTree(int commit_id) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT data,date_time,prev_commit_id FROM commit WHERE id=?");
		p.setInt("@a",commit_id);
		ResultSet r = p.execute();
		r.next();
		return Json.parse(EscapeCR(r.getString("data"))); //FIXME Escape
	}

	@Public Json getDCaseList() {
		PreparedStatement p = this.db.newPreparedStatement("SELECT id,name FROM dcase");
		ResultSet r = p.execute();
		Json ret = new Json([]);
		while(r.next()) {
			Json json = new Json();
			json.setInt("dcaseId", r.getInt("id"));
			json.setString("dcaseName", r.getString("name"));
			ret.add(json);
		}
		return ret;
	}

	Json getCommitJson(ResultSet r) {
		Json json = new Json();
		json.setInt("commitId",r.getInt("id"));
		json.setInt("time",r.getInt("date_time"));
		json.setString("commitMessage",r.getString("message"));
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

	//FIXME
	@Public Json search(String text) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT dcase_id FROM commit WHERE latest_flag=TRUE AND data LIKE ?");
		p.setString("@a","%"+text+"%");
		ResultSet r = p.execute();
		Json ret = new Json([]);
		while(r.next()) {
			Json json = new Json();
			json.setInt("dcaseId",r.getInt("dcase_id"));
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
}
