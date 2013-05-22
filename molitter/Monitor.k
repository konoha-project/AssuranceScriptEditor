import("Konoha.NameSpace");
import("Konoha.Map");
import("Type.Bytes");
import("Type.Json");
import("Lib.Libevent");
import("JavaStyle.Object");
import("Java.String");
import("JavaScript.String");
import("JavaScript.Array");
import("Syntax.Null");
import("Syntax.CStyleWhile");
import("Syntax.JavaStyleClass");

load("../server/application/api/redmine.k");

//const SERVER_URL  = "127.0.0.1";
const SERVER_PORT = 19999;
const DEBUG_LIBEVENT = true;
const REDMINE_URL = "http://www.ubicg.ynu.ac.jp/redmine";
const REDMINE_KEY = "";

class MonitorSlave {
    String monitorName;
    String ticketName;
    @Virtual boolean check(Json data) { return false; }
}

class CPULimit extends MonitorSlave {
    int limit;
    CPULimit(int limit) {
        this.limit = limit;
    }
    @Override boolean check(Json data) {
        return (data.getInt("CPULimit") > this.limit);
    }
}

class Monitor {
    int port;
    Map[String] templates;
    Map[MonitorSlave] monitorSlaves;
    RedmineAPI ticketClient;
    Monitor(int port) {
        this.port = port;
        this.templates = new Map[String]();
        this.ticketClient = new RedmineAPI(REDMINE_URL, REDMINE_KEY);
        this.monitorSlaves = new Map[MonitorSlave];
    }

    void start() {
        event_base base = new event_base();
        evhttp http = new evhttp(base);
        int ret = http.set_cb("/receive", receive_data_cb, this);
        ret = http.set_cb("/monitor", add_monitor_request_cb, this);
        http.set_gencb(default_cb, this);

        evhttp_bound_socket handle = http.bind_socket_with_handle("0.0.0.0", this.port);
        base.event_dispatch();
    }
}

Json parse(String data) {
    return Json.parse(data);
}

//String String.getPreset() {
//    //input:  "abcdaaaa\n\n   \t @CPULimit  \t"
//    //output: "CPULimit"
//    return this.split("@")[1].split(" ")[0];
//}

String apply(String template, Json map) {
    //FIXME
    //input:  template="hello {value}!", map={ "value" , "world" }
    //output: template="hello world!"
    return template;
}

String add_monitor(Monitor mon, String post) {
    Json json = parse(post);
    Json description = json.get("Monitors");
    Json elem = null;
    Json params = null;
    String preset;
    String monitorid;
    String dcaseid = json.getString("DCaseId");
    int i = 0;
    while(i < description.getSize()) {
        elem = description.get(i);
        preset = elem.getString("Preset");
        monitorid = elem.getString("MonitorId");
        params = elem.get("Params");
        // TODO
        //String template = mon.templates.getString(preset);
        //if (template != null) {
        //    template = apply(template, json);
        //    //FIXME
        //    //mon.MonitorSlave.add(new CPULimit(Context.limit));
        //} else {
        //    //FIXME
        //    //template = json.get(1).toString();
        //}
        if(preset == "CPULimit") {
            mon.monitorSlaves.set(monitorid, new CPULimit(params.getInt("limit")));
        }
        else {
            // add other monitor case
        }
        mon.ticketClient.createChicket(dcaseid.toint(), monitorid.toint(), elem.toString());
        i = i + 1;
    }
    return "";
}

String receive_data(Monitor mon, String post) {
    Json json = parse(post);
    Json res = new Json();
    String monitorid = json.getString("MonitorId");
    MonitorSlave slave = mon.monitorSlaves[monitorid];
    if (slave == null) {
        //FIXME??
        //mon.MonitorSlave.add(new CPULimit(Context.limit));
        //or
        //emit error
    }
    else if (slave.check(json.get("Data")) == true) {
        // TODO
        // something was wrong at monitored system.
        // create new ticket
        // mon.ticketClient.createChicket();
        res.setBoolean("Result", true);
        return res.toString();
    }
    res.setBoolean("Result", false);
    return res.toString();
}

void debug_cb(String method, evhttp_request req, Object arg) {
    if (DEBUG_LIBEVENT) {
        System.p(method + "() executed!!");
        System.p("req = " + req);
        System.p("arg = " + arg);
    }
}

String post(evhttp_request req) {
    String uri = req.get_uri();
    evbuffer input = req.get_input_buffer();
    int length = input.get_length();
    Bytes data = new Bytes(length);
    assert(input.remove(data) == length);
    String post = new String(data);
    return post;
}

void receive_data_cb(evhttp_request req, Object arg) {
    debug_cb("receive_data_cb", req, arg);

    if(req.get_command() & EVHTTP_REQ_POST != 0) {
        String data = post(req);
        String res = receive_data(arg as Monitor, data);
        evbuffer buf = new evbuffer();
        buf.add(res.toBytes());
        req.send_reply(200, "OK", buf);

        return;
    }
    req.send_reply(403, "ERROR", null);
}

void add_monitor_request_cb(evhttp_request req, Object arg) {
    debug_cb("add_monitor_request_cb", req, arg);
    int cmd = req.get_command();
    if(cmd & EVHTTP_REQ_GET != 0) {
        String data = post(req);
        String res = add_monitor(arg as Monitor, data);
        evbuffer buf = new evbuffer();
        buf.add(res.toBytes());
        req.send_reply(200, "OK", buf);
    }
    req.send_reply(403, "ERROR", null);
}

void default_cb(evhttp_request req, Object arg) {
    debug_cb("default_cb", req, arg);
    evbuffer buf = new evbuffer();
    //String data = "";
    //data = data + "<form method=\"post\" action=\"./monitor\">";
    //data = data + " <input type=\"text\" name=\"info\" value=\"value\" />";
    //data = data + " <input type=\"submit\" value=\"Submit\" />";
    //data = data + "</form>";
    //System.p(data);
    //buf.add(data.toBytes());
    //System.p(buf.get_length());
    req.send_reply(200, "OK", buf);
}

new Monitor(SERVER_PORT).start();