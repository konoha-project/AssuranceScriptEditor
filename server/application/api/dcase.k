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

	PreparedStatement(Connection con, String sql) {
		this.con = con;
		this.queue = [];
		this.con.query("PREPARE stmt1 FROM '${sql}'");
	}

	void setString(String param, String value) {
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
	return str.replace(/\n/, "\\n");
}

class DCaseModel {
	DataBase db;

	@Public DCaseModel(String userName, String password) {
		this.db = new DataBase(userName, password);
	}

	void updatePrev(int prevId) {
		PreparedStatement p = this.db.newPreparedStatement("UPDATE Commit SET latest_flag=FALSE WHERE idCommit=?");
		p.setInt("@a",prevId);
		p.execute();
	}

	@Public int Commit(Json tree, int prev_id) {
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `Commit`(`Data`,`DateTime`,`prev_commit_id`,`latest_flag`) VALUES(?,?,?,TRUE)");
		p.setString("@a",tree.toString());
		p.setInt("@b",new Date().getTime());
		p.setInt("@c",prev_id);
		p.execute();
		this.updatePrev(prev_id);
		return p.getInsertId();
	}

	@Public int CreateTopGoal(Json tree) {
		PreparedStatement p = this.db.newPreparedStatement("INSERT INTO `Commit`(`Data`,`DateTime`,`prev_commit_id`,`latest_flag`) VALUES(?,?,?,TRUE)");
		p.setString("@a",tree.toString());
		p.setInt("@b",new Date().getTime());
		p.setInt("@c",0);
		p.execute();
		return p.getInsertId();
	}

	@Public Json GetNodeTree(int commit_id) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT Data,DateTime,prev_commit_id FROM Commit WHERE idCommit=?");
		p.setInt("@a",commit_id);
		ResultSet r = p.execute();
		r.next();
		//Json json = new Json();
		//json.setString("tree", r.getString("Data"));
		//json.setInt("DateTime", r.getInt("DateTime"));
		//json.setInt("PrevCommitId", r.getInt("prev_commit_id"));
		return Json.parse(EscapeCR(r.getString("Data")));
	}

	@Public int[] getArgumentList() {
		PreparedStatement p = this.db.newPreparedStatement("SELECT idCommit FROM Commit WHERE latest_flag=TRUE");
		ResultSet r = p.execute();
		int[] ret =[];
		while(r.next()) {
			ret.add(r.getInt("idCommit"));
		}
		return ret;
	}

	@Public int[] getCommitList(int commitId) {
		int[] ret = [];
		int id = commitId;
		while(id != 0) {
			PreparedStatement p = this.db.newPreparedStatement("SELECT prev_commit_id FROM Commit WHERE idCommit=?");
			p.setInt("@a",id);
			ResultSet r = p.execute();
			r.next();
			id = r.getInt("prev_commit_id");
			if(id==0) {
				break;
			}
			ret.add(id);
		}
		return ret;
	}

	@Public int[] search(int commitId) {
		PreparedStatement p = this.db.newPreparedStatement("SELECT idCommit FROM Commit WHERE Data LIKE ?");
		p.setString("@a","%"+SearchText+"%");
		ResultSet r = p.execute();
		int[] ret = [];
		while(r.next()) {
			r.add(r.getInt("idCommit"));
		}
		return ret;
	}

}
