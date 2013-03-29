#!/usr/local/bin/konoha

Import("Syntax.JavaStyleClass");
Import("Syntax.StringInterpolation");
Import("Syntax.CStyleFor");
Import("Syntax.CStyleWhile");
Import("Syntax.Null");
Import("Type.File");
Import("Type.Float");
Import("Type.Json");
Import("Type.Bytes");
Import("Java.String");
Import("MiniKonoha.Map");
Import("JavaScript.Array");
Import("JavaScript.String");
Import("posix.process");
Import("Lib.Curl");
Import("dscript.subproc");

// you should rewrite to correct URI
String uri_to_api_cgi(){
    return "http://localhost/dview/client/cgi/api.cgi";
}

class HttpClient {
    String url = "";
    @Virtual String perform() { return ""; }
    @Virtual String post(String params) { return ""}
    @Virtual String get(Map[String] fields)  { return ""}
}

class CurlHttpClient extends HttpClient {
    Curl curl;
    CurlHttpClient(String url) {
        this.url = url;
        this.curl = new Curl();
        this.curl.setOpt(CURLOPT_URL, url);
    }
    String perform() {
        return curl.receiveString();
    }
    String CreateParam(Map[String] map) {
        int i = 0;
        String[] keys = map.keys();
        String param = "";
        while (i < keys.getSize()) {
            if (i != 0) {
                param = param + "&";
            }
            String key = keys[i];
            /* FIXME Escaping key and value */
            param = param + "${key}=${map.get(key)}";
            i = i + 1;
        }
        return param;
    }
    String post(String params) {
        curl.setOpt(CURLOPT_POST, true);
        //String param = CreateParam(fields);
        curl.setOpt(CURLOPT_POSTFIELDS, params);
        return perform();
    }

    String get(Map[String] fields) {
        curl.setOpt(CURLOPT_GET, true);
        if (fields.getSize() > 0) {
            String param = CreateParam(fields);
            curl.setOpt(CURLOPT_URL, url+"?"+param);
        }
    }
}

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
        stdout.print("Content-Type: text/plain; charset=utf-8\n\n");
        string = "";
    }
}

int DotExporter.getClusterID(){
    clusterID = clusterID + 1;
    return clusterID;
}

@Virtual void DotExporter.emit(){
    stdout.println(this.string);
}

void DotExporter.addLine(String str){
    this.string = this.string + str + "\n";
}

String DotExporter.getDotNodeName(Json node){
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

String DotExporter.wrap(String str){
    String br = "\\l";
    String wrapped = "";
    String rest = str;
    int maxLength = 20;
    int length = 0;
    int pos = 0;
    while(pos < rest.length){
        int code = rest.charCodeAt(pos);
        if(code < 128){
            length = length + 1;
        }else{
            length = length + 2;
        }
        if(length > maxLength || rest.charAt(pos) == "\n"){
            wrapped = wrapped + rest.substr(0, pos) + br;
            if(rest.charAt(pos) == "\n"){
                pos = pos + 1;
            }
            rest = rest.substr(pos, rest.length - pos);
            pos = -1;
            length = 0;
        }
        pos = pos + 1;
    }
    wrapped = wrapped + rest + br;
    return wrapped;
}

String DotExporter.emitEdge(Json fromNode, Json toNode){
    String fromName = getDotNodeName(fromNode);
    String toName = getDotNodeName(toNode);
    String type = toNode.getString("NodeType");
    String suffix = "";
    if (type == "Context" || type == "Rebuttal") {
        suffix = "[arrowhead=onormal, headport=c, tailport=c];{rank=same;${fromName};${toName}}";
    }
    addLine("${fromName}->${toName}${suffix};");
}

float calcHeight(String desc){
    int lines = desc.split("\\l").length;
    float height = 0.8 + (lines-3)*0.12;
    return height; 
}

String DotExporter.emitDotNodeDefine(Json node){
    String prefix = "UN";
    String shape = "point";
    String args = "";
    String goalColor = "#E0E0E0";
    String contextColor = "#B0B0B0";
    String rebuttalColor = "#EEAAAA";
    String color = "#FFFFFF";
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
        args = ", style=\"filled, rounded\"";
        color = contextColor;
    }
    else if (type == "Strategy") {
        prefix = "S";
        shape = "polygon, skew=0.1";
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
    int thisId = node.getInt("ThisNodeId");
    String desc = wrap(node.getString("Description"));
   addLine("${prefix}${thisId}[shape=${shape}, label=\"${prefix}${thisId}\\l${desc}\", color=\"${color}\", height=${calcHeight(desc)} ${args}];");

}

void DotExporter.GenerateGoalCode(Json NodeList, Json node, int level) {
    Json children = node.get("Children");
    int childrenNum = children.getSize();
    int i = 0;
    if(childrenNum > 0){
        addLine("subgraph cluster${getClusterID()} {");
        addLine("style=invis;");
    }
    emitDotNodeDefine(node);
    for (i=0; i < childrenNum; i = i + 1) {
        Json child = FindById(NodeList, children.getInt(i));
        GenerateGoalCode(NodeList, child, level + 1);
        emitEdge(node, child);
    }
    if(childrenNum > 0){
        addLine("}");
    }
}

@Override void DotExporter.export(Json json) {
    // DO NOT REMOVE THIS COMMENT OR NOT WORKS. 
    Json tree = json.get("result").get("tree");
    int RootId = tree.getInt("TopGoalId");
    Json NodeList= tree.get("NodeList");
    Json RootNode = FindById(NodeList,RootId);
    addLine("digraph AssuranceScript {");
    addLine("node[style=filled, labelloc=t, labeljust=l, fixedsize=false, width=1.7, height=0.8 fontsize=7];");
    addLine("edge[headport=n, tailport=s, color=\"#808080\"];");
    addLine("subgraph cluster${getClusterID()} {");
    addLine("style=dashed;");
    GenerateGoalCode(NodeList, RootNode, 1);
    addLine("}");
    addLine("}");
    emit();
}

String makeTemp(){
    SubProc sp = new SubProc("/bin/mktemp");
    sp.setArgumentList(["-q", "/tmp/dot.XXXXXX"]);
    sp.fg();
    return sp.communicate("")[0].trim();
}

int getFileSize(String filename){
    SubProc sp = new SubProc("wc");
    sp.setArgumentList(["-c", filename]);
    sp.fg();
    return sp.communicate("")[0].trim().split(" ")[0] to int;
}

String graphviz(String dot, String format){
    String filename = makeTemp();
    String outfilename = filename + "." + format;
    FILE tmp = new FILE(filename, "w");
    tmp.print(dot);
    tmp.flush();
    tmp.close();
    SubProc dot = new SubProc("dot");
    dot.setArgumentList(["-T" + format, filename, "-o"+outfilename]);
    dot.fg();
    return outfilename;
}

Bytes getBytesFromFile(String filename){
    FILE file = new FILE(filename, "r");
    Bytes buf = new Bytes(getFileSize(filename));
    file.read(buf);
    file.close();
    return buf;
}

class PngExporter extends DotExporter {
    PngExporter() {
        stdout.print("Content-Type: image/png\n\n");
        string = "";
    }
}

void PngExporter.emit(){
    String pngfilename = graphviz(this.string, "png");
    stdout.write(getBytesFromFile(pngfilename));
    stdout.flush();
}

class PdfExporter extends DotExporter {
    PdfExporter() {
        stdout.print("Content-Type: application/pdf\n\n");
        string = "";
    }
}

void PdfExporter.emit(){
    String pdffilename = graphviz(this.string, "pdf");
    stdout.write(getBytesFromFile(pdffilename));
    stdout.flush();
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

Json fetchDCaseJSON(int id){
    Json json = new Json();
    json.setString("jsonrpc", "2.0");
    json.setString("version", "1.0");
    json.setString("method", "getNodeTree");
    Json param = new Json();
    param.setInt("commitId", id);
    json.set("params", param);
    HttpClient client = new CurlHttpClient(uri_to_api_cgi());
    return Json.parse(client.post(json.toString()));
}

void main () {
    String file = System.getenv("QUERY_STRING");
    if(file == "") {
        file = "1.json";
    }
    String[] a = file.split(".");
    String ext = a[1];
    int id = a[0] to int;
    Json ret = fetchDCaseJSON(id);
    Exporter export = null;

    if (ext == "png") {
        export = new PngExporter();
    } else if (ext == "pdf") {
        export = new PdfExporter();
    } else if (ext == "dot") {
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

