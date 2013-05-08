#!/usr/bin/env python2.7
# -*- coding: utf-8 -*-
import json
import os
import cgi
import aseconfig
import urllib, httplib

class Exporter(object):
    def __init__(self):
        pass

    def export(self, m):
        return

class JsonExporter(Exporter):
    def __init__(self):
        print "Content-Type: application/json; charset=utf-8\n\n",

    def export(self, m):
        print json.dumps(m["result"]),

def FindById(nodeList, id):
    i = 0
    for node in nodeList:
        thisId = node["ThisNodeId"]
        if node["ThisNodeId"] == id:
            return node
    return None

class XMLExporter(Exporter): #TODO
    def __init__(self):
        print "Content-Type: application/xml; charset=utf-8\n\n",

class DScriptExporter(Exporter):
    string = ""
    solutionIndex = 0
    goalContent = ""

    def __init__(self):
        print "Content-Type: text/plain; charset=utf-8\n\n",

    def EmitIndent(self, level):
        return "    " * level

    def GenerateGoalCode(self, nodeList, nodeId, level):
        root = FindById(nodeList, nodeId)
        children = root["Children"]
        indent = self.EmitIndent(level)
        #description = root["Description"].replace("\n", "").replace("\r", "");
        if root["NodeType"] == "Solution":
            print "boolean Solution_{0}() {{".format(self.solutionIndex)
            print "    //" + self.goalContent
            print "    try {"
            for s in root["Description"].split("\n"):
                print "        " + s.encode('utf-8')
            print "    catch(Exception e) {"
            print "        Syslog.write(e.printStackTrace);"
            print "        return false;"
            print "    }"
            print "    return true;"
            print "}\n"
            self.solutionIndex += 1
            self.goalContent = ""
            return
#        if root["NodeType"] == "Evidence" or root["NodeType"] == "Solution":
#            print "{0}{1}".format(indent, description)
#            return
        elif root["NodeType"] == "Goal":
            self.goalContent = root["Description"].encode('utf-8')
#        elif root["NodeType"] == "Strategy":
#            print "{0}strategy {1} {{".format(indent, description)
#        elif root["NodeType"] == "Context":
#            return
        for i in children:
            self.GenerateGoalCode(nodeList, i, 0)
        #print indent + "}"

    def export(self, m):
        tree     = m["result"]["tree"]
        rootId   = int(tree["TopGoalId"])
        nodeList = tree["NodeList"]
        #print "digraph AssuranceScript {"
        indent = self.EmitIndent(0)
        rootNode = FindById(nodeList, rootId)
        #print "{0}argue {1} {{".format(indent,rootNode["Description"].replace("\n", "").replace("\r", "")) #FIXME
        print "//D-Script Generator v0.1"
        print "//{0}".format(rootNode["Description"].replace("\n", "").replace("\r", "").encode('utf-8')) #FIXME
        print ''
        #print indent + "argue " + str(rootNode[u"Description"]) + "{"

        for i in rootNode["Children"]:
            self.GenerateGoalCode(nodeList, i, 0);
        run = ""
        for i in range(self.solutionIndex):
            run += "Solution_{0}() && ".format(i)
        run = run[:-4] + ";"
        print run

def fetchDCaseJSON(id):
    m = { "jsonrpc" : "2.0",
          "version" : "1.0",
          "method"  : "getNodeTree",
          "params"  : { "commitId" : id }}
    headers = {"Content-type": "application/x-www-form-urlencoded", "Accept": "text/plain"}
    conn = httplib.HTTPConnection(aseconfig.domain)
    conn.request("POST",aseconfig.location + "/cgi/api.cgi", json.dumps(m), headers)
    response = conn.getresponse()
    b = response.read()
    return json.loads(b);

def main():
    #query = ["2218","dscript"]
    query = {}
    if 'QUERY_STRING' in os.environ:
        query = os.environ['QUERY_STRING'].split('.')
    #print "Content-Type: text/plain; charset=utf-8\n\n",
    ret = fetchDCaseJSON(int(query[0]))
    export = None
    if query[1] == "json":
        export = JsonExporter()
    elif query[1] == "dscript":
        export = DScriptExporter()
    elif query[1] == "xml":
        export = XMLExporter()
    if export == None:
        export = JsonExporter()
    export.export(ret)

main()
