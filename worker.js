

function _jswrite(fd, ptr, len) {
	var pixels = Module.HEAPU8.subarray(ptr, ptr+len);
	postMessage({cmd:"data", buf:pixels});
	return len;
}


var ctx;
var heapBuf;
var rowPtr;
var HEAPU8 = Module.HEAPU8;
var HEAP32 = Module.HEAP32;
var width;
onmessage = function (e) {
	if (e.data.cmd == "start") {
		ctx = _joutjs_init(e.data.width, e.data.height, e.data.quality);
		width = e.data.width;
		var k = new ArrayBuffer(width*3);
		heapBuf = _malloc(width*3);
		rowPtr = _malloc(4);
		postMessage({cmd:"dataReady", buf:k},[k]);
	} else if (e.data.cmd == "data") {
		dataOutput(e.data.buf);
		// XXX: to not require a swap so that we can pipeline a bit more
		postMessage({cmd:"dataReady", buf:e.data.buf},[e.data.buf]);
	} else if (e.data.cmd == "finish") {
		_jpeg_finish_compress(ctx);
		postMessage({cmd:"finish"});
	}
}
var line = 0;
function dataOutput(data) {
	var view = new Uint8Array(data);
	for (var i=0; i<width*3; i++) {
		HEAPU8[heapBuf + i] = view[i];
	}
	HEAP32[rowPtr>>2] = heapBuf;
	_jpeg_write_scanlines(ctx, rowPtr, 1);
}

