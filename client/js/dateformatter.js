var DateFormatter = function(time){
	var unixTime = time;

	function fixString(i) {
		return (i<10)?"0"+i:""+i;
	}

	this.format = function(){
		var t = new Date(unixTime);
		var fMonth   = fixString(t.getMonth()+1);
		var fDate    = fixString(t.getDate());
		var fHours   = fixString(t.getHours());
		var fMinutes = fixString(t.getMinutes());
		var fSeconds = fixString(t.getSeconds());
		return t.getFullYear() + "/" + fMonth + "/" + fDate + " " + fHours + ":" + fMinutes + ":" + fSeconds;
	}
};
