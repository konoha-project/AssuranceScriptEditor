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

//const SERVER_URL  = "127.0.0.1";
const SERVER_PORT = 19999;
const DEBUG_LIBEVENT = true;

class MonitorSlave {
    String monitorName;
    String ticketName;
    @Virtual boolean check(Json data) { return false; }
}

class CPULimit {
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
    Monitor(int port) {
        this.port = port;
        this.templates = new Map[String]();
        this.ticketClient = new RedmineClient();
        this.monitorSlaves = new Map[MonitorSlave];
    }

    void start() {
        event_base base = new event_base();
        evhttp http = new evhttp(base);
        int ret = http.set_cb("/receive", recive_data_cb, this);
        ret = http.set_cb("/monitor", add_monitor_request_cb, this);
        http.set_gencb(default_cb, this);

        evhttp_bound_socket handle = http.bind_socket_with_handle("0.0.0.0", this.port);
        base.event_dispatch();
    }
}

Json parse(String data) {
    return Json.parse(data);
}

String String.getPreset() {
    //FIXME
    //input:  "abcdaaaa\n\n   \t @CPULimit  \t"
    //output: "CPULimit"
    return "";
}

String apply(String template, Json map) {
    //FIXME
    //input:  template="hello {value}!", map={ "value" , "world" }
    //output: template="hello world!"
    return template;
}

String add_monitor(Monitor mon, String post) {
    Json map = parse(post);
    String description = map.getString("Monitor");
    String preset = description.getPreset();
    String template = mon.templates.getString(preset);
    if (template != null) {
        template = apply(template, map);
        //FIXME
        //mon.MonitorSlave.add(new CPULimit(Context.limit));
    } else {
        template = map.toString();
    }

    mon.ticketClient.open(template);
    return "";
}

String recive_data(Monitor mon, String post) {
    Json map = parse(post);
    String hashCode = map.getString("Monitor");
    MonitorSlave slave = mon.monitorSlaves[hashCode];
    if (slave == null) {
        //FIXME??
        //mon.MonitorSlave.add(new CPULimit(Context.limit));
        //or
        //emit error
    }
    if (slave.check(map) == true) {
        // something was wrong at monitored system.
        // create new ticket
        mon.ticketClient.open(slave.monitorName);
    }
    return "";
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

void recive_data_cb(evhttp_request req, Object arg) {
    debug_cb("recive_data_cb", req, arg);

    if(req.get_command() & EVHTTP_REQ_POST != 0) {
        String data = post(req);
        String res = recive_data(arg as Monitor, post);
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
