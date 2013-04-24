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
    def __init__(self):
        print "Content-Type: text/plain; charset=utf-8\n\n",

    def EmitIndent(self, level):
        return "    " * level

    def GenerateGoalCode(self, nodeList, nodeId, level):
        root = FindById(nodeList, nodeId)
        children = root["Children"]
        indent = self.EmitIndent(level)
        description = root["Description"].replace("\n", "").replace("\r", "");
        if root["NodeType"] == "Evidence":
            print "{0}{1}".format(indent, description)
            return
        elif root["NodeType"] == "Goal":
            print "{0}assure {1} {{".format(indent, description)
        elif root["NodeType"] == "Strategy":
            print "{0}strategy {1} {{".format(indent, description)
        elif root["NodeType"] == "Context":
            return
        for i in children:
            self.GenerateGoalCode(nodeList, i, level + 1)
        print indent + "}"

    def export(self, m):
        tree     = m["result"]["tree"]
        rootId   = int(tree["TopGoalId"])
        nodeList = tree["NodeList"]
        print "digraph AssuranceScript {"
        indent = self.EmitIndent(1)
        rootNode = FindById(nodeList, rootId)
#        print "{0}argue {1} {{".format(indent,rootNode["Description"].replace("\n", "").replace("\r", "")) FIXME
        print rootNode
        #print indent + "argue " + str(rootNode[u"Description"]) + "{"

        for i in rootNode["Children"]:
            self.GenerateGoalCode(nodeList, i, 2);
        print "    }"
        print "}"

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
