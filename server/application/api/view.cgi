#!/usr/local/bin/konoha

Import("Syntax.JavaStyleClass");
Import("Syntax.StringInterpolation");
Import("Syntax.CStyleFor");
Import("Syntax.Null");
Import("Type.File");
Import("Type.Json");
Import("Java.String");
Import("JavaScript.Array");
Import("posix.process");
Load("Http.k");

class Exporter {
    Exporter() {}
    @Virtual void export(Json json) { return; }
}

class JsonExporter extends Exporter {
    JsonExporter() {
        stdout.print("Content-Type: application/json; charset=utf-8\n\n");
    }
    @Override void export(Json json) {
        String ret = json.get("result").toString();
        stdout.print(ret);
    }
}

Json FindById(Json NodeList, int Id) {
    int i, len = NodeList.getSize();
    for (i=0; i < len; i = i + 1) {
        Json node = NodeList.get(i);
        int thisId = node.getInt("ThisNodeId");
        if (thisId == Id) {
            return node;
        }
    }
    return null;
}

class DotExporter extends Exporter {
    String string;
    int clusterID = 0;
    DotExporter() {
        stdout.print("Content-Type: application/json; charset=utf-8\n\n");
        string = "";
    }
    int getClusterID(){
        clusterID = clusterID + 1;
        return clusterID;
    }
    @Virtual void emit() {
        stdout.println(this.string);
    }
    void println(String string) {
        this.string = this.string + string + "\n";
    }

    String getDotNodeName(Json node){
        String type = node.getString("NodeType");
        String prefix = "";
        if (type == "Goal") {
            prefix = "G";
        }
        else if (type == "Context") {
            prefix = "C";
        }
        else if (type == "Strategy") {
            prefix = "S";
        }
        else if (type == "Evidence") {
            prefix = "E";
        }
        else if (type == "Rebuttal") {
            prefix = "R";
        }
        else if (type == "Solution") {
            prefix = "S";
        }
        int thisId = node.getInt("ThisNodeId");
        return prefix + thisId;
    }

    String emitEdge(Json from, Json to){
        String fromName = getDotNodeName(from);
        String toName = getDotNodeName(no);
        String type = to.getString("NodeType");
        String suffix = "";
        if (type == "Context" || type == "Rebuttal") {
            suffix = "[arrowhead=onormal, headport=w, tailport=e];{rank=same;${fromName};${toName}}";
        }
        println("${fromName}->${toName}${suffix}");
    }

    String emitDotNodeDefine(Json node){
        String prefix = "";
        String shape = "";
        String args = "";
        String goalColor = "#C0C0C0";
        String contextColor = "#B0B0B0";
        String rebuttalColor = "#EEAAAA";
        String color;
        String type = node.getString("NodeType");
        boolean hasChildren = (node.get("Children").getSize() > 0);
 
        if (type == "Goal") {
            prefix = "G";
            if(hasChildren){
                shape = "rect";
            }else{
                shape = "rect"; // TODO: Use custom shape for undeveloped goal.
            }
            color = goalColor;
        }
        else if (type == "Context") {
            prefix = "C";
            shape = "rect";
            args = "style=\"filled, rounded\""";
            color = contextColor;
        }
        else if (type == "Strategy") {
            prefix = "S";
            shape = "parallelogram";
            color = contextColor;
        }
        else if (type == "Evidence") {
            prefix = "E";
            shape = "ellipse";
            color = goalColor;
        }
        else if (type == "Rebuttal") {
            prefix = "R";
            shape = "ellipse";
            color = rebuttalColor;
        }
        else if (type == "Solution") {
            prefix = "S";
            shape = "ellipse";
            color = goalColor;
        }
        int thisId = node.getInt("ThisNodeId")
        String desc = node.getString("Description");
        println("${prefix}${thisId}[shape=${shape}, label=\"${prefix}${thisId}\\n\${desc}\", color=\"${color}\", ${args}]");

    }

    void GenerateGoalCode(Json NodeList, Json node, int level) {
        Json children = node.get("Children");
        int childrenNum = children.getSize();
        int i = 0;
        if(childrenNum > 1){
            println("subgraph cluster${getClusterID()} {");
            println("style=invis");
        }
        emitDotNodeDefine(node);
        for (i=0; i < childrenNum; i = i + 1) {
            Json child = FindById(NodeList, children.getInt(i));
            GenerateGoalCode(NodeList, child, level + 1);
            emitEdge(node, child);
        }
        if(childrenNum > 1){
            println("}");
        }

    }

    @Override void export(Json json) {
        Json tree = json.get("result").get("Tree");
        int RootId = tree.getInt("TopGoalId");
        Json NodeList= tree.get("NodeList");
        println("digraph AssuranceScript {");
        int i, j, len = NodeList.getSize();

        String indent = EmitIndent(0);
        Json RootNode = FindById(NodeList,RootId);
        println("digraph AssuranceScript {");
        println("node[style=filled, labelloc=t, labeljust=l, fixedsize=true, width=1.7, height=0.8];");
        println("edge[headport=n, tailport=s, color=\"#C0C0C0\"];");
        GenerateGoalCode(NodeList, RootNode, 1);
        println("}");
    }
}

class DScriptExporter extends Exporter {
    String string;
    DScriptExporter() {
        stdout.print("Content-Type: text/plain; charset=utf-8\n\n");
        string = "";
    }
    @Virtual void emit() {
        stdout.println(this.string);
    }
    void println(String string) {
        this.string = this.string + string + "\n";
    }

    String EmitIndent(int level) {
        int i = 0;
        String indent = "";
        for (i=0; i < level; i = i + 1) {
            indent = indent + "    ";
        }
        return indent;
    }

    boolean IsGoal(Json node) {
        return  node.getString("NodeType") == "Goal";
    }

    boolean IsStrategy(Json node) {
        return node.getString("NodeType") == "Strategy";
    }

    boolean IsContext(Json node) {
        return node.getString("NodeType") == "Context";
    }

    boolean IsEvidence(Json node) {
        return node.getString("NodeType") == "Evidence";
    }

    void GenerateGoalCode(Json NodeList, int node_id, int level) {
        Json root = FindById(NodeList, node_id);
        Json children = root.get("Children");
        int childrenNum = children.getSize();
        String indent = "";

        if(IsEvidence(root)) {
            String evidence = root.getString("Description").replace("\n", "").replace("\r", "");
            indent = EmitIndent(level);
            stdout.print(indent + evidence + "\n");
            return;
        }
        else if(IsGoal(root)) {
            indent = EmitIndent(level);
            stdout.print(indent + "assure " + root.getString("Description").replace("\n", "").replace("\r", "") + " {\n");
        }
        else if(IsStrategy(root)) {
            indent = EmitIndent(level);
            stdout.print(indent + "strategy " + root.getString("Description").replace("\n", "").replace("\r", "") + " {\n");
        }
        else if(IsContext(root)) {
            return;
        }
        int i = 0;
        for (i=0; i < childrenNum; i = i + 1) {
            int childId = children.getInt(i);
            GenerateGoalCode(NodeList, childId, level + 1);
        }
        stdout.print(indent + "}\n");
    }

    @Override void export(Json json) {
        Json tree = json.get("result").get("Tree");
        int RootId = tree.getInt("TopGoalId");
        Json NodeList= tree.get("NodeList");
        println("digraph AssuranceScript {");
        int i, j, len = NodeList.getSize();

        String indent = EmitIndent(0);
        Json RootNode = FindById(NodeList,RootId);
        stdout.print("argue " + RootNode.getString("Description").replace("\n", "").replace("\r", "") + " {\n");
        Json child = RootNode.get("Children");
        len = child.getSize();
        for (i=0; i < len; i = i + 1) {
            int childId = child.getInt(i);
            GenerateGoalCode(NodeList, childId, 1);
        }
        stdout.print("}\n");
    }
}

void main () {
    String file = System.getenv("QUERY_STRING");
    if(file == "") {
        file = "32.json";
    }
    String[] a = file.split(".");
    String ext = a.pop();
    int id = a[0] to int;
    Json json = new Json();
    json.setString("jsonrpc", "2.0");
    json.setString("version", "1.0");
    json.setString("method", "getNodeTree");
    Json param = new Json();
    param.setInt("BelongedArgumentId", id);
    json.set("params", param);

    HttpClient client = new CurlHttpClient("http://localhost/dview/server/application/api/api.cgi");
    Json ret = Json.parse(client.post(json.toString()));
    Exporter export = null;
    if (ext == "dot") {
        export = new DotExporter();
    } else if (ext == "json") {
        export = new JsonExporter();
    } else if (ext == "dscript") {
        export = new DScriptExporter();
    }
    if (export == null) {
        export = new JsonExporter();
    }
    export.export(ret);
}

main();
