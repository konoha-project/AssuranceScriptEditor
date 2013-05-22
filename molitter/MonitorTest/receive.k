import("Lib.Curl");
import("Type.Json");
import("JavaScript.Array");
import("JavaScript.String");

void post() {
	Json req = new Json(); // request : {"MonitorId":1, "DCaseId":1, "Data":{"CPULimit":10}}
	Json data = new Json();
	data.setInt("CPULimit", 10);
	req.setString("MonitorId", "1");
	req.setString("DCaseId", "1");
	req.set("Data", data);
	Curl c = new Curl();
	String url = "http://0.0.0.0:19999/receive";
	c.setOpt(CURLOPT_URL, url);
	c.setOpt(CURLOPT_POSTFIELDS, req.toString());
	c.perform();
}

post();
