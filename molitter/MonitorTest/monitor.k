import("Lib.Curl");
import("Type.Json");
import("JavaScript.Array");
import("JavaScript.String");

void post() {
	Json req = new Json(); // request : {"Monitors":[{"MonitorId":"1", "Preset":"CPULimit", "Params":{"limit":5}}], "DCaseId":"1"}
	Json description = Json.parse("[]");
	Json elem = new Json();
	Json params = new Json();
	params.setInt("limit", 5);
	elem.setString("MonitorId", "1");
	elem.setString("Preset", "CPULimit");
	elem.set("Params", params);
	description.add(elem);
	req.set("Monitors", description);
	req.setString("DCaseId", "1");
	Curl c = new Curl();
	String url = "http://0.0.0.0:19999/monitor";
	c.setOpt(CURLOPT_URL, url);
	c.setOpt(CURLOPT_POSTFIELDS, req.toString());
	c.perform();
}

post();
