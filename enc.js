function encode(lineCallback, doneCallback)
{
	var encoder = {
	start: function (width, height, quality) {
		encodeWorker.postMessage({cmd:"start", width:width, height:height, quality:quality});
	},
	writeScanline: function (scanlineData) {
		encodeWorker.postMessage({cmd:"data", buf:scanlineData}, [scanlineData]);
	},
	finish: function () {
		encodeWorker.postMessage({cmd:"finish"});
	}
	}

	var arrayList = [];
	var encodeWorker = new Worker("cjpeg-worker.js");
	encodeWorker.onmessage = function (e) {
	   if (e.data.cmd == "data") {
	   	arrayList.push(e.data.buf);
	   } else if (e.data.cmd == "dataReady") {
	   	lineCallback(encoder, e.data.buf);
	   } else if (e.data.cmd == "finish") {
	        doneCallback(new Blob(arrayList, {type:"image/jpeg"}));
	   }
	}
	return encoder;
}
