#!/usr/bin/python
import sys
import cgi
import commands
import os

form = cgi.FieldStorage()
type = form["type"].value
mime = "text/plain"

if type == "png":
	mime = "image/png"
if type == "pdf":
	mime = "application/pdf"
if type == "svg":
	print "Content-type: image/svg+xml\n"
	print form["svg"].value
	exit()

filename = commands.getoutput("/bin/mktemp -q /tmp/svg.XXXXXX")
svgname = filename
resname = filename + "." + type 

file = open(svgname, "w")
file.write(form["svg"].value)
file.close()

commands.getoutput("rsvg-convert " + svgname + " -f " + type + " -o " + resname)

stat = os.stat(resname)
print "Content-Length: " + str(stat.st_size) +"\nContent-type: " + mime + "\n"

res = open(resname, "rb")
sys.stdout.write(res.read())
res.close()

