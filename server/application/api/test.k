Load("newMethod.k");


void main() {
//	getArgumentList(new Json());
	Json json = new Json();
	json.set("tree", new Json());
	json.setInt("commitId", 0);
	Commit(json);
}

main();
