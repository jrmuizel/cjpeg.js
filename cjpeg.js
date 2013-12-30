// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };
  Module['load'] = function load(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module['exports'] = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }
  Module['readBinary'] = function readBinary(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
  eval("if (typeof gc === 'function' && gc.toString().indexOf('[native code]') > 0) var gc = undefined"); // wipe out the SpiderMonkey shell 'gc' function, which can confuse closure (uses it as a minified name, and it is then initted to a non-falsey value unexpectedly)
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (typeof console !== 'undefined') {
    Module['print'] = function print(x) {
      console.log(x);
    };
    Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  if (ENVIRONMENT_IS_WEB) {
    this['Module'] = Module;
  } else {
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      return '(((' +target + ')+' + (quantum-1) + ')&' + -quantum + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (vararg) return 8;
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          if (Types.types[field]) {
            alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
          } else {
            alignSize = type.alignSize || QUANTUM_SIZE;
          }
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else if (field[0] === '<') {
        // vector type
        size = alignSize = Types.types[field].flatSize; // fully aligned
      } else if (field[0] === 'i') {
        // illegal integer field, that could not be legalized because it is an internal structure field
        // it is ok to have such fields, if we just use them as markers of field size and nothing more complex
        size = alignSize = parseInt(field.substr(1))/8;
        assert(size % 1 === 0, 'cannot handle non-byte-size field ' + field);
      } else {
        assert(false, 'invalid type for calculateStructAlignment');
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    if (type.name_[0] === '[') {
      // arrays have 2 elements, so we get the proper difference. then we scale here. that way we avoid
      // allocating a potentially huge array for [999999 x i8] etc.
      type.flatSize = parseInt(type.name_.substr(1))*type.flatSize/2;
    }
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  getAsmConst: function (code, numArgs) {
    // code is a constant string on the heap, so we can cache these
    if (!Runtime.asmConstCache) Runtime.asmConstCache = {};
    var func = Runtime.asmConstCache[code];
    if (func) return func;
    var args = [];
    for (var i = 0; i < numArgs; i++) {
      args.push(String.fromCharCode(36) + i); // $0, $1 etc
    }
    return Runtime.asmConstCache[code] = eval('(function(' + args.join(',') + '){ ' + Pointer_stringify(code) + ' })'); // new Function does not allow upvars in node
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xFF;
      if (buffer.length == 0) {
        if ((code & 0x80) == 0x00) {        // 0xxxxxxx
          return String.fromCharCode(code);
        }
        buffer.push(code);
        if ((code & 0xE0) == 0xC0) {        // 110xxxxx
          needed = 1;
        } else if ((code & 0xF0) == 0xE0) { // 1110xxxx
          needed = 2;
        } else {                            // 11110xxx
          needed = 3;
        }
        return '';
      }
      if (needed) {
        buffer.push(code);
        needed--;
        if (needed > 0) return '';
      }
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var c4 = buffer[3];
      var ret;
      if (buffer.length == 2) {
        ret = String.fromCharCode(((c1 & 0x1F) << 6)  | (c2 & 0x3F));
      } else if (buffer.length == 3) {
        ret = String.fromCharCode(((c1 & 0x0F) << 12) | ((c2 & 0x3F) << 6)  | (c3 & 0x3F));
      } else {
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        var codePoint = ((c1 & 0x07) << 18) | ((c2 & 0x3F) << 12) |
                        ((c3 & 0x3F) << 6)  | (c4 & 0x3F);
        ret = String.fromCharCode(
          Math.floor((codePoint - 0x10000) / 0x400) + 0xD800,
          (codePoint - 0x10000) % 0x400 + 0xDC00);
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function processJSString(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+7)&-8); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = (((STATICTOP)+7)&-8); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = (((DYNAMICTOP)+7)&-8); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*(+4294967296))) : ((+((low>>>0)))+((+((high|0)))*(+4294967296)))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      value = intArrayFromString(value);
      type = 'array';
    }
    if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF16ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module['UTF16ToString'] = UTF16ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16LE form. The copy will require at most (str.length*2+1)*2 bytes of space in the HEAP.
function stringToUTF16(str, outPtr) {
  for(var i = 0; i < str.length; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[(((outPtr)+(i*2))>>1)]=codeUnit;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[(((outPtr)+(str.length*2))>>1)]=0;
}
Module['stringToUTF16'] = stringToUTF16;
// Given a pointer 'ptr' to a null-terminated UTF32LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.
function UTF32ToString(ptr) {
  var i = 0;
  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module['UTF32ToString'] = UTF32ToString;
// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32LE form. The copy will require at most (str.length+1)*4 bytes of space in the HEAP,
// but can use less, since str.length does not return the number of characters in the string, but the number of UTF-16 code units in the string.
function stringToUTF32(str, outPtr) {
  var iChar = 0;
  for(var iCodeUnit = 0; iCodeUnit < str.length; ++iCodeUnit) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    var codeUnit = str.charCodeAt(iCodeUnit); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++iCodeUnit);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[(((outPtr)+(iChar*4))>>2)]=codeUnit;
    ++iChar;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[(((outPtr)+(iChar*4))>>2)]=0;
}
Module['stringToUTF32'] = stringToUTF32;
function demangle(func) {
  try {
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    var i = 3;
    // params, etc.
    var basicTypes = {
      'v': 'void',
      'b': 'bool',
      'c': 'char',
      's': 'short',
      'i': 'int',
      'l': 'long',
      'f': 'float',
      'd': 'double',
      'w': 'wchar_t',
      'a': 'signed char',
      'h': 'unsigned char',
      't': 'unsigned short',
      'j': 'unsigned int',
      'm': 'unsigned long',
      'x': 'long long',
      'y': 'unsigned long long',
      'z': '...'
    };
    function dump(x) {
      //return;
      if (x) Module.print(x);
      Module.print(func);
      var pre = '';
      for (var a = 0; a < i; a++) pre += ' ';
      Module.print (pre + '^');
    }
    var subs = [];
    function parseNested() {
      i++;
      if (func[i] === 'K') i++; // ignore const
      var parts = [];
      while (func[i] !== 'E') {
        if (func[i] === 'S') { // substitution
          i++;
          var next = func.indexOf('_', i);
          var num = func.substring(i, next) || 0;
          parts.push(subs[num] || '?');
          i = next+1;
          continue;
        }
        if (func[i] === 'C') { // constructor
          parts.push(parts[parts.length-1]);
          i += 2;
          continue;
        }
        var size = parseInt(func.substr(i));
        var pre = size.toString().length;
        if (!size || !pre) { i--; break; } // counter i++ below us
        var curr = func.substr(i + pre, size);
        parts.push(curr);
        subs.push(curr);
        i += pre + size;
      }
      i++; // skip E
      return parts;
    }
    var first = true;
    function parse(rawList, limit, allowVoid) { // main parser
      limit = limit || Infinity;
      var ret = '', list = [];
      function flushList() {
        return '(' + list.join(', ') + ')';
      }
      var name;
      if (func[i] === 'N') {
        // namespaced N-E
        name = parseNested().join('::');
        limit--;
        if (limit === 0) return rawList ? [name] : name;
      } else {
        // not namespaced
        if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
        var size = parseInt(func.substr(i));
        if (size) {
          var pre = size.toString().length;
          name = func.substr(i + pre, size);
          i += pre + size;
        }
      }
      first = false;
      if (func[i] === 'I') {
        i++;
        var iList = parse(true);
        var iRet = parse(true, 1, true);
        ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
      } else {
        ret = name;
      }
      paramLoop: while (i < func.length && limit-- > 0) {
        //dump('paramLoop');
        var c = func[i++];
        if (c in basicTypes) {
          list.push(basicTypes[c]);
        } else {
          switch (c) {
            case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
            case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
            case 'L': { // literal
              i++; // skip basic type
              var end = func.indexOf('E', i);
              var size = end - i;
              list.push(func.substr(i, size));
              i += size + 2; // size + 'EE'
              break;
            }
            case 'A': { // array
              var size = parseInt(func.substr(i));
              i += size.toString().length;
              if (func[i] !== '_') throw '?';
              i++; // skip _
              list.push(parse(true, 1, true)[0] + ' [' + size + ']');
              break;
            }
            case 'E': break paramLoop;
            default: ret += '?' + c; break paramLoop;
          }
        }
      }
      if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
      return rawList ? list : ret + flushList();
    }
    return parse();
  } catch(e) {
    return func;
  }
}
function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}
function stackTrace() {
  var stack = new Error().stack;
  return stack ? demangleAll(stack) : '(no stack trace available)'; // Stack trace is not available at least on IE10 and Safari 6.
}
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return (x+4095)&-4096;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 4096;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 524288;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr;
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=str.charCodeAt(i);
  }
  if (!dontAddNull) HEAP8[(((buffer)+(str.length))|0)]=0;
}
Module['writeAsciiToMemory'] = writeAsciiToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
var memoryInitializer = null;
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 8592;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
var _stderr;
var _stderr=_stderr=allocate([0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
var _jpeg_aritab;
/* memory initializer */ allocate([16,0,0,0,11,0,0,0,10,0,0,0,16,0,0,0,24,0,0,0,40,0,0,0,51,0,0,0,61,0,0,0,12,0,0,0,12,0,0,0,14,0,0,0,19,0,0,0,26,0,0,0,58,0,0,0,60,0,0,0,55,0,0,0,14,0,0,0,13,0,0,0,16,0,0,0,24,0,0,0,40,0,0,0,57,0,0,0,69,0,0,0,56,0,0,0,14,0,0,0,17,0,0,0,22,0,0,0,29,0,0,0,51,0,0,0,87,0,0,0,80,0,0,0,62,0,0,0,18,0,0,0,22,0,0,0,37,0,0,0,56,0,0,0,68,0,0,0,109,0,0,0,103,0,0,0,77,0,0,0,24,0,0,0,35,0,0,0,55,0,0,0,64,0,0,0,81,0,0,0,104,0,0,0,113,0,0,0,92,0,0,0,49,0,0,0,64,0,0,0,78,0,0,0,87,0,0,0,103,0,0,0,121,0,0,0,120,0,0,0,101,0,0,0,72,0,0,0,92,0,0,0,95,0,0,0,98,0,0,0,112,0,0,0,100,0,0,0,103,0,0,0,99,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,0,0,0,0,0,1,2,3,4,5,6,7,8,9,10,11,0,0,0,0,1,2,3,0,4,17,5,18,33,49,65,6,19,81,97,7,34,113,20,50,129,145,161,8,35,66,177,193,21,82,209,240,36,51,98,114,130,9,10,22,23,24,25,26,37,38,39,40,41,42,52,53,54,55,56,57,58,67,68,69,70,71,72,73,74,83,84,85,86,87,88,89,90,99,100,101,102,103,104,105,106,115,116,117,118,119,120,121,122,131,132,133,134,135,136,137,138,146,147,148,149,150,151,152,153,154,162,163,164,165,166,167,168,169,170,178,179,180,181,182,183,184,185,186,194,195,196,197,198,199,200,201,202,210,211,212,213,214,215,216,217,218,225,226,227,228,229,230,231,232,233,234,241,242,243,244,245,246,247,248,249,250,0,0,0,0,0,0,0,1,2,3,17,4,5,33,49,6,18,65,81,7,97,113,19,34,50,129,8,20,66,145,161,177,193,9,35,51,82,240,21,98,114,209,10,22,36,52,225,37,241,23,24,25,26,38,39,40,41,42,53,54,55,56,57,58,67,68,69,70,71,72,73,74,83,84,85,86,87,88,89,90,99,100,101,102,103,104,105,106,115,116,117,118,119,120,121,122,130,131,132,133,134,135,136,137,138,146,147,148,149,150,151,152,153,154,162,163,164,165,166,167,168,169,170,178,179,180,181,182,183,184,185,186,194,195,196,197,198,199,200,201,202,210,211,212,213,214,215,216,217,218,226,227,228,229,230,231,232,233,234,242,243,244,245,246,247,248,249,250,0,0,0,0,0,0,0,0,1,5,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,1,3,3,2,4,3,5,5,4,4,0,0,1,125,0,0,0,0,0,0,0,0,0,2,1,2,4,4,3,4,7,5,4,4,0,1,2,119,0,0,0,0,0,0,0,17,0,0,0,18,0,0,0,24,0,0,0,47,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,18,0,0,0,21,0,0,0,26,0,0,0,66,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,24,0,0,0,26,0,0,0,56,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,47,0,0,0,66,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,99,0,0,0,0,64,197,88,159,83,66,75,0,64,73,50,163,34,168,17,197,88,33,123,252,115,98,104,197,88,191,69,11,48,126,24,159,83,252,115,65,109,84,98,159,83,179,65,65,45,18,23,66,75,98,104,84,98,126,88,66,75,33,59,186,40,195,20,0,64,197,88,159,83,66,75,0,64,73,50,163,34,168,17,73,50,191,69,179,65,33,59,73,50,130,39,55,27,224,13,163,34,11,48,65,45,186,40,163,34,55,27,191,18,142,9,168,17,126,24,18,23,195,20,168,17,224,13,142,9,223,4,0,0,0,0,0,0,240,63,239,97,72,177,80,49,246,63,202,111,77,145,174,231,244,63,170,17,108,239,98,208,242,63,0,0,0,0,0,0,240,63,59,191,167,192,105,36,233,63,187,32,199,123,122,81,225,63,93,171,114,222,85,168,209,63,144,31,0,0,112,31,0,0,16,25,0,0,72,23,0,0,240,21,0,0,72,20,0,0,144,18,0,0,160,16,0,0,192,14,0,0,56,13,0,0,88,31,0,0,232,29,0,0,208,27,0,0,56,26,0,0,8,26,0,0,232,25,0,0,192,25,0,0,136,25,0,0,80,25,0,0,56,25,0,0,240,24,0,0,192,24,0,0,104,24,0,0,72,24,0,0,24,24,0,0,248,23,0,0,208,23,0,0,168,23,0,0,128,23,0,0,104,23,0,0,48,23,0,0,24,23,0,0,0,23,0,0,216,22,0,0,192,22,0,0,168,22,0,0,128,22,0,0,104,22,0,0,56,22,0,0,16,22,0,0,200,21,0,0,160,21,0,0,112,21,0,0,88,21,0,0,56,21,0,0,248,20,0,0,208,20,0,0,168,20,0,0,144,20,0,0,96,20,0,0,32,20,0,0,0,20,0,0,216,19,0,0,176,19,0,0,128,19,0,0,80,19,0,0,48,19,0,0,0,19,0,0,216,18,0,0,176,18,0,0,96,18,0,0,48,18,0,0,0,18,0,0,208,17,0,0,160,17,0,0,120,17,0,0,88,17,0,0,56,17,0,0,0,17,0,0,208,16,0,0,128,16,0,0,88,16,0,0,48,16,0,0,24,16,0,0,0,16,0,0,200,15,0,0,184,15,0,0,120,15,0,0,48,15,0,0,0,15,0,0,144,14,0,0,104,14,0,0,72,14,0,0,24,14,0,0,248,13,0,0,224,13,0,0,200,13,0,0,184,13,0,0,144,13,0,0,88,13,0,0,248,12,0,0,200,12,0,0,160,12,0,0,120,12,0,0,88,12,0,0,48,12,0,0,8,12,0,0,240,11,0,0,200,11,0,0,160,11,0,0,80,31,0,0,16,31,0,0,208,30,0,0,176,30,0,0,160,30,0,0,128,30,0,0,96,30,0,0,64,30,0,0,32,30,0,0,0,30,0,0,160,29,0,0,96,29,0,0,40,29,0,0,240,28,0,0,216,28,0,0,192,28,0,0,152,28,0,0,112,28,0,0,40,28,0,0,232,27,0,0,152,27,0,0,112,27,0,0,56,27,0,0,24,27,0,0,224,26,0,0,176,26,0,0,128,26,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,17,0,0,0,24,0,0,0,32,0,0,0,25,0,0,0,18,0,0,0,11,0,0,0,4,0,0,0,5,0,0,0,12,0,0,0,19,0,0,0,26,0,0,0,33,0,0,0,40,0,0,0,48,0,0,0,41,0,0,0,34,0,0,0,27,0,0,0,20,0,0,0,13,0,0,0,6,0,0,0,14,0,0,0,21,0,0,0,28,0,0,0,35,0,0,0,42,0,0,0,49,0,0,0,50,0,0,0,43,0,0,0,36,0,0,0,29,0,0,0,22,0,0,0,30,0,0,0,37,0,0,0,44,0,0,0,51,0,0,0,52,0,0,0,45,0,0,0,38,0,0,0,46,0,0,0,53,0,0,0,54,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,17,0,0,0,24,0,0,0,32,0,0,0,25,0,0,0,18,0,0,0,11,0,0,0,4,0,0,0,5,0,0,0,12,0,0,0,19,0,0,0,26,0,0,0,33,0,0,0,40,0,0,0,41,0,0,0,34,0,0,0,27,0,0,0,20,0,0,0,13,0,0,0,21,0,0,0,28,0,0,0,35,0,0,0,42,0,0,0,43,0,0,0,36,0,0,0,29,0,0,0,37,0,0,0,44,0,0,0,45,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,17,0,0,0,24,0,0,0,32,0,0,0,25,0,0,0,18,0,0,0,11,0,0,0,4,0,0,0,12,0,0,0,19,0,0,0,26,0,0,0,33,0,0,0,34,0,0,0,27,0,0,0,20,0,0,0,28,0,0,0,35,0,0,0,36,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,17,0,0,0,24,0,0,0,25,0,0,0,18,0,0,0,11,0,0,0,19,0,0,0,26,0,0,0,27,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,10,0,0,0,17,0,0,0,18,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,9,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,0,0,0,0,1,0,0,0,8,0,0,0,16,0,0,0,9,0,0,0,2,0,0,0,3,0,0,0,10,0,0,0,17,0,0,0,24,0,0,0,32,0,0,0,25,0,0,0,18,0,0,0,11,0,0,0,4,0,0,0,5,0,0,0,12,0,0,0,19,0,0,0,26,0,0,0,33,0,0,0,40,0,0,0,48,0,0,0,41,0,0,0,34,0,0,0,27,0,0,0,20,0,0,0,13,0,0,0,6,0,0,0,7,0,0,0,14,0,0,0,21,0,0,0,28,0,0,0,35,0,0,0,42,0,0,0,49,0,0,0,56,0,0,0,57,0,0,0,50,0,0,0,43,0,0,0,36,0,0,0,29,0,0,0,22,0,0,0,15,0,0,0,23,0,0,0,30,0,0,0,37,0,0,0,44,0,0,0,51,0,0,0,58,0,0,0,59,0,0,0,52,0,0,0,45,0,0,0,38,0,0,0,31,0,0,0,39,0,0,0,46,0,0,0,53,0,0,0,60,0,0,0,61,0,0,0,54,0,0,0,47,0,0,0,55,0,0,0,62,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,63,0,0,0,64,6,0,0,128,62,0,0,0,0,0,0,136,19,0,0,65,116,32,109,97,114,107,101,114,32,48,120,37,48,50,120,44,32,114,101,99,111,118,101,114,121,32,97,99,116,105,111,110,32,37,100,0,0,0,0,83,101,108,101,99,116,101,100,32,37,100,32,99,111,108,111,114,115,32,102,111,114,32,113,117,97,110,116,105,122,97,116,105,111,110,0,0,0,0,0,81,117,97,110,116,105,122,105,110,103,32,116,111,32,37,100,32,99,111,108,111,114,115,0,81,117,97,110,116,105,122,105,110,103,32,116,111,32,37,100,32,61,32,37,100,42,37,100,42,37,100,32,99,111,108,111,114,115,0,0,0,0,0,0,32,32,32,32,32,32,32,32,37,52,117,32,37,52,117,32,37,52,117,32,37,52,117,32,37,52,117,32,37,52,117,32,37,52,117,32,37,52,117,0,85,110,101,120,112,101,99,116,101,100,32,109,97,114,107,101,114,32,48,120,37,48,50,120,0,0,0,0,0,0,0,0,77,105,115,99,101,108,108,97,110,101,111,117,115,32,109,97,114,107,101,114,32,48,120,37,48,50,120,44,32,108,101,110,103,116,104,32,37,117,0,0,32,32,32,32,119,105,116,104,32,37,100,32,120,32,37,100,32,116,104,117,109,98,110,97,105,108,32,105,109,97,103,101,0,0,0,0,0,0,0,0,74,70,73,70,32,101,120,116,101,110,115,105,111,110,32,109,97,114,107,101,114,58,32,116,121,112,101,32,48,120,37,48,50,120,44,32,108,101,110,103,116,104,32,37,117,0,0,0,87,97,114,110,105,110,103,58,32,116,104,117,109,98,110,97,105,108,32,105,109,97,103,101,32,115,105,122,101,32,100,111,101,115,32,110,111,116,32,109,97,116,99,104,32,100,97,116,97,32,108,101,110,103,116,104,32,37,117,0,0,0,0,0,66,111,103,117,115,32,72,117,102,102,109,97,110,32,116,97,98,108,101,32,100,101,102,105,110,105,116,105,111,110,0,0,74,70,73,70,32,65,80,80,48,32,109,97,114,107,101,114,58,32,118,101,114,115,105,111,110,32,37,100,46,37,48,50,100,44,32,100,101,110,115,105,116,121,32,37,100,120,37,100,32,32,37,100,0,0,0,0,32,32,32,32,32,32,32,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,32,37,51,100,0,69,110,100,32,79,102,32,73,109,97,103,101,0,0,0,0,79,98,116,97,105,110,101,100,32,69,77,83,32,104,97,110,100,108,101,32,37,117,0,0,70,114,101,101,100,32,69,77,83,32,104,97,110,100,108,101,32,37,117,0,0,0,0,0,68,101,102,105,110,101,32,82,101,115,116,97,114,116,32,73,110,116,101,114,118,97,108,32,37,117,0,0,0,0,0,0,68,101,102,105,110,101,32,81,117,97,110,116,105,122,97,116,105,111,110,32,84,97,98,108,101,32,37,100,32,32,112,114,101,99,105,115,105,111,110,32,37,100,0,0,0,0,0,0,68,101,102,105,110,101,32,72,117,102,102,109,97,110,32,84,97,98,108,101,32,48,120,37,48,50,120,0,0,0,0,0,68,101,102,105,110,101,32,65,114,105,116,104,109,101,116,105,99,32,84,97,98,108,101,32,48,120,37,48,50,120,58,32,48,120,37,48,50,120,0,0,85,110,107,110,111,119,110,32,65,80,80,49,52,32,109,97,114,107,101,114,32,40,110,111,116,32,65,100,111,98,101,41,44,32,108,101,110,103,116,104,32,37,117,0,0,0,0,0,67,111,109,112,111,110,101,110,116,32,105,110,100,101,120,32,37,100,58,32,109,105,115,109,97,116,99,104,105,110,103,32,115,97,109,112,108,105,110,103,32,114,97,116,105,111,32,37,100,58,37,100,44,32,37,100,58,37,100,44,32,37,99,0,85,110,107,110,111,119,110,32,65,80,80,48,32,109,97,114,107,101,114,32,40,110,111,116,32,74,70,73,70,41,44,32,108,101,110,103,116,104,32,37,117,0,0,0,0,0,0,0,65,100,111,98,101,32,65,80,80,49,52,32,109,97,114,107,101,114,58,32,118,101,114,115,105,111,110,32,37,100,44,32,102,108,97,103,115,32,48,120,37,48,52,120,32,48,120,37,48,52,120,44,32,116,114,97,110,115,102,111,114,109,32,37,100,0,0,0,0,0,0,0,67,97,117,116,105,111,110,58,32,113,117,97,110,116,105,122,97,116,105,111,110,32,116,97,98,108,101,115,32,97,114,101,32,116,111,111,32,99,111,97,114,115,101,32,102,111,114,32,98,97,115,101,108,105,110,101,32,74,80,69,71,0,0,0,56,100,32,32,49,53,45,74,97,110,45,50,48,49,50,0,67,111,112,121,114,105,103,104,116,32,40,67,41,32,50,48,49,50,44,32,84,104,111,109,97,115,32,71,46,32,76,97,110,101,44,32,71,117,105,100,111,32,86,111,108,108,98,101,100,105,110,103,0,0,0,0,87,114,105,116,101,32,116,111,32,88,77,83,32,102,97,105,108,101,100,0,0,0,0,0,82,101,97,100,32,102,114,111,109,32,88,77,83,32,102,97,105,108,101,100,0,0,0,0,73,109,97,103,101,32,116,111,111,32,119,105,100,101,32,102,111,114,32,116,104,105,115,32,105,109,112,108,101,109,101,110,116,97,116,105,111,110,0,0,86,105,114,116,117,97,108,32,97,114,114,97,121,32,99,111,110,116,114,111,108,108,101,114,32,109,101,115,115,101,100,32,117,112,0,0,0,0,0,0,85,110,115,117,112,112,111,114,116,101,100,32,109,97,114,107,101,114,32,116,121,112,101,32,48,120,37,48,50,120,0,0,68,67,84,32,115,99,97,108,101,100,32,98,108,111,99,107,32,115,105,122,101,32,37,100,120,37,100,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,0,0,0,65,112,112,108,105,99,97,116,105,111,110,32,116,114,97,110,115,102,101,114,114,101,100,32,116,111,111,32,102,101,119,32,115,99,97,110,108,105,110,101,115,0,0,0,0,0,0,0,87,114,105,116,101,32,102,97,105,108,101,100,32,111,110,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,32,45,45,45,32,111,117,116,32,111,102,32,100,105,115,107,32,115,112,97,99,101,63,0,0,0,83,101,101,107,32,102,97,105,108,101,100,32,111,110,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,0,0,0,82,101,97,100,32,102,97,105,108,101,100,32,111,110,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,0,0,0,70,97,105,108,101,100,32,116,111,32,99,114,101,97,116,101,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,32,37,115,0,0,0,0,0,0,73,110,118,97,108,105,100,32,74,80,69,71,32,102,105,108,101,32,115,116,114,117,99,116,117,114,101,58,32,83,79,83,32,98,101,102,111,114,101,32,83,79,70,0,0,0,0,0,73,110,118,97,108,105,100,32,74,80,69,71,32,102,105,108,101,32,115,116,114,117,99,116,117,114,101,58,32,116,119,111,32,83,79,73,32,109,97,114,107,101,114,115,0,0,0,0,85,110,115,117,112,112,111,114,116,101,100,32,74,80,69,71,32,112,114,111,99,101,115,115,58,32,83,79,70,32,116,121,112,101,32,48,120,37,48,50,120,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,74,80,69,71,32,102,105,108,101,32,115,116,114,117,99,116,117,114,101,58,32,109,105,115,115,105,110,103,32,83,79,83,32,109,97,114,107,101,114,0,73,110,118,97,108,105,100,32,74,80,69,71,32,102,105,108,101,32,115,116,114,117,99,116,117,114,101,58,32,116,119,111,32,83,79,70,32,109,97,114,107,101,114,115,0,0,0,0,68,67,84,32,99,111,101,102,102,105,99,105,101,110,116,32,111,117,116,32,111,102,32,114,97,110,103,101,0,0,0,0,67,97,110,110,111,116,32,113,117,97,110,116,105,122,101,32,116,111,32,109,111,114,101,32,116,104,97,110,32,37,100,32,99,111,108,111,114,115,0,0,67,97,110,110,111,116,32,113,117,97,110,116,105,122,101,32,116,111,32,102,101,119,101,114,32,116,104,97,110,32,37,100,32,99,111,108,111,114,115,0,67,97,110,110,111,116,32,113,117,97,110,116,105,122,101,32,109,111,114,101,32,116,104,97,110,32,37,100,32,99,111,108,111,114,32,99,111,109,112,111,110,101,110,116,115,0,0,0,73,110,115,117,102,102,105,99,105,101,110,116,32,109,101,109,111,114,121,32,40,99,97,115,101,32,37,100,41,0,0,0,78,111,116,32,97,32,74,80,69,71,32,102,105,108,101,58,32,115,116,97,114,116,115,32,119,105,116,104,32,48,120,37,48,50,120,32,48,120,37,48,50,120,0,0,0,0,0,0,81,117,97,110,116,105,122,97,116,105,111,110,32,116,97,98,108,101,32,48,120,37,48,50,120,32,119,97,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,0,0,0,74,80,69,71,32,100,97,116,97,115,116,114,101,97,109,32,99,111,110,116,97,105,110,115,32,110,111,32,105,109,97,103,101,0,0,0,0,0,0,0,72,117,102,102,109,97,110,32,116,97,98,108,101,32,48,120,37,48,50,120,32,119,97,115,32,110,111,116,32,100,101,102,105,110,101,100,0,0,0,0,66,97,99,107,105,110,103,32,115,116,111,114,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,0,65,114,105,116,104,109,101,116,105,99,32,116,97,98,108,101,32,48,120,37,48,50,120,32,119,97,115,32,110,111,116,32,100,101,102,105,110,101,100,0,73,110,118,97,108,105,100,32,99,114,111,112,32,114,101,113,117,101,115,116,0,0,0,0,82,101,113,117,101,115,116,101,100,32,102,101,97,116,117,114,101,32,119,97,115,32,111,109,105,116,116,101,100,32,97,116,32,99,111,109,112,105,108,101,32,116,105,109,101,0,0,0,78,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,121,101,116,0,0,0,0,0,73,110,118,97,108,105,100,32,99,111,108,111,114,32,113,117,97,110,116,105,122,97,116,105,111,110,32,109,111,100,101,32,99,104,97,110,103,101,0,0,83,99,97,110,32,115,99,114,105,112,116,32,100,111,101,115,32,110,111,116,32,116,114,97,110,115,109,105,116,32,97,108,108,32,100,97,116,97,0,0,67,97,110,110,111,116,32,116,114,97,110,115,99,111,100,101,32,100,117,101,32,116,111,32,109,117,108,116,105,112,108,101,32,117,115,101,32,111,102,32,113,117,97,110,116,105,122,97,116,105,111,110,32,116,97,98,108,101,32,37,100,0,0,0,80,114,101,109,97,116,117,114,101,32,101,110,100,32,111,102,32,105,110,112,117,116,32,102,105,108,101,0,0,0,0,0,69,109,112,116,121,32,105,110,112,117,116,32,102,105,108,101,0,0,0,0,0,0,0,0,77,97,120,105,109,117,109,32,115,117,112,112,111,114,116,101,100,32,105,109,97,103,101,32,100,105,109,101,110,115,105,111,110,32,105,115,32,37,117,32,112,105,120,101,108,115,0,0,77,105,115,115,105,110,103,32,72,117,102,102,109,97,110,32,99,111,100,101,32,116,97,98,108,101,32,101,110,116,114,121,0,0,0,0,0,0,0,0,72,117,102,102,109,97,110,32,99,111,100,101,32,115,105,122,101,32,116,97,98,108,101,32,111,118,101,114,102,108,111,119,0,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,99,111,109,112,111,110,101,110,116,32,73,68,32,37,100,32,105,110,32,83,79,83,0,0,70,114,97,99,116,105,111,110,97,108,32,115,97,109,112,108,105,110,103,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,121,101,116,0,79,117,116,112,117,116,32,102,105,108,101,32,119,114,105,116,101,32,101,114,114,111,114,32,45,45,45,32,111,117,116,32,111,102,32,100,105,115,107,32,115,112,97,99,101,63,0,0,73,110,112,117,116,32,102,105,108,101,32,114,101,97,100,32,101,114,114,111,114,0,0,0,68,105,100,110,39,116,32,101,120,112,101,99,116,32,109,111,114,101,32,116,104,97,110,32,111,110,101,32,115,99,97,110,0,0,0,0,0,0,0,0,87,114,105,116,101,32,116,111,32,69,77,83,32,102,97,105,108,101,100,0,0,0,0,0,82,101,97,100,32,102,114,111,109,32,69,77,83,32,102,97,105,108,101,100,0,0,0,0,69,109,112,116,121,32,74,80,69,71,32,105,109,97,103,101,32,40,68,78,76,32,110,111,116,32,115,117,112,112,111,114,116,101,100,41,0,0,0,0,66,111,103,117,115,32,68,81,84,32,105,110,100,101,120,32,37,100,0,0,0,0,0,0,66,111,103,117,115,32,68,72,84,32,105,110,100,101,120,32,37,100,0,0,0,0,0,0,66,111,103,117,115,32,68,65,67,32,118,97,108,117,101,32,48,120,37,120,0,0,0,0,66,111,103,117,115,32,98,117,102,102,101,114,32,99,111,110,116,114,111,108,32,109,111,100,101,0,0,0,0,0,0,0,66,111,103,117,115,32,68,65,67,32,105,110,100,101,120,32,37,100,0,0,0,0,0,0,85,110,115,117,112,112,111,114,116,101,100,32,99,111,108,111,114,32,99,111,110,118,101,114,115,105,111,110,32,114,101,113,117,101,115,116,0,0,0,0,84,111,111,32,109,97,110,121,32,99,111,108,111,114,32,99,111,109,112,111,110,101,110,116,115,58,32,37,100,44,32,109,97,120,32,37,100,0,0,0,67,67,73,82,54,48,49,32,115,97,109,112,108,105,110,103,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,121,101,116,0,0,0,0,83,117,115,112,101,110,115,105,111,110,32,110,111,116,32,97,108,108,111,119,101,100,32,104,101,114,101,0,0,0,0,0,66,117,102,102,101,114,32,112,97,115,115,101,100,32,116,111,32,74,80,69,71,32,108,105,98,114,97,114,121,32,105,115,32,116,111,111,32,115,109,97,108,108,0,0,0,0,0,0,66,111,103,117,115,32,118,105,114,116,117,97,108,32,97,114,114,97,121,32,97,99,99,101,115,115,0,0,0,0,0,0,74,80,69,71,32,112,97,114,97,109,101,116,101,114,32,115,116,114,117,99,116,32,109,105,115,109,97,116,99,104,58,32,108,105,98,114,97,114,121,32,116,104,105,110,107,115,32,115,105,122,101,32,105,115,32,37,117,44,32,99,97,108,108,101,114,32,101,120,112,101,99,116,115,32,37,117,0,0,0,0,74,80,69,71,77,69,77,0,73,109,112,114,111,112,101,114,32,99,97,108,108,32,116,111,32,74,80,69,71,32,108,105,98,114,97,114,121,32,105,110,32,115,116,97,116,101,32,37,100,0,0,0,0,0,0,0,73,110,118,97,108,105,100,32,115,99,97,110,32,115,99,114,105,112,116,32,97,116,32,101,110,116,114,121,32,37,100,0,77,65,88,95,65,76,76,79,67,95,67,72,85,78,75,32,105,115,32,119,114,111,110,103,44,32,112,108,101,97,115,101,32,102,105,120,0,0,0,0,66,111,103,117,115,32,115,97,109,112,108,105,110,103,32,102,97,99,116,111,114,115,0,0,73,110,118,97,108,105,100,32,112,114,111,103,114,101,115,115,105,118,101,32,112,97,114,97,109,101,116,101,114,115,32,97,116,32,115,99,97,110,32,115,99,114,105,112,116,32,101,110,116,114,121,32,37,100,0,0,73,110,118,97,108,105,100,32,112,114,111,103,114,101,115,115,105,118,101,32,112,97,114,97,109,101,116,101,114,115,32,83,115,61,37,100,32,83,101,61,37,100,32,65,104,61,37,100,32,65,108,61,37,100,0,0,85,110,115,117,112,112,111,114,116,101,100,32,74,80,69,71,32,100,97,116,97,32,112,114,101,99,105,115,105,111,110,32,37,100,0,0,0,0,0,0,73,110,118,97,108,105,100,32,109,101,109,111,114,121,32,112,111,111,108,32,99,111,100,101,32,37,100,0,0,0,0,0,83,97,109,112,108,105,110,103,32,102,97,99,116,111,114,115,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,105,110,116,101,114,108,101,97,118,101,100,32,115,99,97,110,0,87,114,111,110,103,32,74,80,69,71,32,108,105,98,114,97,114,121,32,118,101,114,115,105,111,110,58,32,108,105,98,114,97,114,121,32,105,115,32,37,100,44,32,99,97,108,108,101,114,32,101,120,112,101,99,116,115,32,37,100,0,0,0,0,37,115,10,0,0,0,0,0,65,112,112,108,105,99,97,116,105,111,110,32,116,114,97,110,115,102,101,114,114,101,100,32,116,111,111,32,109,97,110,121,32,115,99,97,110,108,105,110,101,115,0,0,0,0,0,0,73,110,118,97,108,105,100,32,83,79,83,32,112,97,114,97,109,101,116,101,114,115,32,102,111,114,32,115,101,113,117,101,110,116,105,97,108,32,74,80,69,71,0,0,0,0,0,0,67,111,114,114,117,112,116,32,74,80,69,71,32,100,97,116,97,58,32,102,111,117,110,100,32,109,97,114,107,101,114,32,48,120,37,48,50,120,32,105,110,115,116,101,97,100,32,111,102,32,82,83,84,37,100,0,80,114,101,109,97,116,117,114,101,32,101,110,100,32,111,102,32,74,80,69,71,32,102,105,108,101,0,0,0,0,0,0,87,97,114,110,105,110,103,58,32,117,110,107,110,111,119,110,32,74,70,73,70,32,114,101,118,105,115,105,111,110,32,110,117,109,98,101,114,32,37,100,46,37,48,50,100,0,0,0,37,108,100,37,99,0,0,0,67,111,114,114,117,112,116,32,74,80,69,71,32,100,97,116,97,58,32,98,97,100,32,72,117,102,102,109,97,110,32,99,111,100,101,0,0,0,0,0,67,111,114,114,117,112,116,32,74,80,69,71,32,100,97,116,97,58,32,112,114,101,109,97,116,117,114,101,32,101,110,100,32,111,102,32,100,97,116,97,32,115,101,103,109,101,110,116,0,0,0,0,0,0,0,0,66,111,103,117,115,32,109,97,114,107,101,114,32,108,101,110,103,116,104,0,0,0,0,0,67,111,114,114,117,112,116,32,74,80,69,71,32,100,97,116,97,58,32,37,117,32,101,120,116,114,97,110,101,111,117,115,32,98,121,116,101,115,32,98,101,102,111,114,101,32,109,97,114,107,101,114,32,48,120,37,48,50,120,0,0,0,0,0,73,110,99,111,110,115,105,115,116,101,110,116,32,112,114,111,103,114,101,115,115,105,111,110,32,115,101,113,117,101,110,99,101,32,102,111,114,32,99,111,109,112,111,110,101,110,116,32,37,100,32,99,111,101,102,102,105,99,105,101,110,116,32,37,100,0,0,0,0,0,0,0,67,111,114,114,117,112,116,32,74,80,69,71,32,100,97,116,97,58,32,98,97,100,32,97,114,105,116,104,109,101,116,105,99,32,99,111,100,101,0,0,85,110,107,110,111,119,110,32,65,100,111,98,101,32,99,111,108,111,114,32,116,114,97,110,115,102,111,114,109,32,99,111,100,101,32,37,100,0,0,0,79,98,116,97,105,110,101,100,32,88,77,83,32,104,97,110,100,108,101,32,37,117,0,0,70,114,101,101,100,32,88,77,83,32,104,97,110,100,108,101,32,37,117,0,0,0,0,0,85,110,114,101,99,111,103,110,105,122,101,100,32,99,111,109,112,111,110,101,110,116,32,73,68,115,32,37,100,32,37,100,32,37,100,44,32,97,115,115,117,109,105,110,103,32,89,67,98,67,114,0,0,0,0,0,74,70,73,70,32,101,120,116,101,110,115,105,111,110,32,109,97,114,107,101,114,58,32,82,71,66,32,116,104,117,109,98,110,97,105,108,32,105,109,97,103,101,44,32,108,101,110,103,116,104,32,37,117,0,0,0,74,70,73,70,32,101,120,116,101,110,115,105,111,110,32,109,97,114,107,101,114,58,32,112,97,108,101,116,116,101,32,116,104,117,109,98,110,97,105,108,32,105,109,97,103,101,44,32,108,101,110,103,116,104,32,37,117,0,0,0,0,0,0,0,74,70,73,70,32,101,120,116,101,110,115,105,111,110,32,109,97,114,107,101,114,58,32,74,80,69,71,45,99,111,109,112,114,101,115,115,101,100,32,116,104,117,109,98,110,97,105,108,32,105,109,97,103,101,44,32,108,101,110,103,116,104,32,37,117,0,0,0,0,0,0,0,66,111,103,117,115,32,74,80,69,71,32,99,111,108,111,114,115,112,97,99,101,0,0,0,79,112,101,110,101,100,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,32,37,115,0,0,0,0,0,0,0,0,67,108,111,115,101,100,32,116,101,109,112,111,114,97,114,121,32,102,105,108,101,32,37,115,0,0,0,0,0,0,0,0,32,32,83,115,61,37,100,44,32,83,101,61,37,100,44,32,65,104,61,37,100,44,32,65,108,61,37,100,0,0,0,0,32,32,32,32,67,111,109,112,111,110,101,110,116,32,37,100,58,32,100,99,61,37,100,32,97,99,61,37,100,0,0,0,83,116,97,114,116,32,79,102,32,83,99,97,110,58,32,37,100,32,99,111,109,112,111,110,101,110,116,115,0,0,0,0,83,116,97,114,116,32,111,102,32,73,109,97,103,101,0,0,32,32,32,32,67,111,109,112,111,110,101,110,116,32,37,100,58,32,37,100,104,120,37,100,118,32,113,61,37,100,0,0,83,116,97,114,116,32,79,102,32,70,114,97,109,101,32,48,120,37,48,50,120,58,32,119,105,100,116,104,61,37,117,44,32,104,101,105,103,104,116,61,37,117,44,32,99,111,109,112,111,110,101,110,116,115,61,37,100,0,0,0,0,0,0,0,83,109,111,111,116,104,105,110,103,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,119,105,116,104,32,110,111,110,115,116,97,110,100,97,114,100,32,115,97,109,112,108,105,110,103,32,114,97,116,105,111,115,0,0,0,0,0,0,0,0,82,83,84,37,100,0,0,0,66,111,103,117,115,32,105,110,112,117,116,32,99,111,108,111,114,115,112,97,99,101,0,0,65,76,73,71,78,95,84,89,80,69,32,105,115,32,119,114,111,110,103,44,32,112,108,101,97,115,101,32,102,105,120,0,66,111,103,117,115,32,109,101,115,115,97,103,101,32,99,111,100,101,32,37,100,0,0,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  Module["_strlen"] = _strlen;
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = HEAPF64[(((varargs)+(argIndex))>>3)];
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+8))>>2)]];
          argIndex += 8; // each 32-bit chunk is in a 64-bit block
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Math.max(Runtime.getNativeFieldSize(type), Runtime.getAlignSize(type, null, true));
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          var flagPadSign = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              case 32:
                flagPadSign = true;
                break;
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = (flagAlternative && currArg != 0) ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (currArg >= 0) {
                if (flagAlwaysSigned) {
                  prefix = '+' + prefix;
                } else if (flagPadSign) {
                  prefix = ' ' + prefix;
                }
              }
              // Move sign to prefix so we zero-pad after the sign
              if (argText.charAt(0) == '-') {
                prefix = '-' + prefix;
                argText = argText.substr(1);
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (currArg >= 0) {
                  if (flagAlwaysSigned) {
                    argText = '+' + argText;
                  } else if (flagPadSign) {
                    argText = ' ' + argText;
                  }
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*');
              var argLength = arg ? _strlen(arg) : '(null)'.length;
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              if (arg) {
                for (var i = 0; i < argLength; i++) {
                  ret.push(HEAPU8[((arg++)|0)]);
                }
              } else {
                ret = ret.concat(intArrayFromString('(null)'.substr(0, argLength), true));
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }
  var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            continue;
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          if (stream.tty.output.length) {
            stream.tty.ops.put_char(stream.tty, 10);
          }
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              result = process['stdin']['read']();
              if (!result) {
                if (process['stdin']['_readableState'] && process['stdin']['_readableState']['ended']) {
                  return null;  // EOF
                }
                return undefined;  // no data available
              }
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](tty.output.join(''));
            tty.output = [];
          } else {
            tty.output.push(TTY.utf8.processCChar(val));
          }
        }}};
  var MEMFS={ops_table:null,CONTENT_OWNING:1,CONTENT_FLEXIBLE:2,CONTENT_FIXED:3,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 0777, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            },
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.contents = [];
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },ensureFlexible:function (node) {
        if (node.contentMode !== MEMFS.CONTENT_FLEXIBLE) {
          var contents = node.contents;
          node.contents = Array.prototype.slice.call(contents);
          node.contentMode = MEMFS.CONTENT_FLEXIBLE;
        }
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.contents.length;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.ensureFlexible(node);
            var contents = node.contents;
            if (attr.size < contents.length) contents.length = attr.size;
            else while (attr.size > contents.length) contents.push(0);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0777 | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else
          {
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          var node = stream.node;
          node.timestamp = Date.now();
          var contents = node.contents;
          if (length && contents.length === 0 && position === 0 && buffer.subarray) {
            // just replace it with the new data
            if (canOwn && offset === 0) {
              node.contents = buffer; // this could be a subarray of Emscripten HEAP, or allocated from some other source.
              node.contentMode = (buffer.buffer === HEAP8.buffer) ? MEMFS.CONTENT_OWNING : MEMFS.CONTENT_FIXED;
            } else {
              node.contents = new Uint8Array(buffer.subarray(offset, offset+length));
              node.contentMode = MEMFS.CONTENT_FIXED;
            }
            return length;
          }
          MEMFS.ensureFlexible(node);
          var contents = node.contents;
          while (contents.length < position) contents.push(0);
          for (var i = 0; i < length; i++) {
            contents[position + i] = buffer[offset + i];
          }
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.contents.length;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.ungotten = [];
          stream.position = position;
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.ensureFlexible(stream.node);
          var contents = stream.node.contents;
          var limit = offset + length;
          while (limit > contents.length) contents.push(0);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < contents.length) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }}};
  var IDBFS={dbs:{},indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },reconcile:function (src, dst, callback) {
        var total = 0;
        var create = {};
        for (var key in src.files) {
          if (!src.files.hasOwnProperty(key)) continue;
          var e = src.files[key];
          var e2 = dst.files[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create[key] = e;
            total++;
          }
        }
        var remove = {};
        for (var key in dst.files) {
          if (!dst.files.hasOwnProperty(key)) continue;
          var e = dst.files[key];
          var e2 = src.files[key];
          if (!e2) {
            remove[key] = e;
            total++;
          }
        }
        if (!total) {
          // early out
          return callback(null);
        }
        var completed = 0;
        function done(err) {
          if (err) return callback(err);
          if (++completed >= total) {
            return callback(null);
          }
        };
        // create a single transaction to handle and IDB reads / writes we'll need to do
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        transaction.onerror = function transaction_onerror() { callback(this.error); };
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        for (var path in create) {
          if (!create.hasOwnProperty(path)) continue;
          var entry = create[path];
          if (dst.type === 'local') {
            // save file to local
            try {
              if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode);
              } else if (FS.isFile(entry.mode)) {
                var stream = FS.open(path, 'w+', 0666);
                FS.write(stream, entry.contents, 0, entry.contents.length, 0, true /* canOwn */);
                FS.close(stream);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // save file to IDB
            var req = store.put(entry, path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
        for (var path in remove) {
          if (!remove.hasOwnProperty(path)) continue;
          var entry = remove[path];
          if (dst.type === 'local') {
            // delete file from local
            try {
              if (FS.isDir(entry.mode)) {
                // TODO recursive delete?
                FS.rmdir(path);
              } else if (FS.isFile(entry.mode)) {
                FS.unlink(path);
              }
              done(null);
            } catch (e) {
              return done(e);
            }
          } else {
            // delete file from IDB
            var req = store.delete(path);
            req.onsuccess = function req_onsuccess() { done(null); };
            req.onerror = function req_onerror() { done(this.error); };
          }
        }
      },getLocalSet:function (mount, callback) {
        var files = {};
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
        var check = FS.readdir(mount.mountpoint)
          .filter(isRealDir)
          .map(toAbsolute(mount.mountpoint));
        while (check.length) {
          var path = check.pop();
          var stat, node;
          try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path)
              .filter(isRealDir)
              .map(toAbsolute(path)));
            files[path] = { mode: stat.mode, timestamp: stat.mtime };
          } else if (FS.isFile(stat.mode)) {
            files[path] = { contents: node.contents, mode: stat.mode, timestamp: stat.mtime };
          } else {
            return callback(new Error('node type not supported'));
          }
        }
        return callback(null, { type: 'local', files: files });
      },getDB:function (name, callback) {
        // look it up in the cache
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        req.onupgradeneeded = function req_onupgradeneeded() {
          db = req.result;
          db.createObjectStore(IDBFS.DB_STORE_NAME);
        };
        req.onsuccess = function req_onsuccess() {
          db = req.result;
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function req_onerror() {
          callback(this.error);
        };
      },getRemoteSet:function (mount, callback) {
        var files = {};
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function transaction_onerror() { callback(this.error); };
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          store.openCursor().onsuccess = function store_openCursor_onsuccess(event) {
            var cursor = event.target.result;
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, files: files });
            }
            files[cursor.key] = cursor.value;
            cursor.continue();
          };
        });
      }};
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so 
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          stream.position = position;
          return position;
        }}};
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      // we don't currently perform any user-space buffering of data
    }var FS={root:null,mounts:[],devices:[null],streams:[null],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || { recurse_count: 0 };
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
        // start at the root
        var current = FS.root;
        var current_path = '/';
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            current = current.mount.root;
          }
          // follow symlinks
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
            this.parent = null;
            this.mount = null;
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            FS.hashAddNode(this);
          };
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
          FS.FSNode.prototype = {};
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); },
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); },
            },
          });
        }
        return new FS.FSNode(parent, name, mode, rdev);
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var accmode = flag & 2097155;
        var perms = ['r', 'w', 'rw'][accmode];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        return FS.nodePermissions(dir, 'x');
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 1;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        if (stream.__proto__) {
          // reuse the object
          stream.__proto__ = FS.FSStream.prototype;
        } else {
          var newStream = new FS.FSStream();
          for (var p in stream) {
            newStream[p] = stream[p];
          }
          stream = newStream;
        }
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
        var completed = 0;
        var total = FS.mounts.length;
        function done(err) {
          if (err) {
            return callback(err);
          }
          if (++completed >= total) {
            callback(null);
          }
        };
        // sync all mounts
        for (var i = 0; i < FS.mounts.length; i++) {
          var mount = FS.mounts[i];
          if (!mount.type.syncfs) {
            done(null);
            continue;
          }
          mount.type.syncfs(mount, populate, done);
        }
      },mount:function (type, opts, mountpoint) {
        var lookup;
        if (mountpoint) {
          lookup = FS.lookupPath(mountpoint, { follow: false });
          mountpoint = lookup.path;  // use the absolute path
        }
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          root: null
        };
        // create a root node for the fs
        var root = type.mount(mount);
        root.mount = mount;
        mount.root = root;
        // assign the mount info to the mountpoint's node
        if (lookup) {
          lookup.node.mount = mount;
          lookup.node.mounted = true;
          // compatibility update FS.root if we mount to /
          if (mountpoint === '/') {
            FS.root = mount.root;
          }
        }
        // add to our cached list of mounts
        FS.mounts.push(mount);
        return root;
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 0666;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 0777;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 0666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },readlink:function (path) {
        var lookup = FS.lookupPath(path, { follow: false });
        var link = lookup.node;
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return link.node_ops.readlink(link);
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 0666 : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // check permissions
        var err = FS.mayOpen(node, flags);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        return stream;
      },close:function (stream) {
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        return stream.stream_ops.llseek(stream, offset, whence);
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.errnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = '';
          var utf8 = new Runtime.UTF8Processor();
          for (var i = 0; i < length; i++) {
            ret += utf8.processCChar(buf[i]);
          }
        } else if (opts.encoding === 'binary') {
          ret = buf;
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var utf8 = new Runtime.UTF8Processor();
          var buf = new Uint8Array(utf8.processJSString(data));
          FS.write(stream, buf, 0, buf.length, 0);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0);
        } else {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function() { return 0; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        HEAP32[((_stdin)>>2)]=stdin.fd;
        assert(stdin.fd === 1, 'invalid handle for stdin (' + stdin.fd + ')');
        var stdout = FS.open('/dev/stdout', 'w');
        HEAP32[((_stdout)>>2)]=stdout.fd;
        assert(stdout.fd === 2, 'invalid handle for stdout (' + stdout.fd + ')');
        var stderr = FS.open('/dev/stderr', 'w');
        HEAP32[((_stderr)>>2)]=stderr.fd;
        assert(stderr.fd === 3, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno) {
          this.errno = errno;
          for (var key in ERRNO_CODES) {
            if (ERRNO_CODES[key] === errno) {
              this.code = key;
              break;
            }
          }
          this.message = ERRNO_MESSAGES[errno];
          this.stack = stackTrace();
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.root = FS.createNode(null, '/', 16384 | 0777, 0);
        FS.mount(MEMFS, {}, '/');
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureErrnoError();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = Math.floor(idx / this.chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter;
          }
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
              // Find length
              var xhr = new XMLHttpRequest();
              xhr.open('HEAD', url, false);
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              var datalength = Number(xhr.getResponseHeader("Content-length"));
              var header;
              var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
              var chunkSize = 1024*1024; // Chunk size in bytes
              if (!hasByteServing) chunkSize = datalength;
              // Function to get a range from the remote URL.
              var doXHR = (function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
                // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                // Some hints to the browser that we want binary data.
                if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
                if (xhr.overrideMimeType) {
                  xhr.overrideMimeType('text/plain; charset=x-user-defined');
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                  return new Uint8Array(xhr.response || []);
                } else {
                  return intArrayFromString(xhr.responseText || '', true);
                }
              });
              var lazyArray = this;
              lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum+1) * chunkSize - 1; // including this byte
                end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
                  lazyArray.chunks[chunkNum] = doXHR(start, end);
                }
                if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum];
              });
              this._length = datalength;
              this._chunkSize = chunkSize;
              this.lengthKnown = true;
          }
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};
  var _mkport=undefined;var SOCKFS={mount:function (mount) {
        return FS.createNode(null, '/', 16384 | 0777, 0);
      },createSocket:function (family, type, protocol) {
        var streaming = type == 1;
        if (protocol) {
          assert(streaming == (protocol == 6)); // if SOCK_STREAM, must be tcp
        }
        // create our internal socket structure
        var sock = {
          family: family,
          type: type,
          protocol: protocol,
          server: null,
          peers: {},
          pending: [],
          recv_queue: [],
          sock_ops: SOCKFS.websocket_sock_ops
        };
        // create the filesystem node to store the socket structure
        var name = SOCKFS.nextname();
        var node = FS.createNode(SOCKFS.root, name, 49152, 0);
        node.sock = sock;
        // and the wrapping stream that enables library functions such
        // as read and write to indirectly interact with the socket
        var stream = FS.createStream({
          path: name,
          node: node,
          flags: FS.modeStringToFlags('r+'),
          seekable: false,
          stream_ops: SOCKFS.stream_ops
        });
        // map the new stream to the socket structure (sockets have a 1:1
        // relationship with a stream)
        sock.stream = stream;
        return sock;
      },getSocket:function (fd) {
        var stream = FS.getStream(fd);
        if (!stream || !FS.isSocket(stream.node.mode)) {
          return null;
        }
        return stream.node.sock;
      },stream_ops:{poll:function (stream) {
          var sock = stream.node.sock;
          return sock.sock_ops.poll(sock);
        },ioctl:function (stream, request, varargs) {
          var sock = stream.node.sock;
          return sock.sock_ops.ioctl(sock, request, varargs);
        },read:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          var msg = sock.sock_ops.recvmsg(sock, length);
          if (!msg) {
            // socket is closed
            return 0;
          }
          buffer.set(msg.buffer, offset);
          return msg.buffer.length;
        },write:function (stream, buffer, offset, length, position /* ignored */) {
          var sock = stream.node.sock;
          return sock.sock_ops.sendmsg(sock, buffer, offset, length);
        },close:function (stream) {
          var sock = stream.node.sock;
          sock.sock_ops.close(sock);
        }},nextname:function () {
        if (!SOCKFS.nextname.current) {
          SOCKFS.nextname.current = 0;
        }
        return 'socket[' + (SOCKFS.nextname.current++) + ']';
      },websocket_sock_ops:{createPeer:function (sock, addr, port) {
          var ws;
          if (typeof addr === 'object') {
            ws = addr;
            addr = null;
            port = null;
          }
          if (ws) {
            // for sockets that've already connected (e.g. we're the server)
            // we can inspect the _socket property for the address
            if (ws._socket) {
              addr = ws._socket.remoteAddress;
              port = ws._socket.remotePort;
            }
            // if we're just now initializing a connection to the remote,
            // inspect the url property
            else {
              var result = /ws[s]?:\/\/([^:]+):(\d+)/.exec(ws.url);
              if (!result) {
                throw new Error('WebSocket URL must be in the format ws(s)://address:port');
              }
              addr = result[1];
              port = parseInt(result[2], 10);
            }
          } else {
            // create the actual websocket object and connect
            try {
              var url = 'ws://' + addr + ':' + port;
              // the node ws library API is slightly different than the browser's
              var opts = ENVIRONMENT_IS_NODE ? {headers: {'websocket-protocol': ['binary']}} : ['binary'];
              // If node we use the ws library.
              var WebSocket = ENVIRONMENT_IS_NODE ? require('ws') : window['WebSocket'];
              ws = new WebSocket(url, opts);
              ws.binaryType = 'arraybuffer';
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EHOSTUNREACH);
            }
          }
          var peer = {
            addr: addr,
            port: port,
            socket: ws,
            dgram_send_queue: []
          };
          SOCKFS.websocket_sock_ops.addPeer(sock, peer);
          SOCKFS.websocket_sock_ops.handlePeerEvents(sock, peer);
          // if this is a bound dgram socket, send the port number first to allow
          // us to override the ephemeral port reported to us by remotePort on the
          // remote end.
          if (sock.type === 2 && typeof sock.sport !== 'undefined') {
            peer.dgram_send_queue.push(new Uint8Array([
                255, 255, 255, 255,
                'p'.charCodeAt(0), 'o'.charCodeAt(0), 'r'.charCodeAt(0), 't'.charCodeAt(0),
                ((sock.sport & 0xff00) >> 8) , (sock.sport & 0xff)
            ]));
          }
          return peer;
        },getPeer:function (sock, addr, port) {
          return sock.peers[addr + ':' + port];
        },addPeer:function (sock, peer) {
          sock.peers[peer.addr + ':' + peer.port] = peer;
        },removePeer:function (sock, peer) {
          delete sock.peers[peer.addr + ':' + peer.port];
        },handlePeerEvents:function (sock, peer) {
          var first = true;
          var handleOpen = function () {
            try {
              var queued = peer.dgram_send_queue.shift();
              while (queued) {
                peer.socket.send(queued);
                queued = peer.dgram_send_queue.shift();
              }
            } catch (e) {
              // not much we can do here in the way of proper error handling as we've already
              // lied and said this data was sent. shut it down.
              peer.socket.close();
            }
          };
          function handleMessage(data) {
            assert(typeof data !== 'string' && data.byteLength !== undefined);  // must receive an ArrayBuffer
            data = new Uint8Array(data);  // make a typed array view on the array buffer
            // if this is the port message, override the peer's port with it
            var wasfirst = first;
            first = false;
            if (wasfirst &&
                data.length === 10 &&
                data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255 &&
                data[4] === 'p'.charCodeAt(0) && data[5] === 'o'.charCodeAt(0) && data[6] === 'r'.charCodeAt(0) && data[7] === 't'.charCodeAt(0)) {
              // update the peer's port and it's key in the peer map
              var newport = ((data[8] << 8) | data[9]);
              SOCKFS.websocket_sock_ops.removePeer(sock, peer);
              peer.port = newport;
              SOCKFS.websocket_sock_ops.addPeer(sock, peer);
              return;
            }
            sock.recv_queue.push({ addr: peer.addr, port: peer.port, data: data });
          };
          if (ENVIRONMENT_IS_NODE) {
            peer.socket.on('open', handleOpen);
            peer.socket.on('message', function(data, flags) {
              if (!flags.binary) {
                return;
              }
              handleMessage((new Uint8Array(data)).buffer);  // copy from node Buffer -> ArrayBuffer
            });
            peer.socket.on('error', function() {
              // don't throw
            });
          } else {
            peer.socket.onopen = handleOpen;
            peer.socket.onmessage = function peer_socket_onmessage(event) {
              handleMessage(event.data);
            };
          }
        },poll:function (sock) {
          if (sock.type === 1 && sock.server) {
            // listen sockets should only say they're available for reading
            // if there are pending clients.
            return sock.pending.length ? (64 | 1) : 0;
          }
          var mask = 0;
          var dest = sock.type === 1 ?  // we only care about the socket state for connection-based sockets
            SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport) :
            null;
          if (sock.recv_queue.length ||
              !dest ||  // connection-less sockets are always ready to read
              (dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {  // let recv return 0 once closed
            mask |= (64 | 1);
          }
          if (!dest ||  // connection-less sockets are always ready to write
              (dest && dest.socket.readyState === dest.socket.OPEN)) {
            mask |= 4;
          }
          if ((dest && dest.socket.readyState === dest.socket.CLOSING) ||
              (dest && dest.socket.readyState === dest.socket.CLOSED)) {
            mask |= 16;
          }
          return mask;
        },ioctl:function (sock, request, arg) {
          switch (request) {
            case 21531:
              var bytes = 0;
              if (sock.recv_queue.length) {
                bytes = sock.recv_queue[0].data.length;
              }
              HEAP32[((arg)>>2)]=bytes;
              return 0;
            default:
              return ERRNO_CODES.EINVAL;
          }
        },close:function (sock) {
          // if we've spawned a listen server, close it
          if (sock.server) {
            try {
              sock.server.close();
            } catch (e) {
            }
            sock.server = null;
          }
          // close any peer connections
          var peers = Object.keys(sock.peers);
          for (var i = 0; i < peers.length; i++) {
            var peer = sock.peers[peers[i]];
            try {
              peer.socket.close();
            } catch (e) {
            }
            SOCKFS.websocket_sock_ops.removePeer(sock, peer);
          }
          return 0;
        },bind:function (sock, addr, port) {
          if (typeof sock.saddr !== 'undefined' || typeof sock.sport !== 'undefined') {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already bound
          }
          sock.saddr = addr;
          sock.sport = port || _mkport();
          // in order to emulate dgram sockets, we need to launch a listen server when
          // binding on a connection-less socket
          // note: this is only required on the server side
          if (sock.type === 2) {
            // close the existing server if it exists
            if (sock.server) {
              sock.server.close();
              sock.server = null;
            }
            // swallow error operation not supported error that occurs when binding in the
            // browser where this isn't supported
            try {
              sock.sock_ops.listen(sock, 0);
            } catch (e) {
              if (!(e instanceof FS.ErrnoError)) throw e;
              if (e.errno !== ERRNO_CODES.EOPNOTSUPP) throw e;
            }
          }
        },connect:function (sock, addr, port) {
          if (sock.server) {
            throw new FS.ErrnoError(ERRNO_CODS.EOPNOTSUPP);
          }
          // TODO autobind
          // if (!sock.addr && sock.type == 2) {
          // }
          // early out if we're already connected / in the middle of connecting
          if (typeof sock.daddr !== 'undefined' && typeof sock.dport !== 'undefined') {
            var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
            if (dest) {
              if (dest.socket.readyState === dest.socket.CONNECTING) {
                throw new FS.ErrnoError(ERRNO_CODES.EALREADY);
              } else {
                throw new FS.ErrnoError(ERRNO_CODES.EISCONN);
              }
            }
          }
          // add the socket to our peer list and set our
          // destination address / port to match
          var peer = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
          sock.daddr = peer.addr;
          sock.dport = peer.port;
          // always "fail" in non-blocking mode
          throw new FS.ErrnoError(ERRNO_CODES.EINPROGRESS);
        },listen:function (sock, backlog) {
          if (!ENVIRONMENT_IS_NODE) {
            throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
          }
          if (sock.server) {
             throw new FS.ErrnoError(ERRNO_CODES.EINVAL);  // already listening
          }
          var WebSocketServer = require('ws').Server;
          var host = sock.saddr;
          sock.server = new WebSocketServer({
            host: host,
            port: sock.sport
            // TODO support backlog
          });
          sock.server.on('connection', function(ws) {
            if (sock.type === 1) {
              var newsock = SOCKFS.createSocket(sock.family, sock.type, sock.protocol);
              // create a peer on the new socket
              var peer = SOCKFS.websocket_sock_ops.createPeer(newsock, ws);
              newsock.daddr = peer.addr;
              newsock.dport = peer.port;
              // push to queue for accept to pick up
              sock.pending.push(newsock);
            } else {
              // create a peer on the listen socket so calling sendto
              // with the listen socket and an address will resolve
              // to the correct client
              SOCKFS.websocket_sock_ops.createPeer(sock, ws);
            }
          });
          sock.server.on('closed', function() {
            sock.server = null;
          });
          sock.server.on('error', function() {
            // don't throw
          });
        },accept:function (listensock) {
          if (!listensock.server) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          var newsock = listensock.pending.shift();
          newsock.stream.flags = listensock.stream.flags;
          return newsock;
        },getname:function (sock, peer) {
          var addr, port;
          if (peer) {
            if (sock.daddr === undefined || sock.dport === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            }
            addr = sock.daddr;
            port = sock.dport;
          } else {
            // TODO saddr and sport will be set for bind()'d UDP sockets, but what
            // should we be returning for TCP sockets that've been connect()'d?
            addr = sock.saddr || 0;
            port = sock.sport || 0;
          }
          return { addr: addr, port: port };
        },sendmsg:function (sock, buffer, offset, length, addr, port) {
          if (sock.type === 2) {
            // connection-less sockets will honor the message address,
            // and otherwise fall back to the bound destination address
            if (addr === undefined || port === undefined) {
              addr = sock.daddr;
              port = sock.dport;
            }
            // if there was no address to fall back to, error out
            if (addr === undefined || port === undefined) {
              throw new FS.ErrnoError(ERRNO_CODES.EDESTADDRREQ);
            }
          } else {
            // connection-based sockets will only use the bound
            addr = sock.daddr;
            port = sock.dport;
          }
          // find the peer for the destination address
          var dest = SOCKFS.websocket_sock_ops.getPeer(sock, addr, port);
          // early out if not connected with a connection-based socket
          if (sock.type === 1) {
            if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
            } else if (dest.socket.readyState === dest.socket.CONNECTING) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // create a copy of the incoming data to send, as the WebSocket API
          // doesn't work entirely with an ArrayBufferView, it'll just send
          // the entire underlying buffer
          var data;
          if (buffer instanceof Array || buffer instanceof ArrayBuffer) {
            data = buffer.slice(offset, offset + length);
          } else {  // ArrayBufferView
            data = buffer.buffer.slice(buffer.byteOffset + offset, buffer.byteOffset + offset + length);
          }
          // if we're emulating a connection-less dgram socket and don't have
          // a cached connection, queue the buffer to send upon connect and
          // lie, saying the data was sent now.
          if (sock.type === 2) {
            if (!dest || dest.socket.readyState !== dest.socket.OPEN) {
              // if we're not connected, open a new connection
              if (!dest || dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                dest = SOCKFS.websocket_sock_ops.createPeer(sock, addr, port);
              }
              dest.dgram_send_queue.push(data);
              return length;
            }
          }
          try {
            // send the actual data
            dest.socket.send(data);
            return length;
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
        },recvmsg:function (sock, length) {
          // http://pubs.opengroup.org/onlinepubs/7908799/xns/recvmsg.html
          if (sock.type === 1 && sock.server) {
            // tcp servers should not be recv()'ing on the listen socket
            throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
          }
          var queued = sock.recv_queue.shift();
          if (!queued) {
            if (sock.type === 1) {
              var dest = SOCKFS.websocket_sock_ops.getPeer(sock, sock.daddr, sock.dport);
              if (!dest) {
                // if we have a destination address but are not connected, error out
                throw new FS.ErrnoError(ERRNO_CODES.ENOTCONN);
              }
              else if (dest.socket.readyState === dest.socket.CLOSING || dest.socket.readyState === dest.socket.CLOSED) {
                // return null if the socket has closed
                return null;
              }
              else {
                // else, our socket is in a valid state but truly has nothing available
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
            } else {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
          }
          // queued.data will be an ArrayBuffer if it's unadulterated, but if it's
          // requeued TCP data it'll be an ArrayBufferView
          var queuedLength = queued.data.byteLength || queued.data.length;
          var queuedOffset = queued.data.byteOffset || 0;
          var queuedBuffer = queued.data.buffer || queued.data;
          var bytesRead = Math.min(length, queuedLength);
          var res = {
            buffer: new Uint8Array(queuedBuffer, queuedOffset, bytesRead),
            addr: queued.addr,
            port: queued.port
          };
          // push back any unread data for TCP connections
          if (sock.type === 1 && bytesRead < queuedLength) {
            var bytesRemaining = queuedLength - bytesRead;
            queued.data = new Uint8Array(queuedBuffer, queuedOffset + bytesRead, bytesRemaining);
            sock.recv_queue.unshift(queued);
          }
          return res;
        }}};function _send(fd, buf, len, flags) {
      var sock = SOCKFS.getSocket(fd);
      if (!sock) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      // TODO honor flags
      return _write(fd, buf, len);
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte, offset);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.getStream(fildes);
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      try {
        var slab = HEAP8;
        return FS.write(stream, slab, buf, nbyte);
      } catch (e) {
        FS.handleFSError(e);
        return -1;
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        var streamObj = FS.getStream(stream);
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }
  var _environ=allocate(1, "i32*", ALLOC_STATIC);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function __getFloat(text) {
      return /^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?/.exec(text);
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[11] = 1;
        __scanString.whiteSpace[12] = 1;
        __scanString.whiteSpace[13] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function get() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function unget() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        if (format[formatIndex] === '%') {
          var nextC = format.indexOf('c', formatIndex+1);
          if (nextC > 0) {
            var maxx = 1;
            if (nextC > formatIndex+1) {
              var sub = format.substring(formatIndex+1, nextC);
              maxx = parseInt(sub);
              if (maxx != sub) maxx = 0;
            }
            if (maxx) {
              var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
              argIndex += Runtime.getAlignSize('void*', null, true);
              fields++;
              for (var i = 0; i < maxx; i++) {
                next = get();
                HEAP8[((argPtr++)|0)]=next;
              }
              formatIndex += nextC - formatIndex + 1;
              continue;
            }
          }
        }
        // handle %[...]
        if (format[formatIndex] === '%' && format.indexOf('[', formatIndex+1) > 0) {
          var match = /\%([0-9]*)\[(\^)?(\]?[^\]]*)\]/.exec(format.substring(formatIndex));
          if (match) {
            var maxNumCharacters = parseInt(match[1]) || Infinity;
            var negateScanList = (match[2] === '^');
            var scanList = match[3];
            // expand "middle" dashs into character sets
            var middleDashMatch;
            while ((middleDashMatch = /([^\-])\-([^\-])/.exec(scanList))) {
              var rangeStartCharCode = middleDashMatch[1].charCodeAt(0);
              var rangeEndCharCode = middleDashMatch[2].charCodeAt(0);
              for (var expanded = ''; rangeStartCharCode <= rangeEndCharCode; expanded += String.fromCharCode(rangeStartCharCode++));
              scanList = scanList.replace(middleDashMatch[1] + '-' + middleDashMatch[2], expanded);
            }
            var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
            argIndex += Runtime.getAlignSize('void*', null, true);
            fields++;
            for (var i = 0; i < maxNumCharacters; i++) {
              next = get();
              if (negateScanList) {
                if (scanList.indexOf(String.fromCharCode(next)) < 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              } else {
                if (scanList.indexOf(String.fromCharCode(next)) >= 0) {
                  HEAP8[((argPtr++)|0)]=next;
                } else {
                  unget();
                  break;
                }
              }
            }
            // write out null-terminating character
            HEAP8[((argPtr++)|0)]=0;
            formatIndex += match[0].length;
            continue;
          }
        }      
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if (format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' ||
              type == 'F' || type == 'E' || type == 'G') {
            next = get();
            while (next > 0 && (!(next in __scanString.whiteSpace)))  {
              buffer.push(String.fromCharCode(next));
              next = get();
            }
            var m = __getFloat(buffer.join(''));
            var last = m ? m[0].length : 0;
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            // Strip the optional 0x prefix for %x.
            if ((type == 'x' || type == 'X') && (next == 48)) {
              var peek = get();
              if (peek == 120 || peek == 88) {
                next = get();
              } else {
                unget();
              }
            }
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   ((type === 'x' || type === 'X') && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getAlignSize('void*', null, true);
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if (longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,(tempDouble=parseInt(text, 10),(+(Math_abs(tempDouble))) >= (+1) ? (tempDouble > (+0) ? ((Math_min((+(Math_floor((tempDouble)/(+4294967296)))), (+4294967295)))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/(+4294967296))))))>>>0) : 0)],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'X':
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'F':
            case 'f':
            case 'E':
            case 'e':
            case 'G':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                HEAPF64[((argPtr)>>3)]=parseFloat(text)
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex].charCodeAt(0) in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      function get() { return HEAP8[(((s)+(index++))|0)]; };
      function unget() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _abort() {
      Module['abort']();
    }
  function ___errno_location() {
      return ___errno_state;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 79:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        var ctx;
        try {
          if (useWebGL) {
            var contextAttributes = {
              antialias: false,
              alpha: false
            };
            if (webGLContextAttributes) {
              for (var attribute in webGLContextAttributes) {
                contextAttributes[attribute] = webGLContextAttributes[attribute];
              }
            }
            var errorInfo = '?';
            function onContextCreationError(event) {
              errorInfo = event.statusMessage || errorInfo;
            }
            canvas.addEventListener('webglcontextcreationerror', onContextCreationError, false);
            try {
              ['experimental-webgl', 'webgl'].some(function(webglId) {
                return ctx = canvas.getContext(webglId, contextAttributes);
              });
            } finally {
              canvas.removeEventListener('webglcontextcreationerror', onContextCreationError, false);
            }
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas: ' + [errorInfo, e]);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          setTimeout(func, 1000/60);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           window['setTimeout'];
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x, y;
          if (event.type == 'touchstart' ||
              event.type == 'touchend' ||
              event.type == 'touchmove') {
            var t = event.touches.item(0);
            if (t) {
              x = t.pageX - (window.scrollX + rect.left);
              y = t.pageY - (window.scrollY + rect.top);
            } else {
              return;
            }
          } else {
            x = event.pageX - (window.scrollX + rect.left);
            y = event.pageY - (window.scrollY + rect.top);
          }
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
FS.staticInit();__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
__ATINIT__.unshift({ func: function() { TTY.init() } });__ATEXIT__.push({ func: function() { TTY.shutdown() } });TTY.utf8 = new Runtime.UTF8Processor();
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); NODEFS.staticInit(); }
__ATINIT__.push({ func: function() { SOCKFS.root = FS.mount(SOCKFS, {}, null); } });
___buildEnvironment(ENV);
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 4096;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var Math_min = Math.min;
function invoke_viiiii(index,a1,a2,a3,a4,a5) {
  try {
    Module["dynCall_viiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiiiiii(index,a1,a2,a3,a4,a5,a6,a7) {
  try {
    Module["dynCall_viiiiiii"](index,a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vii(index,a1,a2) {
  try {
    Module["dynCall_vii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiiii(index,a1,a2,a3,a4,a5,a6) {
  try {
    return Module["dynCall_iiiiiii"](index,a1,a2,a3,a4,a5,a6);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viii(index,a1,a2,a3) {
  try {
    Module["dynCall_viii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiii(index,a1,a2,a3,a4) {
  try {
    return Module["dynCall_iiiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iiiiii(index,a1,a2,a3,a4,a5) {
  try {
    return Module["dynCall_iiiiii"](index,a1,a2,a3,a4,a5);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_viiii(index,a1,a2,a3,a4) {
  try {
    Module["dynCall_viiii"](index,a1,a2,a3,a4);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env._stderr|0;var n=env._jpeg_aritab|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.min;var af=env.invoke_viiiii;var ag=env.invoke_viiiiiii;var ah=env.invoke_vi;var ai=env.invoke_vii;var aj=env.invoke_iiiiiii;var ak=env.invoke_iiii;var al=env.invoke_ii;var am=env.invoke_viii;var an=env.invoke_v;var ao=env.invoke_iiiii;var ap=env.invoke_iii;var aq=env.invoke_iiiiii;var ar=env.invoke_viiii;var as=env._sscanf;var at=env._snprintf;var au=env.__scanString;var av=env.__getFloat;var aw=env._abort;var ax=env._fprintf;var ay=env._fflush;var az=env.___buildEnvironment;var aA=env.__reallyNegative;var aB=env._sysconf;var aC=env.___setErrNo;var aD=env._fwrite;var aE=env._send;var aF=env._write;var aG=env._exit;var aH=env._sprintf;var aI=env._jswrite;var aJ=env.__formatString;var aK=env._getenv;var aL=env._pwrite;var aM=env._sbrk;var aN=env.___errno_location;var aO=env._time;var aP=env.__exit;var aQ=0.0;
// EMSCRIPTEN_START_FUNCS
function a2(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7&-8;return b|0}function a3(){return i|0}function a4(a){a=a|0;i=a}function a5(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function a6(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function a7(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function a8(a){a=a|0;D=a}function a9(a){a=a|0;E=a}function ba(a){a=a|0;F=a}function bb(a){a=a|0;G=a}function bc(a){a=a|0;H=a}function bd(a){a=a|0;I=a}function be(a){a=a|0;J=a}function bf(a){a=a|0;K=a}function bg(a){a=a|0;L=a}function bh(a){a=a|0;M=a}function bi(){}function bj(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=b;b=d;c[e+4>>2]=0;if((a|0)!=80){c[(c[e>>2]|0)+20>>2]=13;c[(c[e>>2]|0)+24>>2]=80;c[(c[e>>2]|0)+28>>2]=a;aT[c[c[e>>2]>>2]&63](e)}if((b|0)!=432){c[(c[e>>2]|0)+20>>2]=22;c[(c[e>>2]|0)+24>>2]=432;c[(c[e>>2]|0)+28>>2]=b;aT[c[c[e>>2]>>2]&63](e)}b=c[e>>2]|0;a=c[e+12>>2]|0;d=e;eq(d|0,0,432)|0;c[e>>2]=b;c[e+12>>2]=a;c[e+16>>2]=0;dY(e);c[e+8>>2]=0;c[e+24>>2]=0;c[e+84>>2]=0;a=0;while(1){if((a|0)>=4){break}c[e+88+(a<<2)>>2]=0;c[e+104+(a<<2)>>2]=100;a=a+1|0}a=0;while(1){if((a|0)>=4){break}c[e+120+(a<<2)>>2]=0;c[e+136+(a<<2)>>2]=0;a=a+1|0}c[e+376>>2]=8;c[e+380>>2]=2640;c[e+384>>2]=63;c[e+424>>2]=0;h[e+48>>3]=1.0;c[e+20>>2]=100;return}function bk(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;b=0;while(1){if((b|0)>=4){break}e=c[d+88+(b<<2)>>2]|0;if((e|0)!=0){c[e+128>>2]=a}b=b+1|0}b=0;while(1){if((b|0)>=4){break}e=c[d+120+(b<<2)>>2]|0;f=e;if((e|0)!=0){c[f+276>>2]=a}e=c[d+136+(b<<2)>>2]|0;f=e;if((e|0)!=0){c[f+276>>2]=a}b=b+1|0}return}function bl(a){a=a|0;var b=0,d=0;b=a;do{if((c[b+20>>2]|0)==101){d=31}else{if((c[b+20>>2]|0)==102){d=31;break}if((c[b+20>>2]|0)!=103){c[(c[b>>2]|0)+20>>2]=21;c[(c[b>>2]|0)+24>>2]=c[b+20>>2];aT[c[c[b>>2]>>2]&63](b)}}}while(0);if((d|0)==31){if((c[b+260>>2]|0)>>>0<(c[b+32>>2]|0)>>>0){c[(c[b>>2]|0)+20>>2]=69;aT[c[c[b>>2]>>2]&63](b)}aT[c[(c[b+388>>2]|0)+8>>2]&63](b)}while(1){if(!((c[(c[b+388>>2]|0)+16>>2]|0)!=0^1)){break}aT[c[c[b+388>>2]>>2]&63](b);d=0;while(1){if(d>>>0>=(c[b+284>>2]|0)>>>0){break}if((c[b+8>>2]|0)!=0){c[(c[b+8>>2]|0)+4>>2]=d;c[(c[b+8>>2]|0)+8>>2]=c[b+284>>2];aT[c[c[b+8>>2]>>2]&63](b)}if((a$[c[(c[b+400>>2]|0)+4>>2]&31](b,0)|0)==0){c[(c[b>>2]|0)+20>>2]=25;aT[c[c[b>>2]>>2]&63](b)}d=d+1|0}aT[c[(c[b+388>>2]|0)+8>>2]&63](b)}aT[c[(c[b+404>>2]|0)+12>>2]&63](b);aT[c[(c[b+24>>2]|0)+16>>2]&63](b);cP(b);return}function bm(a,b){a=a|0;b=b|0;var d=0;d=a;if((c[d+20>>2]|0)!=100){c[(c[d>>2]|0)+20>>2]=21;c[(c[d>>2]|0)+24>>2]=c[d+20>>2];aT[c[c[d>>2]>>2]&63](d)}if((b|0)!=0){bk(d,0)}aT[c[(c[d>>2]|0)+16>>2]&63](d);aT[c[(c[d+24>>2]|0)+8>>2]&63](d);cg(d);aT[c[c[d+388>>2]>>2]&63](d);c[d+260>>2]=0;c[d+20>>2]=(c[d+208>>2]|0)!=0?102:101;return}function bn(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;e=i;i=i+8|0;f=e|0;g=a;a=b;b=d;if((c[g+20>>2]|0)!=101){c[(c[g>>2]|0)+20>>2]=21;c[(c[g>>2]|0)+24>>2]=c[g+20>>2];aT[c[c[g>>2]>>2]&63](g)}if((c[g+260>>2]|0)>>>0>=(c[g+32>>2]|0)>>>0){c[(c[g>>2]|0)+20>>2]=126;aU[c[(c[g>>2]|0)+4>>2]&31](g,-1)}if((c[g+8>>2]|0)!=0){c[(c[g+8>>2]|0)+4>>2]=c[g+260>>2];c[(c[g+8>>2]|0)+8>>2]=c[g+32>>2];aT[c[c[g+8>>2]>>2]&63](g)}if((c[(c[g+388>>2]|0)+12>>2]|0)!=0){aT[c[(c[g+388>>2]|0)+4>>2]&63](g)}d=(c[g+32>>2]|0)-(c[g+260>>2]|0)|0;if(b>>>0<=d>>>0){c[f>>2]=0;h=g;j=h+392|0;k=c[j>>2]|0;l=k+4|0;m=c[l>>2]|0;n=g;o=a;p=b;a1[m&15](n,o,f,p);q=c[f>>2]|0;r=g;s=r+260|0;t=c[s>>2]|0;u=t+q|0;c[s>>2]=u;v=c[f>>2]|0;i=e;return v|0}b=d;c[f>>2]=0;h=g;j=h+392|0;k=c[j>>2]|0;l=k+4|0;m=c[l>>2]|0;n=g;o=a;p=b;a1[m&15](n,o,f,p);q=c[f>>2]|0;r=g;s=r+260|0;t=c[s>>2]|0;u=t+q|0;c[s>>2]=u;v=c[f>>2]|0;i=e;return v|0}function bo(b){b=b|0;var d=0;d=b;b=aW[c[c[d+4>>2]>>2]&7](d,1,208)|0;c[d+420>>2]=b;c[b>>2]=18;c[b+8>>2]=34;d=0;while(1){if((d|0)>=16){break}c[b+76+(d<<2)>>2]=0;c[b+140+(d<<2)>>2]=0;d=d+1|0}a[b+204|0]=113;return}function bp(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=c[d+420>>2]|0;if((b|0)!=0){c[(c[d>>2]|0)+20>>2]=49;aT[c[c[d>>2]>>2]&63](d)}if((c[d+264>>2]|0)!=0){if((c[d+368>>2]|0)==0){if((c[d+360>>2]|0)==0){c[a+4>>2]=8}else{c[a+4>>2]=28}}else{if((c[d+360>>2]|0)==0){c[a+4>>2]=6}else{c[a+4>>2]=18}}}else{c[a+4>>2]=16}b=0;while(1){if((b|0)>=(c[d+288>>2]|0)){break}e=c[d+292+(b<<2)>>2]|0;do{if((c[d+360>>2]|0)==0){if((c[d+368>>2]|0)!=0){break}f=c[e+20>>2]|0;if((f|0)<0){g=92}else{if((f|0)>=16){g=92}}if((g|0)==92){g=0;c[(c[d>>2]|0)+20>>2]=50;c[(c[d>>2]|0)+24>>2]=f;aT[c[c[d>>2]>>2]&63](d)}if((c[a+76+(f<<2)>>2]|0)==0){c[a+76+(f<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,64)|0}h=c[a+76+(f<<2)>>2]|0;eq(h|0,0,64)|0;c[a+36+(b<<2)>>2]=0;c[a+52+(b<<2)>>2]=0}}while(0);if((c[d+364>>2]|0)!=0){f=c[e+24>>2]|0;if((f|0)<0){g=99}else{if((f|0)>=16){g=99}}if((g|0)==99){g=0;c[(c[d>>2]|0)+20>>2]=50;c[(c[d>>2]|0)+24>>2]=f;aT[c[c[d>>2]>>2]&63](d)}if((c[a+140+(f<<2)>>2]|0)==0){c[a+140+(f<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,256)|0}h=c[a+140+(f<<2)>>2]|0;eq(h|0,0,256)|0}b=b+1|0}c[a+12>>2]=0;c[a+16>>2]=65536;c[a+20>>2]=0;c[a+24>>2]=0;c[a+28>>2]=11;c[a+32>>2]=-1;c[a+68>>2]=c[d+236>>2];c[a+72>>2]=0;return}function bq(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+420>>2]|0;d=(c[a+16>>2]|0)-1+(c[a+12>>2]|0)&-65536;e=d;if((d|0)<(c[a+12>>2]|0)){c[a+12>>2]=e+32768}else{c[a+12>>2]=e}e=a+12|0;c[e>>2]=c[e>>2]<<c[a+28>>2];if((c[a+12>>2]&-134217728|0)!=0){if((c[a+32>>2]|0)>=0){if((c[a+24>>2]|0)!=0){do{br(0,b);e=a+24|0;d=(c[e>>2]|0)-1|0;c[e>>2]=d;}while((d|0)!=0)}br((c[a+32>>2]|0)+1|0,b);if(((c[a+32>>2]|0)+1|0)==255){br(0,b)}}d=a+24|0;c[d>>2]=(c[d>>2]|0)+(c[a+20>>2]|0);c[a+20>>2]=0}else{if((c[a+32>>2]|0)==0){d=a+24|0;c[d>>2]=(c[d>>2]|0)+1}else{if((c[a+32>>2]|0)>=0){if((c[a+24>>2]|0)!=0){do{br(0,b);d=a+24|0;e=(c[d>>2]|0)-1|0;c[d>>2]=e;}while((e|0)!=0)}br(c[a+32>>2]|0,b)}}if((c[a+20>>2]|0)!=0){if((c[a+24>>2]|0)!=0){do{br(0,b);e=a+24|0;d=(c[e>>2]|0)-1|0;c[e>>2]=d;}while((d|0)!=0)}do{br(255,b);br(0,b);d=a+20|0;e=(c[d>>2]|0)-1|0;c[d>>2]=e;}while((e|0)!=0)}}if((c[a+12>>2]&134215680|0)==0){return}if((c[a+24>>2]|0)!=0){do{br(0,b);e=a+24|0;d=(c[e>>2]|0)-1|0;c[e>>2]=d;}while((d|0)!=0)}br(c[a+12>>2]>>19&255,b);if((c[a+12>>2]>>19&255|0)==255){br(0,b)}if((c[a+12>>2]&522240|0)!=0){br(c[a+12>>2]>>11&255,b);if((c[a+12>>2]>>11&255|0)==255){br(0,b)}}return}function br(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=d;d=c[e+24>>2]|0;f=d|0;g=c[f>>2]|0;c[f>>2]=g+1;a[g]=b&255;b=d+4|0;g=(c[b>>2]|0)-1|0;c[b>>2]=g;if((g|0)!=0){return}if((aX[c[d+12>>2]&3](e)|0)==0){c[(c[e>>2]|0)+20>>2]=25;aT[c[c[e>>2]>>2]&63](e)}return}function bs(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=e;e=c[f+420>>2]|0;if((c[f+236>>2]|0)!=0){if((c[e+68>>2]|0)==0){bx(f,c[e+72>>2]|0);c[e+68>>2]=c[f+236>>2];g=e+72|0;c[g>>2]=(c[g>>2]|0)+1;g=e+72|0;c[g>>2]=c[g>>2]&7}g=e+68|0;c[g>>2]=(c[g>>2]|0)-1}g=0;while(1){if((g|0)>=(c[f+316>>2]|0)){break}h=c[f+320+(g<<2)>>2]|0;i=c[(c[f+292+(h<<2)>>2]|0)+20>>2]|0;j=b[c[a+(g<<2)>>2]>>1]>>c[f+372>>2];k=(c[e+76+(i<<2)>>2]|0)+(c[e+52+(h<<2)>>2]|0)|0;l=j-(c[e+36+(h<<2)>>2]|0)|0;m=l;if((l|0)==0){by(f,k,0);c[e+52+(h<<2)>>2]=0}else{c[e+36+(h<<2)>>2]=j;by(f,k,1);if((m|0)>0){by(f,k+1|0,0);k=k+2|0;c[e+52+(h<<2)>>2]=4}else{m=-m|0;by(f,k+1|0,1);k=k+3|0;c[e+52+(h<<2)>>2]=8}j=0;l=m-1|0;m=l;if((l|0)!=0){by(f,k,1);j=1;l=m;k=(c[e+76+(i<<2)>>2]|0)+20|0;while(1){n=l>>1;l=n;if((n|0)==0){break}by(f,k,1);j=j<<1;k=k+1|0}}by(f,k,0);if((j|0)<(1<<d[f+152+i|0]>>1|0)){c[e+52+(h<<2)>>2]=0}else{if((j|0)>(1<<d[f+168+i|0]>>1|0)){l=e+52+(h<<2)|0;c[l>>2]=(c[l>>2]|0)+8}}k=k+14|0;while(1){l=j>>1;j=l;if((l|0)==0){break}by(f,k,(j&m|0)!=0?1:0)}}g=g+1|0}return 1}function bt(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=a;a=e;e=c[f+420>>2]|0;if((c[f+236>>2]|0)!=0){if((c[e+68>>2]|0)==0){bx(f,c[e+72>>2]|0);c[e+68>>2]=c[f+236>>2];g=e+72|0;c[g>>2]=(c[g>>2]|0)+1;g=e+72|0;c[g>>2]=c[g>>2]&7}g=e+68|0;c[g>>2]=(c[g>>2]|0)-1}g=c[f+380>>2]|0;h=c[a>>2]|0;a=c[(c[f+292>>2]|0)+24>>2]|0;i=c[f+364>>2]|0;while(1){if((i|0)<=0){break}j=b[h+(c[g+(i<<2)>>2]<<1)>>1]|0;k=j;if((j|0)>=0){j=k>>c[f+372>>2];k=j;if((j|0)!=0){l=200;break}}else{k=-k|0;j=k>>c[f+372>>2];k=j;if((j|0)!=0){l=203;break}}i=i-1|0}j=c[f+360>>2]|0;while(1){if((j|0)>(i|0)){break}m=(c[e+140+(a<<2)>>2]|0)+((j-1|0)*3|0)|0;by(f,m,0);while(1){n=b[h+(c[g+(j<<2)>>2]<<1)>>1]|0;k=n;if((n|0)>=0){n=k>>c[f+372>>2];k=n;if((n|0)!=0){l=212;break}}else{k=-k|0;n=k>>c[f+372>>2];k=n;if((n|0)!=0){l=215;break}}by(f,m+1|0,0);m=m+3|0;j=j+1|0}if((l|0)==212){l=0;by(f,m+1|0,1);by(f,e+204|0,0)}else if((l|0)==215){l=0;by(f,m+1|0,1);by(f,e+204|0,1)}m=m+2|0;n=0;o=k-1|0;k=o;if((o|0)!=0){by(f,m,1);n=1;o=k;p=o>>1;o=p;if((p|0)!=0){by(f,m,1);n=n<<1;m=(c[e+140+(a<<2)>>2]|0)+((j|0)<=(d[f+184+a|0]|0)?189:217)|0;while(1){p=o>>1;o=p;if((p|0)==0){break}by(f,m,1);n=n<<1;m=m+1|0}}}by(f,m,0);m=m+14|0;while(1){o=n>>1;n=o;if((o|0)==0){break}by(f,m,(n&k|0)!=0?1:0)}j=j+1|0}if((j|0)>(c[f+364>>2]|0)){return 1}m=(c[e+140+(a<<2)>>2]|0)+((j-1|0)*3|0)|0;by(f,m,1);return 1}function bu(a,d){a=a|0;d=d|0;var e=0,f=0,g=0;e=a;a=d;d=c[e+420>>2]|0;if((c[e+236>>2]|0)!=0){if((c[d+68>>2]|0)==0){bx(e,c[d+72>>2]|0);c[d+68>>2]=c[e+236>>2];f=d+72|0;c[f>>2]=(c[f>>2]|0)+1;f=d+72|0;c[f>>2]=c[f>>2]&7}f=d+68|0;c[f>>2]=(c[f>>2]|0)-1}f=d+204|0;d=c[e+372>>2]|0;g=0;while(1){if((g|0)>=(c[e+316>>2]|0)){break}by(e,f,b[c[a+(g<<2)>>2]>>1]>>d&1);g=g+1|0}return 1}function bv(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;e=a;a=d;d=c[e+420>>2]|0;if((c[e+236>>2]|0)!=0){if((c[d+68>>2]|0)==0){bx(e,c[d+72>>2]|0);c[d+68>>2]=c[e+236>>2];f=d+72|0;c[f>>2]=(c[f>>2]|0)+1;f=d+72|0;c[f>>2]=c[f>>2]&7}f=d+68|0;c[f>>2]=(c[f>>2]|0)-1}f=c[e+380>>2]|0;g=c[a>>2]|0;a=c[(c[e+292>>2]|0)+24>>2]|0;h=c[e+364>>2]|0;while(1){if((h|0)<=0){break}i=b[g+(c[f+(h<<2)>>2]<<1)>>1]|0;j=i;if((i|0)>=0){i=j>>c[e+372>>2];j=i;if((i|0)!=0){k=252;break}}else{j=-j|0;i=j>>c[e+372>>2];j=i;if((i|0)!=0){k=255;break}}h=h-1|0}i=h;while(1){if((i|0)<=0){break}l=b[g+(c[f+(i<<2)>>2]<<1)>>1]|0;j=l;if((l|0)>=0){l=j>>c[e+368>>2];j=l;if((l|0)!=0){k=263;break}}else{j=-j|0;l=j>>c[e+368>>2];j=l;if((l|0)!=0){k=266;break}}i=i-1|0}l=c[e+360>>2]|0;while(1){if((l|0)>(h|0)){break}m=(c[d+140+(a<<2)>>2]|0)+((l-1|0)*3|0)|0;if((l|0)>(i|0)){by(e,m,0)}while(1){n=b[g+(c[f+(l<<2)>>2]<<1)>>1]|0;j=n;if((n|0)>=0){n=j>>c[e+372>>2];j=n;if((n|0)!=0){k=277;break}}else{j=-j|0;n=j>>c[e+372>>2];j=n;if((n|0)!=0){k=283;break}}by(e,m+1|0,0);m=m+3|0;l=l+1|0}if((k|0)==277){k=0;if((j>>1|0)!=0){by(e,m+2|0,j&1)}else{by(e,m+1|0,1);by(e,d+204|0,0)}}else if((k|0)==283){k=0;if((j>>1|0)!=0){by(e,m+2|0,j&1)}else{by(e,m+1|0,1);by(e,d+204|0,1)}}l=l+1|0}if((l|0)>(c[e+364>>2]|0)){return 1}m=(c[d+140+(a<<2)>>2]|0)+((l-1|0)*3|0)|0;by(e,m,1);return 1}function bw(a,e){a=a|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=a;a=e;e=c[f+420>>2]|0;if((c[f+236>>2]|0)!=0){if((c[e+68>>2]|0)==0){bx(f,c[e+72>>2]|0);c[e+68>>2]=c[f+236>>2];g=e+72|0;c[g>>2]=(c[g>>2]|0)+1;g=e+72|0;c[g>>2]=c[g>>2]&7}g=e+68|0;c[g>>2]=(c[g>>2]|0)-1}g=c[f+380>>2]|0;h=0;while(1){if((h|0)>=(c[f+316>>2]|0)){break}i=c[a+(h<<2)>>2]|0;j=c[f+320+(h<<2)>>2]|0;k=c[f+292+(j<<2)>>2]|0;l=c[k+20>>2]|0;m=(c[e+76+(l<<2)>>2]|0)+(c[e+52+(j<<2)>>2]|0)|0;n=(b[i>>1]|0)-(c[e+36+(j<<2)>>2]|0)|0;o=n;if((n|0)==0){by(f,m,0);c[e+52+(j<<2)>>2]=0}else{c[e+36+(j<<2)>>2]=b[i>>1]|0;by(f,m,1);if((o|0)>0){by(f,m+1|0,0);m=m+2|0;c[e+52+(j<<2)>>2]=4}else{o=-o|0;by(f,m+1|0,1);m=m+3|0;c[e+52+(j<<2)>>2]=8}p=0;n=o-1|0;o=n;if((n|0)!=0){by(f,m,1);p=1;q=o;m=(c[e+76+(l<<2)>>2]|0)+20|0;while(1){n=q>>1;q=n;if((n|0)==0){break}by(f,m,1);p=p<<1;m=m+1|0}}by(f,m,0);if((p|0)<(1<<d[f+152+l|0]>>1|0)){c[e+52+(j<<2)>>2]=0}else{if((p|0)>(1<<d[f+168+l|0]>>1|0)){n=e+52+(j<<2)|0;c[n>>2]=(c[n>>2]|0)+8}}m=m+14|0;while(1){n=p>>1;p=n;if((n|0)==0){break}by(f,m,(p&o|0)!=0?1:0)}}j=c[f+384>>2]|0;n=j;if((j|0)!=0){l=c[k+24>>2]|0;do{if((b[i+(c[g+(n<<2)>>2]<<1)>>1]|0)!=0){r=325;break}j=n-1|0;n=j;}while((j|0)!=0);if((r|0)==325){r=0}k=0;while(1){if((k|0)>=(n|0)){break}m=(c[e+140+(l<<2)>>2]|0)+(k*3|0)|0;by(f,m,0);while(1){j=k+1|0;k=j;s=b[i+(c[g+(j<<2)>>2]<<1)>>1]|0;o=s;if((s|0)!=0){break}by(f,m+1|0,0);m=m+3|0}by(f,m+1|0,1);if((o|0)>0){by(f,e+204|0,0)}else{o=-o|0;by(f,e+204|0,1)}m=m+2|0;p=0;s=o-1|0;o=s;if((s|0)!=0){by(f,m,1);p=1;q=o;s=q>>1;q=s;if((s|0)!=0){by(f,m,1);p=p<<1;m=(c[e+140+(l<<2)>>2]|0)+((k|0)<=(d[f+184+l|0]|0)?189:217)|0;while(1){s=q>>1;q=s;if((s|0)==0){break}by(f,m,1);p=p<<1;m=m+1|0}}}by(f,m,0);m=m+14|0;while(1){s=p>>1;p=s;if((s|0)==0){break}by(f,m,(p&o|0)!=0?1:0)}}if((k|0)<(c[f+384>>2]|0)){m=(c[e+140+(l<<2)>>2]|0)+(k*3|0)|0;by(f,m,1)}}h=h+1|0}return 1}function bx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=c[d+420>>2]|0;bq(d);br(255,d);br(b+208|0,d);b=0;while(1){if((b|0)>=(c[d+288>>2]|0)){break}e=c[d+292+(b<<2)>>2]|0;do{if((c[d+360>>2]|0)==0){if((c[d+368>>2]|0)!=0){break}f=c[a+76+(c[e+20>>2]<<2)>>2]|0;eq(f|0,0,64)|0;c[a+36+(b<<2)>>2]=0;c[a+52+(b<<2)>>2]=0}}while(0);if((c[d+364>>2]|0)!=0){f=c[a+140+(c[e+24>>2]<<2)>>2]|0;eq(f|0,0,256)|0}b=b+1|0}c[a+12>>2]=0;c[a+16>>2]=65536;c[a+20>>2]=0;c[a+24>>2]=0;c[a+28>>2]=11;c[a+32>>2]=-1;return}function by(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0;g=b;b=e;e=c[g+420>>2]|0;h=d[b]|0;i=n+((h&127)<<2)|0;j=d[i]|d[i+1|0]<<8|d[i+2|0]<<16|d[i+3|0]<<24|0;i=j&255;j=j>>8;k=j&255;j=j>>8;l=e+16|0;c[l>>2]=(c[l>>2]|0)-j;if((f|0)!=(h>>7|0)){if((c[e+16>>2]|0)>=(j|0)){f=e+12|0;c[f>>2]=(c[f>>2]|0)+(c[e+16>>2]|0);c[e+16>>2]=j}a[b]=(h&128^i&255)&255}else{if((c[e+16>>2]|0)>=32768){return}if((c[e+16>>2]|0)<(j|0)){i=e+12|0;c[i>>2]=(c[i>>2]|0)+(c[e+16>>2]|0);c[e+16>>2]=j}a[b]=(h&128^k&255)&255}do{k=e+16|0;c[k>>2]=c[k>>2]<<1;k=e+12|0;c[k>>2]=c[k>>2]<<1;k=e+28|0;h=(c[k>>2]|0)-1|0;c[k>>2]=h;if((h|0)==0){h=c[e+12>>2]>>19;if((h|0)>255){if((c[e+32>>2]|0)>=0){if((c[e+24>>2]|0)!=0){do{br(0,g);k=e+24|0;b=(c[k>>2]|0)-1|0;c[k>>2]=b;}while((b|0)!=0)}br((c[e+32>>2]|0)+1|0,g);if(((c[e+32>>2]|0)+1|0)==255){br(0,g)}}b=e+24|0;c[b>>2]=(c[b>>2]|0)+(c[e+20>>2]|0);c[e+20>>2]=0;c[e+32>>2]=h&255}else{if((h|0)==255){b=e+20|0;c[b>>2]=(c[b>>2]|0)+1}else{if((c[e+32>>2]|0)==0){b=e+24|0;c[b>>2]=(c[b>>2]|0)+1}else{if((c[e+32>>2]|0)>=0){if((c[e+24>>2]|0)!=0){do{br(0,g);b=e+24|0;k=(c[b>>2]|0)-1|0;c[b>>2]=k;}while((k|0)!=0)}br(c[e+32>>2]|0,g)}}if((c[e+20>>2]|0)!=0){if((c[e+24>>2]|0)!=0){do{br(0,g);k=e+24|0;b=(c[k>>2]|0)-1|0;c[k>>2]=b;}while((b|0)!=0)}do{br(255,g);br(0,g);b=e+20|0;k=(c[b>>2]|0)-1|0;c[b>>2]=k;}while((k|0)!=0)}c[e+32>>2]=h&255}}k=e+12|0;c[k>>2]=c[k>>2]&524287;k=e+28|0;c[k>>2]=(c[k>>2]|0)+8}}while((c[e+16>>2]|0)<32768);return}function bz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=aW[c[c[d+4>>2]>>2]&7](d,1,104)|0;c[d+400>>2]=a;c[a>>2]=12;if((b|0)!=0){b=0;e=c[d+84>>2]|0;while(1){if((b|0)>=(c[d+76>>2]|0)){break}f=c[(c[d+4>>2]|0)+20>>2]|0;g=dW(c[e+28>>2]|0,c[e+8>>2]|0)|0;h=dW(c[e+32>>2]|0,c[e+12>>2]|0)|0;c[a+64+(b<<2)>>2]=aV[f&7](d,1,0,g,h,c[e+12>>2]|0)|0;b=b+1|0;e=e+88|0}return}else{e=aW[c[(c[d+4>>2]|0)+4>>2]&7](d,1,1280)|0;d=0;while(1){if((d|0)>=10){break}c[a+24+(d<<2)>>2]=e+(d<<7);d=d+1|0}c[a+64>>2]=0;return}}function bA(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=c[d+400>>2]|0;c[a+8>>2]=0;bB(d);e=b;if((e|0)==0){if((c[a+64>>2]|0)!=0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d)}c[a+4>>2]=4;return}else if((e|0)==3){if((c[a+64>>2]|0)==0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d)}c[a+4>>2]=10;return}else if((e|0)==2){if((c[a+64>>2]|0)==0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d)}c[a+4>>2]=20;return}else{c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d);return}}function bB(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=c[b+400>>2]|0;if((c[b+288>>2]|0)>1){c[a+20>>2]=1;d=a;e=d+12|0;c[e>>2]=0;f=a;g=f+16|0;c[g>>2]=0;return}if((c[a+8>>2]|0)>>>0<((c[b+284>>2]|0)-1|0)>>>0){c[a+20>>2]=c[(c[b+292>>2]|0)+12>>2]}else{c[a+20>>2]=c[(c[b+292>>2]|0)+76>>2]}d=a;e=d+12|0;c[e>>2]=0;f=a;g=f+16|0;c[g>>2]=0;return}function bC(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=a;a=d;d=c[e+400>>2]|0;f=(c[e+308>>2]|0)-1|0;g=(c[e+284>>2]|0)-1|0;h=c[d+16>>2]|0;L601:while(1){if((h|0)>=(c[d+20>>2]|0)){i=488;break}j=c[d+12>>2]|0;while(1){if(j>>>0>f>>>0){break}k=0;l=0;while(1){if((l|0)>=(c[e+288>>2]|0)){break}m=c[e+292+(l<<2)>>2]|0;n=c[(c[e+416>>2]|0)+4+(c[m+4>>2]<<2)>>2]|0;if(j>>>0<f>>>0){o=c[m+56>>2]|0}else{o=c[m+72>>2]|0}p=o;q=$(j,c[m+68>>2]|0)|0;r=$(h,c[m+40>>2]|0)|0;s=0;while(1){if((s|0)>=(c[m+60>>2]|0)){break}do{if((c[d+8>>2]|0)>>>0<g>>>0){i=466}else{if((h+s|0)<(c[m+76>>2]|0)){i=466;break}t=c[d+24+(k<<2)>>2]|0;u=c[m+56>>2]<<7;eq(t|0,0,u|0)|0;v=0;while(1){if((v|0)>=(c[m+56>>2]|0)){break}b[c[d+24+(k+v<<2)>>2]>>1]=b[c[d+24+(k-1<<2)>>2]>>1]|0;v=v+1|0}}}while(0);if((i|0)==466){i=0;aS[n&15](e,m,c[a+(c[m+4>>2]<<2)>>2]|0,c[d+24+(k<<2)>>2]|0,r,q,p);if((p|0)<(c[m+56>>2]|0)){u=c[d+24+(k+p<<2)>>2]|0;t=(c[m+56>>2]|0)-p<<7;eq(u|0,0,t|0)|0;v=p;while(1){if((v|0)>=(c[m+56>>2]|0)){break}b[c[d+24+(k+v<<2)>>2]>>1]=b[c[d+24+(k+v-1<<2)>>2]>>1]|0;v=v+1|0}}}k=k+(c[m+56>>2]|0)|0;r=r+(c[m+40>>2]|0)|0;s=s+1|0}l=l+1|0}if((a$[c[(c[e+420>>2]|0)+4>>2]&31](e,d+24|0)|0)==0){i=483;break L601}j=j+1|0}c[d+12>>2]=0;h=h+1|0}if((i|0)==483){c[d+16>>2]=h;c[d+12>>2]=j;w=0;x=w;return x|0}else if((i|0)==488){i=d+8|0;c[i>>2]=(c[i>>2]|0)+1;bB(e);w=1;x=w;return x|0}return 0}function bD(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;e=a;a=d;d=c[e+400>>2]|0;f=(c[e+284>>2]|0)-1|0;g=0;h=c[e+84>>2]|0;while(1){if((g|0)>=(c[e+76>>2]|0)){break}i=$(c[d+8>>2]|0,c[h+12>>2]|0)|0;j=a0[c[(c[e+4>>2]|0)+32>>2]&7](e,c[d+64+(g<<2)>>2]|0,i,c[h+12>>2]|0,1)|0;if((c[d+8>>2]|0)>>>0<f>>>0){k=c[h+12>>2]|0}else{k=((c[h+32>>2]|0)>>>0)%((c[h+12>>2]|0)>>>0)|0;if((k|0)==0){k=c[h+12>>2]|0}}i=c[h+28>>2]|0;l=c[h+8>>2]|0;m=(i>>>0)%(l>>>0)|0;if((m|0)>0){m=l-m|0}n=c[(c[e+416>>2]|0)+4+(g<<2)>>2]|0;o=0;while(1){if((o|0)>=(k|0)){break}p=c[j+(o<<2)>>2]|0;q=$(o,c[h+40>>2]|0)|0;aS[n&15](e,h,c[a+(g<<2)>>2]|0,p,q,0,i);if((m|0)>0){p=p+(i<<7)|0;q=p;r=m<<7;eq(q|0,0,r|0)|0;s=b[p-128>>1]|0;t=0;while(1){if((t|0)>=(m|0)){break}b[p+(t<<7)>>1]=s;t=t+1|0}}o=o+1|0}if((c[d+8>>2]|0)==(f|0)){i=i+m|0;n=(i>>>0)/(l>>>0)|0;o=k;while(1){if((o|0)>=(c[h+12>>2]|0)){break}p=c[j+(o<<2)>>2]|0;r=c[j+(o-1<<2)>>2]|0;q=p;u=i<<7;eq(q|0,0,u|0)|0;u=0;while(1){if(u>>>0>=n>>>0){break}s=b[r+(l-1<<7)>>1]|0;t=0;while(1){if((t|0)>=(l|0)){break}b[p+(t<<7)>>1]=s;t=t+1|0}p=p+(l<<7)|0;r=r+(l<<7)|0;u=u+1|0}o=o+1|0}}g=g+1|0;h=h+88|0}return bE(e,a)|0}function bE(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;b=i;i=i+16|0;d=b|0;e=a;a=c[e+400>>2]|0;f=0;while(1){if((f|0)>=(c[e+288>>2]|0)){break}g=c[e+292+(f<<2)>>2]|0;h=$(c[a+8>>2]|0,c[g+12>>2]|0)|0;c[d+(f<<2)>>2]=a0[c[(c[e+4>>2]|0)+32>>2]&7](e,c[a+64+(c[g+4>>2]<<2)>>2]|0,h,c[g+12>>2]|0,0)|0;f=f+1|0}h=c[a+16>>2]|0;L702:while(1){if((h|0)>=(c[a+20>>2]|0)){j=554;break}k=c[a+12>>2]|0;while(1){if(k>>>0>=(c[e+308>>2]|0)>>>0){break}l=0;f=0;while(1){if((f|0)>=(c[e+288>>2]|0)){break}g=c[e+292+(f<<2)>>2]|0;m=$(k,c[g+56>>2]|0)|0;n=0;while(1){if((n|0)>=(c[g+60>>2]|0)){break}o=(c[(c[d+(f<<2)>>2]|0)+(n+h<<2)>>2]|0)+(m<<7)|0;p=0;while(1){if((p|0)>=(c[g+56>>2]|0)){break}q=o;o=q+128|0;r=l;l=r+1|0;c[a+24+(r<<2)>>2]=q;p=p+1|0}n=n+1|0}f=f+1|0}if((a$[c[(c[e+420>>2]|0)+4>>2]&31](e,a+24|0)|0)==0){j=549;break L702}k=k+1|0}c[a+12>>2]=0;h=h+1|0}if((j|0)==554){f=a+8|0;c[f>>2]=(c[f>>2]|0)+1;bB(e);s=1;t=s;i=b;return t|0}else if((j|0)==549){c[a+16>>2]=h;c[a+12>>2]=k;s=0;t=s;i=b;return t|0}return 0}function bF(a){a=a|0;var b=0,d=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,1,12)|0;c[b+408>>2]=a;c[a>>2]=24;switch(c[b+40>>2]|0){case 1:{if((c[b+36>>2]|0)!=1){c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b)}break};case 2:{if((c[b+36>>2]|0)!=3){c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b)}break};case 3:{if((c[b+36>>2]|0)!=3){c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b)}break};case 4:case 5:{if((c[b+36>>2]|0)!=4){c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b)}break};default:{if((c[b+36>>2]|0)<1){c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b)}}}switch(c[b+80>>2]|0){case 4:{if((c[b+76>>2]|0)!=4){c[(c[b>>2]|0)+20>>2]=11;aT[c[c[b>>2]>>2]&63](b)}if((c[b+40>>2]|0)==4){c[a+4>>2]=8}else{c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}return};case 2:{if((c[b+76>>2]|0)!=3){c[(c[b>>2]|0)+20>>2]=11;aT[c[c[b>>2]>>2]&63](b)}if((c[b+40>>2]|0)==2){c[a+4>>2]=4}else{c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}return};case 1:{if((c[b+76>>2]|0)!=1){c[(c[b>>2]|0)+20>>2]=11;aT[c[c[b>>2]>>2]&63](b)}do{if((c[b+40>>2]|0)==1){d=579}else{if((c[b+40>>2]|0)==3){d=579;break}if((c[b+40>>2]|0)==2){c[a>>2]=14;c[a+4>>2]=2}else{c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}}}while(0);if((d|0)==579){c[a+4>>2]=10}return};case 5:{if((c[b+76>>2]|0)!=4){c[(c[b>>2]|0)+20>>2]=11;aT[c[c[b>>2]>>2]&63](b)}if((c[b+40>>2]|0)==4){c[a>>2]=14;c[a+4>>2]=6}else{if((c[b+40>>2]|0)==5){c[a+4>>2]=8}else{c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}}return};case 3:{if((c[b+76>>2]|0)!=3){c[(c[b>>2]|0)+20>>2]=11;aT[c[c[b>>2]>>2]&63](b)}if((c[b+40>>2]|0)==2){c[a>>2]=14;c[a+4>>2]=14}else{if((c[b+40>>2]|0)==3){c[a+4>>2]=8}else{c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}}return};default:{if((c[b+80>>2]|0)!=(c[b+40>>2]|0)){d=617}else{if((c[b+76>>2]|0)!=(c[b+36>>2]|0)){d=617}}if((d|0)==617){c[(c[b>>2]|0)+20>>2]=28;aT[c[c[b>>2]>>2]&63](b)}c[a+4>>2]=8;return}}}function bG(a){a=a|0;return}function bH(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0;h=b;b=d;d=e;e=f;f=g;g=c[h+28>>2]|0;i=c[h+36>>2]|0;while(1){h=f-1|0;f=h;if((h|0)<0){break}h=b;b=h+4|0;j=c[h>>2]|0;h=c[(c[d>>2]|0)+(e<<2)>>2]|0;e=e+1|0;k=0;while(1){if(k>>>0>=g>>>0){break}a[h+k|0]=a[j|0]|0;j=j+i|0;k=k+1|0}}return}function bI(a){a=a|0;var b=0,d=0;b=a;a=c[b+408>>2]|0;d=aW[c[c[b+4>>2]>>2]&7](b,1,8192)|0;b=d;c[a+8>>2]=d;d=0;while(1){if((d|0)>255){break}c[b+(d<<2)>>2]=d*19595|0;c[b+(d+256<<2)>>2]=d*38470|0;c[b+(d+512<<2)>>2]=(d*7471|0)+32768;c[b+(d+768<<2)>>2]=d*-11059|0;c[b+(d+1024<<2)>>2]=d*-21709|0;c[b+(d+1280<<2)>>2]=(d<<15)+8421376-1;c[b+(d+1536<<2)>>2]=d*-27439|0;c[b+(d+1792<<2)>>2]=d*-5329|0;d=d+1|0}return}function bJ(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;i=b;b=e;e=f;f=g;g=h;h=c[(c[i+408>>2]|0)+8>>2]|0;j=c[i+28>>2]|0;while(1){i=g-1|0;g=i;if((i|0)<0){break}i=b;b=i+4|0;k=c[i>>2]|0;i=c[(c[e>>2]|0)+(f<<2)>>2]|0;f=f+1|0;l=0;while(1){if(l>>>0>=j>>>0){break}m=d[k|0]|0;n=d[k+1|0]|0;o=d[k+2|0]|0;k=k+3|0;a[i+l|0]=(c[h+(m<<2)>>2]|0)+(c[h+(n+256<<2)>>2]|0)+(c[h+(o+512<<2)>>2]|0)>>16&255;l=l+1|0}}return}function bK(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=d;d=e;e=f;f=g;g=c[b+28>>2]|0;while(1){b=f-1|0;f=b;if((b|0)<0){break}b=h;h=b+4|0;i=c[b>>2]|0;b=c[(c[d>>2]|0)+(e<<2)>>2]|0;j=c[(c[d+4>>2]|0)+(e<<2)>>2]|0;k=c[(c[d+8>>2]|0)+(e<<2)>>2]|0;e=e+1|0;l=0;while(1){if(l>>>0>=g>>>0){break}a[b+l|0]=a[i|0]|0;a[j+l|0]=a[i+1|0]|0;a[k+l|0]=a[i+2|0]|0;i=i+3|0;l=l+1|0}}return}function bL(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=b;b=e;e=f;f=g;g=h;h=c[(c[i+408>>2]|0)+8>>2]|0;j=c[i+28>>2]|0;while(1){i=g-1|0;g=i;if((i|0)<0){break}i=b;b=i+4|0;k=c[i>>2]|0;i=c[(c[e>>2]|0)+(f<<2)>>2]|0;l=c[(c[e+4>>2]|0)+(f<<2)>>2]|0;m=c[(c[e+8>>2]|0)+(f<<2)>>2]|0;f=f+1|0;n=0;while(1){if(n>>>0>=j>>>0){break}o=d[k|0]|0;p=d[k+1|0]|0;q=d[k+2|0]|0;k=k+3|0;a[i+n|0]=(c[h+(o<<2)>>2]|0)+(c[h+(p+256<<2)>>2]|0)+(c[h+(q+512<<2)>>2]|0)>>16&255;a[l+n|0]=(c[h+(o+768<<2)>>2]|0)+(c[h+(p+1024<<2)>>2]|0)+(c[h+(q+1280<<2)>>2]|0)>>16&255;a[m+n|0]=(c[h+(o+1280<<2)>>2]|0)+(c[h+(p+1536<<2)>>2]|0)+(c[h+(q+1792<<2)>>2]|0)>>16&255;n=n+1|0}}return}function bM(b,d,e,f,g){b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=b;b=d;d=e;e=f;f=g;g=c[h+76>>2]|0;i=c[h+28>>2]|0;while(1){h=f-1|0;f=h;if((h|0)<0){break}h=0;while(1){if((h|0)>=(g|0)){break}j=c[b>>2]|0;k=c[(c[d+(h<<2)>>2]|0)+(e<<2)>>2]|0;l=0;while(1){if(l>>>0>=i>>>0){break}a[k+l|0]=a[j+h|0]|0;j=j+g|0;l=l+1|0}h=h+1|0}b=b+4|0;e=e+1|0}return}function bN(b,e,f,g,h){b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;i=b;b=e;e=f;f=g;g=h;h=c[(c[i+408>>2]|0)+8>>2]|0;j=c[i+28>>2]|0;while(1){i=g-1|0;g=i;if((i|0)<0){break}i=b;b=i+4|0;k=c[i>>2]|0;i=c[(c[e>>2]|0)+(f<<2)>>2]|0;l=c[(c[e+4>>2]|0)+(f<<2)>>2]|0;m=c[(c[e+8>>2]|0)+(f<<2)>>2]|0;n=c[(c[e+12>>2]|0)+(f<<2)>>2]|0;f=f+1|0;o=0;while(1){if(o>>>0>=j>>>0){break}p=255-(d[k|0]|0)|0;q=255-(d[k+1|0]|0)|0;r=255-(d[k+2|0]|0)|0;a[n+o|0]=a[k+3|0]|0;k=k+4|0;a[i+o|0]=(c[h+(p<<2)>>2]|0)+(c[h+(q+256<<2)>>2]|0)+(c[h+(r+512<<2)>>2]|0)>>16&255;a[l+o|0]=(c[h+(p+768<<2)>>2]|0)+(c[h+(q+1024<<2)>>2]|0)+(c[h+(r+1280<<2)>>2]|0)>>16&255;a[m+o|0]=(c[h+(p+1280<<2)>>2]|0)+(c[h+(q+1536<<2)>>2]|0)+(c[h+(r+1792<<2)>>2]|0)>>16&255;o=o+1|0}}return}function bO(a){a=a|0;var b=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,1,156)|0;c[b+416>>2]=a;c[a>>2]=18;b=0;while(1){if((b|0)>=4){break}c[a+84+(b<<2)>>2]=0;c[a+140+(b<<2)>>2]=0;b=b+1|0}return}function bP(a){a=a|0;var d=0,f=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=a;a=c[d+416>>2]|0;f=0;i=0;j=c[d+84>>2]|0;while(1){if((i|0)>=(c[d+76>>2]|0)){break}switch((c[j+36>>2]<<8)+(c[j+40>>2]|0)|0){case 1799:{c[a+44+(i<<2)>>2]=54;f=0;break};case 2570:{c[a+44+(i<<2)>>2]=62;f=0;break};case 771:{c[a+44+(i<<2)>>2]=46;f=0;break};case 514:{c[a+44+(i<<2)>>2]=50;f=0;break};case 257:{c[a+44+(i<<2)>>2]=20;f=0;break};case 1285:{c[a+44+(i<<2)>>2]=26;f=0;break};case 1542:{c[a+44+(i<<2)>>2]=56;f=0;break};case 774:{c[a+44+(i<<2)>>2]=44;f=0;break};case 516:{c[a+44+(i<<2)>>2]=48;f=0;break};case 258:{c[a+44+(i<<2)>>2]=22;f=0;break};case 1028:{c[a+44+(i<<2)>>2]=4;f=0;break};case 2052:{c[a+44+(i<<2)>>2]=6;f=0;break};case 1539:{c[a+44+(i<<2)>>2]=14;f=0;break};case 1032:{c[a+44+(i<<2)>>2]=10;f=0;break};case 2313:{c[a+44+(i<<2)>>2]=12;f=0;break};case 3084:{c[a+44+(i<<2)>>2]=8;f=0;break};case 3341:{c[a+44+(i<<2)>>2]=64;f=0;break};case 2056:{k=c[d+232>>2]|0;if((k|0)==2){c[a+100+(i<<2)>>2]=68;f=2}else if((k|0)==0){c[a+44+(i<<2)>>2]=24;f=0}else if((k|0)==1){c[a+44+(i<<2)>>2]=36;f=1}else{c[(c[d>>2]|0)+20>>2]=49;aT[c[c[d>>2]>>2]&63](d)}break};case 3591:{c[a+44+(i<<2)>>2]=30;f=0;break};case 3078:{c[a+44+(i<<2)>>2]=60;f=0;break};case 2565:{c[a+44+(i<<2)>>2]=28;f=0;break};case 4112:{c[a+44+(i<<2)>>2]=32;f=0;break};case 4104:{c[a+44+(i<<2)>>2]=16;f=0;break};case 1548:{c[a+44+(i<<2)>>2]=18;f=0;break};case 1290:{c[a+44+(i<<2)>>2]=42;f=0;break};case 3598:{c[a+44+(i<<2)>>2]=40;f=0;break};case 3855:{c[a+44+(i<<2)>>2]=70;f=0;break};case 1026:{c[a+44+(i<<2)>>2]=2;f=0;break};case 513:{c[a+44+(i<<2)>>2]=52;f=0;break};case 2064:{c[a+44+(i<<2)>>2]=58;f=0;break};case 1806:{c[a+44+(i<<2)>>2]=34;f=0;break};case 2827:{c[a+44+(i<<2)>>2]=38;f=0;break};default:{c[(c[d>>2]|0)+20>>2]=7;c[(c[d>>2]|0)+24>>2]=c[j+36>>2];c[(c[d>>2]|0)+28>>2]=c[j+40>>2];aT[c[c[d>>2]>>2]&63](d)}}k=c[j+16>>2]|0;do{if((k|0)<0){l=733}else{if((k|0)>=4){l=733;break}if((c[d+88+(k<<2)>>2]|0)==0){l=733}}}while(0);if((l|0)==733){l=0;c[(c[d>>2]|0)+20>>2]=54;c[(c[d>>2]|0)+24>>2]=k;aT[c[c[d>>2]>>2]&63](d)}m=c[d+88+(k<<2)>>2]|0;n=f;if((n|0)==0){if((c[a+84+(k<<2)>>2]|0)==0){c[a+84+(k<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,256)|0}o=c[a+84+(k<<2)>>2]|0;p=0;while(1){if((p|0)>=64){break}c[o+(p<<2)>>2]=e[m+(p<<1)>>1]<<3;p=p+1|0}c[a+4+(i<<2)>>2]=8}else if((n|0)==1){if((c[a+84+(k<<2)>>2]|0)==0){c[a+84+(k<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,256)|0}o=c[a+84+(k<<2)>>2]|0;p=0;while(1){if((p|0)>=64){break}c[o+(p<<2)>>2]=($(e[m+(p<<1)>>1]|0,b[984+(p<<1)>>1]|0)|0)+1024>>11;p=p+1|0}c[a+4+(i<<2)>>2]=8}else if((n|0)==2){if((c[a+140+(k<<2)>>2]|0)==0){c[a+140+(k<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,256)|0}q=c[a+140+(k<<2)>>2]|0;p=0;r=0;while(1){if((r|0)>=8){break}s=0;while(1){if((s|0)>=8){break}g[q+(p<<2)>>2]=1.0/(+((e[m+(p<<1)>>1]|0)>>>0)*+h[1112+(r<<3)>>3]*+h[1112+(s<<3)>>3]*8.0);p=p+1|0;s=s+1|0}r=r+1|0}c[a+4+(i<<2)>>2]=6}else{c[(c[d>>2]|0)+20>>2]=49;aT[c[c[d>>2]>>2]&63](d)}i=i+1|0;j=j+88|0}return}function bQ(a,d,e,f,g,h,j){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;j=j|0;var k=0,l=0,m=0,n=0,o=0,p=0,q=0;k=i;i=i+256|0;l=k|0;m=d;d=e;e=f;f=h;h=j;j=c[a+416>>2]|0;a=c[j+44+(c[m+4>>2]<<2)>>2]|0;n=c[j+84+(c[m+16>>2]<<2)>>2]|0;d=d+(g<<2)|0;g=0;while(1){if(g>>>0>=h>>>0){break}aY[a&127](l|0,d,f);j=e+(g<<7)|0;o=0;while(1){if((o|0)>=64){break}p=c[n+(o<<2)>>2]|0;q=c[l+(o<<2)>>2]|0;if((q|0)<0){q=-q|0;q=q+(p>>1)|0;if((q|0)>=(p|0)){q=(q|0)/(p|0)|0}else{q=0}q=-q|0}else{q=q+(p>>1)|0;if((q|0)>=(p|0)){q=(q|0)/(p|0)|0}else{q=0}}b[j+(o<<1)>>1]=q&65535;o=o+1|0}g=g+1|0;f=f+(c[m+36>>2]|0)|0}i=k;return}function bR(a,d,e,f,h,j,k){a=a|0;d=d|0;e=e|0;f=f|0;h=h|0;j=j|0;k=k|0;var l=0,m=0,n=0,o=0,p=0;l=i;i=i+256|0;m=l|0;n=d;d=e;e=f;f=j;j=k;k=c[a+416>>2]|0;a=c[k+100+(c[n+4>>2]<<2)>>2]|0;o=c[k+140+(c[n+16>>2]<<2)>>2]|0;d=d+(h<<2)|0;h=0;while(1){if(h>>>0>=j>>>0){break}aY[a&127](m|0,d,f);k=e+(h<<7)|0;p=0;while(1){if((p|0)>=64){break}b[k+(p<<1)>>1]=~~(+g[m+(p<<2)>>2]*+g[o+(p<<2)>>2]+16384.5)-16384&65535;p=p+1|0}h=h+1|0;f=f+(c[n+36>>2]|0)|0}i=l;return}function bS(a){a=a|0;var b=0,d=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,1,140)|0;c[b+420>>2]=a;c[a>>2]=8;d=0;while(1){if((d|0)>=4){break}c[a+60+(d<<2)>>2]=0;c[a+44+(d<<2)>>2]=0;c[a+92+(d<<2)>>2]=0;c[a+76+(d<<2)>>2]=0;d=d+1|0}if((c[b+264>>2]|0)==0){return}c[a+136>>2]=0;return}function bT(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0;d=a;a=b;b=c[d+420>>2]|0;if((a|0)!=0){c[b+8>>2]=30}else{c[b+8>>2]=2}if((c[d+264>>2]|0)!=0){c[b+120>>2]=d;c[b+108>>2]=a;if((c[d+368>>2]|0)==0){if((c[d+360>>2]|0)==0){c[b+4>>2]=24}else{c[b+4>>2]=26}}else{if((c[d+360>>2]|0)==0){c[b+4>>2]=14}else{c[b+4>>2]=22;if((c[b+136>>2]|0)==0){c[b+136>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,1e3)|0}}}c[b+124>>2]=c[(c[d+292>>2]|0)+24>>2];c[b+128>>2]=0;c[b+132>>2]=0}else{if((a|0)!=0){c[b+4>>2]=2}else{c[b+4>>2]=12}}e=0;while(1){if((e|0)>=(c[d+288>>2]|0)){break}f=c[d+292+(e<<2)>>2]|0;do{if((c[d+360>>2]|0)==0){if((c[d+368>>2]|0)!=0){break}g=c[f+20>>2]|0;if((a|0)!=0){if((g|0)<0){h=827}else{if((g|0)>=4){h=827}}if((h|0)==827){h=0;c[(c[d>>2]|0)+20>>2]=52;c[(c[d>>2]|0)+24>>2]=g;aT[c[c[d>>2]>>2]&63](d)}if((c[b+76+(g<<2)>>2]|0)==0){c[b+76+(g<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,1028)|0}i=c[b+76+(g<<2)>>2]|0;eq(i|0,0,1028)|0}else{b0(d,1,g,b+44+(g<<2)|0)}c[b+20+(e<<2)>>2]=0}}while(0);if((c[d+364>>2]|0)!=0){g=c[f+24>>2]|0;if((a|0)!=0){if((g|0)<0){h=837}else{if((g|0)>=4){h=837}}if((h|0)==837){h=0;c[(c[d>>2]|0)+20>>2]=52;c[(c[d>>2]|0)+24>>2]=g;aT[c[c[d>>2]>>2]&63](d)}if((c[b+92+(g<<2)>>2]|0)==0){c[b+92+(g<<2)>>2]=aW[c[c[d+4>>2]>>2]&7](d,1,1028)|0}i=c[b+92+(g<<2)>>2]|0;eq(i|0,0,1028)|0}else{b0(d,0,g,b+60+(g<<2)|0)}}e=e+1|0}c[b+12>>2]=0;c[b+16>>2]=0;c[b+36>>2]=c[d+236>>2];c[b+40>>2]=0;return}function bU(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0;b=i;i=i+32|0;d=b|0;e=b+16|0;f=a;a=c[f+420>>2]|0;if((c[f+264>>2]|0)!=0){b8(a)}g=d|0;eq(g|0,0,16)|0;g=e|0;eq(g|0,0,16)|0;g=0;while(1){if((g|0)>=(c[f+288>>2]|0)){break}h=c[f+292+(g<<2)>>2]|0;do{if((c[f+360>>2]|0)==0){if((c[f+368>>2]|0)!=0){break}j=c[h+20>>2]|0;if((c[d+(j<<2)>>2]|0)==0){k=f+120+(j<<2)|0;if((c[k>>2]|0)==0){c[k>>2]=cS(f)|0}cf(f,c[k>>2]|0,c[a+76+(j<<2)>>2]|0);c[d+(j<<2)>>2]=1}}}while(0);if((c[f+364>>2]|0)!=0){j=c[h+24>>2]|0;if((c[e+(j<<2)>>2]|0)==0){k=f+136+(j<<2)|0;if((c[k>>2]|0)==0){c[k>>2]=cS(f)|0}cf(f,c[k>>2]|0,c[a+92+(j<<2)>>2]|0);c[e+(j<<2)>>2]=1}}g=g+1|0}i=b;return}function bV(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=i;i=i+40|0;d=b|0;e=a;a=c[e+420>>2]|0;if((c[e+264>>2]|0)!=0){c[a+112>>2]=c[c[e+24>>2]>>2];c[a+116>>2]=c[(c[e+24>>2]|0)+4>>2];b8(a);cd(a);c[c[e+24>>2]>>2]=c[a+112>>2];c[(c[e+24>>2]|0)+4>>2]=c[a+116>>2];i=b;return}c[d>>2]=c[c[e+24>>2]>>2];c[d+4>>2]=c[(c[e+24>>2]|0)+4>>2];f=d+8|0;g=a+12|0;c[f>>2]=c[g>>2];c[f+4>>2]=c[g+4>>2];c[f+8>>2]=c[g+8>>2];c[f+12>>2]=c[g+12>>2];c[f+16>>2]=c[g+16>>2];c[f+20>>2]=c[g+20>>2];c[d+32>>2]=e;if((b5(d)|0)==0){c[(c[e>>2]|0)+20>>2]=25;aT[c[c[e>>2]>>2]&63](e)}c[c[e+24>>2]>>2]=c[d>>2];c[(c[e+24>>2]|0)+4>>2]=c[d+4>>2];e=a+12|0;a=d+8|0;c[e>>2]=c[a>>2];c[e+4>>2]=c[a+4>>2];c[e+8>>2]=c[a+8>>2];c[e+12>>2]=c[a+12>>2];c[e+16>>2]=c[a+16>>2];c[e+20>>2]=c[a+20>>2];i=b;return}function bW(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0;e=a;a=d;d=c[e+420>>2]|0;f=c[e+372>>2]|0;c[d+112>>2]=c[c[e+24>>2]>>2];c[d+116>>2]=c[(c[e+24>>2]|0)+4>>2];if((c[e+236>>2]|0)!=0){if((c[d+36>>2]|0)==0){b7(d,c[d+40>>2]|0)}}g=0;while(1){if((g|0)>=(c[e+316>>2]|0)){break}h=c[e+320+(g<<2)>>2]|0;i=c[e+292+(h<<2)>>2]|0;j=b[c[a+(g<<2)>>2]>>1]>>f;k=j-(c[d+20+(h<<2)>>2]|0)|0;c[d+20+(h<<2)>>2]=j;j=k;if((k|0)<0){k=-k|0;j=j-1|0}h=0;while(1){if((k|0)==0){break}h=h+1|0;k=k>>1}if((h|0)>11){c[(c[e>>2]|0)+20>>2]=6;aT[c[c[e>>2]>>2]&63](e)}ce(d,c[i+20>>2]|0,h);if((h|0)!=0){cb(d,j,h)}g=g+1|0}c[c[e+24>>2]>>2]=c[d+112>>2];c[(c[e+24>>2]|0)+4>>2]=c[d+116>>2];if((c[e+236>>2]|0)==0){return 1}if((c[d+36>>2]|0)==0){c[d+36>>2]=c[e+236>>2];e=d+40|0;c[e>>2]=(c[e>>2]|0)+1;e=d+40|0;c[e>>2]=c[e>>2]&7}e=d+36|0;c[e>>2]=(c[e>>2]|0)-1;return 1}function bX(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;e=a;a=d;d=c[e+420>>2]|0;c[d+112>>2]=c[c[e+24>>2]>>2];c[d+116>>2]=c[(c[e+24>>2]|0)+4>>2];if((c[e+236>>2]|0)!=0){if((c[d+36>>2]|0)==0){b7(d,c[d+40>>2]|0)}}f=c[e+364>>2]|0;g=c[e+372>>2]|0;h=c[e+380>>2]|0;i=c[a>>2]|0;a=0;j=c[e+360>>2]|0;while(1){if((j|0)>(f|0)){break}k=b[i+(c[h+(j<<2)>>2]<<1)>>1]|0;l=k;do{if((k|0)==0){a=a+1|0}else{if((l|0)<0){l=-l|0;l=l>>g;m=~l}else{l=l>>g;m=l}if((l|0)==0){a=a+1|0;break}if((c[d+128>>2]|0)>>>0>0>>>0){b8(d)}while(1){if((a|0)<=15){break}b9(d,c[d+124>>2]|0,240);a=a-16|0}n=1;while(1){o=l>>1;l=o;if((o|0)==0){break}n=n+1|0}if((n|0)>10){c[(c[e>>2]|0)+20>>2]=6;aT[c[c[e>>2]>>2]&63](e)}b9(d,c[d+124>>2]|0,(a<<4)+n|0);cb(d,m,n);a=0}}while(0);j=j+1|0}if((a|0)>0){a=d+128|0;c[a>>2]=(c[a>>2]|0)+1;if((c[d+128>>2]|0)==32767){b8(d)}}c[c[e+24>>2]>>2]=c[d+112>>2];c[(c[e+24>>2]|0)+4>>2]=c[d+116>>2];if((c[e+236>>2]|0)==0){return 1}if((c[d+36>>2]|0)==0){c[d+36>>2]=c[e+236>>2];e=d+40|0;c[e>>2]=(c[e>>2]|0)+1;e=d+40|0;c[e>>2]=c[e>>2]&7}e=d+36|0;c[e>>2]=(c[e>>2]|0)-1;return 1}function bY(a,d){a=a|0;d=d|0;var e=0,f=0,g=0;e=a;a=d;d=c[e+420>>2]|0;f=c[e+372>>2]|0;c[d+112>>2]=c[c[e+24>>2]>>2];c[d+116>>2]=c[(c[e+24>>2]|0)+4>>2];if((c[e+236>>2]|0)!=0){if((c[d+36>>2]|0)==0){b7(d,c[d+40>>2]|0)}}g=0;while(1){if((g|0)>=(c[e+316>>2]|0)){break}cb(d,b[c[a+(g<<2)>>2]>>1]>>f,1);g=g+1|0}c[c[e+24>>2]>>2]=c[d+112>>2];c[(c[e+24>>2]|0)+4>>2]=c[d+116>>2];if((c[e+236>>2]|0)==0){return 1}if((c[d+36>>2]|0)==0){c[d+36>>2]=c[e+236>>2];e=d+40|0;c[e>>2]=(c[e>>2]|0)+1;e=d+40|0;c[e>>2]=c[e>>2]&7}e=d+36|0;c[e>>2]=(c[e>>2]|0)-1;return 1}function bZ(d,e){d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+256|0;g=f|0;h=d;d=e;e=c[h+420>>2]|0;c[e+112>>2]=c[c[h+24>>2]>>2];c[e+116>>2]=c[(c[h+24>>2]|0)+4>>2];if((c[h+236>>2]|0)!=0){if((c[e+36>>2]|0)==0){b7(e,c[e+40>>2]|0)}}j=c[h+364>>2]|0;k=c[h+372>>2]|0;l=c[h+380>>2]|0;m=c[d>>2]|0;d=0;n=c[h+360>>2]|0;while(1){if((n|0)>(j|0)){break}o=b[m+(c[l+(n<<2)>>2]<<1)>>1]|0;if((o|0)<0){o=-o|0}o=o>>k;c[g+(n<<2)>>2]=o;if((o|0)==1){d=n}n=n+1|0}k=0;p=0;q=(c[e+136>>2]|0)+(c[e+132>>2]|0)|0;n=c[h+360>>2]|0;while(1){if((n|0)>(j|0)){break}r=c[g+(n<<2)>>2]|0;o=r;do{if((r|0)==0){k=k+1|0}else{while(1){if((k|0)>15){s=(n|0)<=(d|0)}else{s=0}if(!s){break}b8(e);b9(e,c[e+124>>2]|0,240);k=k-16|0;ca(e,q,p);q=c[e+136>>2]|0;p=0}if((o|0)>1){t=p;p=t+1|0;a[q+t|0]=o&1;break}else{b8(e);b9(e,c[e+124>>2]|0,(k<<4)+1|0);o=(b[m+(c[l+(n<<2)>>2]<<1)>>1]|0)<0?0:1;cb(e,o,1);ca(e,q,p);q=c[e+136>>2]|0;p=0;k=0;break}}}while(0);n=n+1|0}if((k|0)>0){u=976}else{if(p>>>0>0>>>0){u=976}}if((u|0)==976){k=e+128|0;c[k>>2]=(c[k>>2]|0)+1;k=e+132|0;c[k>>2]=(c[k>>2]|0)+p;if((c[e+128>>2]|0)==32767){u=978}else{if((c[e+132>>2]|0)>>>0>937>>>0){u=978}}if((u|0)==978){b8(e)}}c[c[h+24>>2]>>2]=c[e+112>>2];c[(c[h+24>>2]|0)+4>>2]=c[e+116>>2];if((c[h+236>>2]|0)==0){i=f;return 1}if((c[e+36>>2]|0)==0){c[e+36>>2]=c[h+236>>2];h=e+40|0;c[h>>2]=(c[h>>2]|0)+1;h=e+40|0;c[h>>2]=c[h>>2]&7}h=e+36|0;c[h>>2]=(c[h>>2]|0)-1;i=f;return 1}function b_(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0;e=a;a=d;d=c[e+420>>2]|0;if((c[e+236>>2]|0)!=0){if((c[d+36>>2]|0)==0){f=0;while(1){if((f|0)>=(c[e+288>>2]|0)){break}c[d+20+(f<<2)>>2]=0;f=f+1|0}c[d+36>>2]=c[e+236>>2]}g=d+36|0;c[g>>2]=(c[g>>2]|0)-1}g=0;while(1){if((g|0)>=(c[e+316>>2]|0)){break}f=c[e+320+(g<<2)>>2]|0;h=c[e+292+(f<<2)>>2]|0;b6(e,c[a+(g<<2)>>2]|0,c[d+20+(f<<2)>>2]|0,c[d+76+(c[h+20>>2]<<2)>>2]|0,c[d+92+(c[h+24>>2]<<2)>>2]|0);c[d+20+(f<<2)>>2]=b[c[a+(g<<2)>>2]>>1]|0;g=g+1|0}return 1}function b$(a,d){a=a|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0;e=i;i=i+40|0;f=e|0;g=a;a=d;d=c[g+420>>2]|0;c[f>>2]=c[c[g+24>>2]>>2];c[f+4>>2]=c[(c[g+24>>2]|0)+4>>2];h=f+8|0;j=d+12|0;c[h>>2]=c[j>>2];c[h+4>>2]=c[j+4>>2];c[h+8>>2]=c[j+8>>2];c[h+12>>2]=c[j+12>>2];c[h+16>>2]=c[j+16>>2];c[h+20>>2]=c[j+20>>2];c[f+32>>2]=g;if((c[g+236>>2]|0)!=0){do{if((c[d+36>>2]|0)==0){if((b1(f,c[d+40>>2]|0)|0)!=0){break}k=0;l=k;i=e;return l|0}}while(0)}j=0;while(1){if((j|0)>=(c[g+316>>2]|0)){break}h=c[g+320+(j<<2)>>2]|0;m=c[g+292+(h<<2)>>2]|0;if((b2(f,c[a+(j<<2)>>2]|0,c[f+16+(h<<2)>>2]|0,c[d+44+(c[m+20>>2]<<2)>>2]|0,c[d+60+(c[m+24>>2]<<2)>>2]|0)|0)==0){n=1009;break}c[f+16+(h<<2)>>2]=b[c[a+(j<<2)>>2]>>1]|0;j=j+1|0}if((n|0)==1009){k=0;l=k;i=e;return l|0}c[c[g+24>>2]>>2]=c[f>>2];c[(c[g+24>>2]|0)+4>>2]=c[f+4>>2];n=d+12|0;j=f+8|0;c[n>>2]=c[j>>2];c[n+4>>2]=c[j+4>>2];c[n+8>>2]=c[j+8>>2];c[n+12>>2]=c[j+12>>2];c[n+16>>2]=c[j+16>>2];c[n+20>>2]=c[j+20>>2];if((c[g+236>>2]|0)!=0){if((c[d+36>>2]|0)==0){c[d+36>>2]=c[g+236>>2];g=d+40|0;c[g>>2]=(c[g>>2]|0)+1;g=d+40|0;c[g>>2]=c[g>>2]&7}g=d+36|0;c[g>>2]=(c[g>>2]|0)-1}k=1;l=k;i=e;return l|0}function b0(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;h=i;i=i+1296|0;j=h|0;k=h+264|0;l=b;b=e;e=f;f=g;if((e|0)<0){m=1023}else{if((e|0)>=4){m=1023}}if((m|0)==1023){c[(c[l>>2]|0)+20>>2]=52;c[(c[l>>2]|0)+24>>2]=e;aT[c[c[l>>2]>>2]&63](l)}if((b|0)!=0){n=c[l+120+(e<<2)>>2]|0}else{n=c[l+136+(e<<2)>>2]|0}g=n;if((g|0)==0){c[(c[l>>2]|0)+20>>2]=52;c[(c[l>>2]|0)+24>>2]=e;aT[c[c[l>>2]>>2]&63](l)}if((c[f>>2]|0)==0){c[f>>2]=aW[c[c[l+4>>2]>>2]&7](l,1,1280)|0}e=c[f>>2]|0;f=0;n=1;while(1){if((n|0)>16){break}o=d[g+n|0]|0;if((o|0)<0){m=1035}else{if((f+o|0)>256){m=1035}}if((m|0)==1035){m=0;c[(c[l>>2]|0)+20>>2]=9;aT[c[c[l>>2]>>2]&63](l)}while(1){p=o;o=p-1|0;if((p|0)==0){break}p=f;f=p+1|0;a[j+p|0]=n&255}n=n+1|0}a[j+f|0]=0;n=f;p=0;q=a[j|0]|0;f=0;while(1){if((a[j+f|0]|0)==0){break}while(1){if((a[j+f|0]|0)!=(q|0)){break}r=f;f=r+1|0;c[k+(r<<2)>>2]=p;p=p+1|0}if((p|0)>=(1<<q|0)){c[(c[l>>2]|0)+20>>2]=9;aT[c[c[l>>2]>>2]&63](l)}p=p<<1;q=q+1|0}q=e+1024|0;eq(q|0,0,256)|0;q=(b|0)!=0?15:255;f=0;while(1){if((f|0)>=(n|0)){break}o=d[g+17+f|0]|0;do{if((o|0)<0){m=1054}else{if((o|0)>(q|0)){m=1054;break}if((a[e+1024+o|0]|0)!=0){m=1054}}}while(0);if((m|0)==1054){m=0;c[(c[l>>2]|0)+20>>2]=9;aT[c[c[l>>2]>>2]&63](l)}c[e+(o<<2)>>2]=c[k+(f<<2)>>2];a[e+1024+o|0]=a[j+f|0]|0;f=f+1|0}i=h;return}function b1(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0;e=b;b=d;if((b5(e)|0)==0){f=0;g=f;return g|0}d=e|0;h=c[d>>2]|0;c[d>>2]=h+1;a[h]=-1;h=e+4|0;d=(c[h>>2]|0)-1|0;c[h>>2]=d;do{if((d|0)==0){if((b4(e)|0)!=0){break}f=0;g=f;return g|0}}while(0);d=e|0;h=c[d>>2]|0;c[d>>2]=h+1;a[h]=b+208&255;b=e+4|0;h=(c[b>>2]|0)-1|0;c[b>>2]=h;do{if((h|0)==0){if((b4(e)|0)!=0){break}f=0;g=f;return g|0}}while(0);h=0;while(1){if((h|0)>=(c[(c[e+32>>2]|0)+288>>2]|0)){break}c[e+16+(h<<2)>>2]=0;h=h+1|0}f=1;g=f;return g|0}function b2(d,e,f,g,h){d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;i=d;d=e;e=g;g=h;h=c[(c[i+32>>2]|0)+384>>2]|0;j=c[(c[i+32>>2]|0)+380>>2]|0;k=(b[d>>1]|0)-f|0;f=k;l=k;if((l|0)<0){l=-l|0;f=f-1|0}k=0;while(1){if((l|0)==0){break}k=k+1|0;l=l>>1}if((k|0)>11){c[(c[c[i+32>>2]>>2]|0)+20>>2]=6;aT[c[c[c[i+32>>2]>>2]>>2]&63](c[i+32>>2]|0)}if((b3(i,c[e+(k<<2)>>2]|0,a[e+1024+k|0]|0)|0)==0){m=0;n=m;return n|0}do{if((k|0)!=0){if((b3(i,f,k)|0)!=0){break}m=0;n=m;return n|0}}while(0);e=0;o=1;L1429:while(1){if((o|0)>(h|0)){p=1114;break}q=b[d+(c[j+(o<<2)>>2]<<1)>>1]|0;l=q;if((q|0)==0){e=e+1|0}else{while(1){if((e|0)<=15){break}if((b3(i,c[g+960>>2]|0,a[g+1264|0]|0)|0)==0){p=1098;break L1429}e=e-16|0}f=l;if((l|0)<0){l=-l|0;f=f-1|0}k=1;while(1){q=l>>1;l=q;if((q|0)==0){break}k=k+1|0}if((k|0)>10){c[(c[c[i+32>>2]>>2]|0)+20>>2]=6;aT[c[c[c[i+32>>2]>>2]>>2]&63](c[i+32>>2]|0)}q=(e<<4)+k|0;if((b3(i,c[g+(q<<2)>>2]|0,a[g+1024+q|0]|0)|0)==0){p=1108;break}if((b3(i,f,k)|0)==0){p=1110;break}e=0}o=o+1|0}if((p|0)==1098){m=0;n=m;return n|0}else if((p|0)==1108){m=0;n=m;return n|0}else if((p|0)==1114){do{if((e|0)>0){if((b3(i,c[g>>2]|0,a[g+1024|0]|0)|0)!=0){break}m=0;n=m;return n|0}}while(0);m=1;n=m;return n|0}else if((p|0)==1110){m=0;n=m;return n|0}return 0}function b3(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=b;b=e;e=d;d=c[f+12>>2]|0;if((b|0)==0){c[(c[c[f+32>>2]>>2]|0)+20>>2]=41;aT[c[c[c[f+32>>2]>>2]>>2]&63](c[f+32>>2]|0)}e=e&(1<<b)-1;d=d+b|0;e=e<<24-d;e=e|c[f+8>>2];while(1){if((d|0)<8){g=1142;break}b=e>>16&255;h=f|0;i=c[h>>2]|0;c[h>>2]=i+1;a[i]=b&255;i=f+4|0;h=(c[i>>2]|0)-1|0;c[i>>2]=h;if((h|0)==0){if((b4(f)|0)==0){g=1133;break}}if((b|0)==255){b=f|0;h=c[b>>2]|0;c[b>>2]=h+1;a[h]=0;h=f+4|0;b=(c[h>>2]|0)-1|0;c[h>>2]=b;if((b|0)==0){if((b4(f)|0)==0){g=1138;break}}}e=e<<8;d=d-8|0}if((g|0)==1133){j=0;k=j;return k|0}else if((g|0)==1138){j=0;k=j;return k|0}else if((g|0)==1142){c[f+8>>2]=e;c[f+12>>2]=d;j=1;k=j;return k|0}return 0}function b4(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[(c[b+32>>2]|0)+24>>2]|0;if((aX[c[a+12>>2]&3](c[b+32>>2]|0)|0)!=0){c[b>>2]=c[a>>2];c[b+4>>2]=c[a+4>>2];d=1;e=d;return e|0}else{d=0;e=d;return e|0}return 0}function b5(a){a=a|0;var b=0,d=0,e=0;b=a;if((b3(b,127,7)|0)!=0){c[b+8>>2]=0;c[b+12>>2]=0;d=1;e=d;return e|0}else{d=0;e=d;return e|0}return 0}function b6(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0;h=a;a=d;d=f;f=g;g=c[h+384>>2]|0;i=c[h+380>>2]|0;j=(b[a>>1]|0)-e|0;if((j|0)<0){j=-j|0}e=0;while(1){if((j|0)==0){break}e=e+1|0;j=j>>1}if((e|0)>11){c[(c[h>>2]|0)+20>>2]=6;aT[c[c[h>>2]>>2]&63](h)}k=d+(e<<2)|0;c[k>>2]=(c[k>>2]|0)+1;k=0;d=1;while(1){if((d|0)>(g|0)){break}l=b[a+(c[i+(d<<2)>>2]<<1)>>1]|0;j=l;if((l|0)==0){k=k+1|0}else{while(1){if((k|0)<=15){break}l=f+960|0;c[l>>2]=(c[l>>2]|0)+1;k=k-16|0}if((j|0)<0){j=-j|0}e=1;while(1){l=j>>1;j=l;if((l|0)==0){break}e=e+1|0}if((e|0)>10){c[(c[h>>2]|0)+20>>2]=6;aT[c[c[h>>2]>>2]&63](h)}l=f+((k<<4)+e<<2)|0;c[l>>2]=(c[l>>2]|0)+1;k=0}d=d+1|0}if((k|0)<=0){return}k=f|0;c[k>>2]=(c[k>>2]|0)+1;return}function b7(b,d){b=b|0;d=d|0;var e=0,f=0;e=b;b=d;b8(e);if((c[e+108>>2]|0)==0){cd(e);d=e+112|0;f=c[d>>2]|0;c[d>>2]=f+1;a[f]=-1;f=e+116|0;d=(c[f>>2]|0)-1|0;c[f>>2]=d;if((d|0)==0){cc(e)}d=e+112|0;f=c[d>>2]|0;c[d>>2]=f+1;a[f]=b+208&255;b=e+116|0;f=(c[b>>2]|0)-1|0;c[b>>2]=f;if((f|0)==0){cc(e)}}if((c[(c[e+120>>2]|0)+360>>2]|0)!=0){c[e+128>>2]=0;c[e+132>>2]=0;return}f=0;while(1){if((f|0)>=(c[(c[e+120>>2]|0)+288>>2]|0)){break}c[e+20+(f<<2)>>2]=0;f=f+1|0}return}function b8(a){a=a|0;var b=0,d=0,e=0;b=a;if((c[b+128>>2]|0)>>>0<=0>>>0){return}a=c[b+128>>2]|0;d=0;while(1){e=a>>1;a=e;if((e|0)==0){break}d=d+1|0}if((d|0)>14){c[(c[c[b+120>>2]>>2]|0)+20>>2]=41;aT[c[c[c[b+120>>2]>>2]>>2]&63](c[b+120>>2]|0)}b9(b,c[b+124>>2]|0,d<<4);if((d|0)!=0){cb(b,c[b+128>>2]|0,d)}c[b+128>>2]=0;ca(b,c[b+136>>2]|0,c[b+132>>2]|0);c[b+132>>2]=0;return}function b9(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b;b=d;d=e;if((c[f+108>>2]|0)!=0){e=(c[f+92+(b<<2)>>2]|0)+(d<<2)|0;c[e>>2]=(c[e>>2]|0)+1;return}else{e=c[f+60+(b<<2)>>2]|0;cb(f,c[e+(d<<2)>>2]|0,a[e+1024+d|0]|0);return}}function ca(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b;b=d;d=e;if((c[f+108>>2]|0)!=0){return}while(1){if(d>>>0<=0>>>0){break}cb(f,a[b]|0,1);b=b+1|0;d=d-1|0}return}function cb(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b;b=e;e=d;d=c[f+16>>2]|0;if((b|0)==0){c[(c[c[f+120>>2]>>2]|0)+20>>2]=41;aT[c[c[c[f+120>>2]>>2]>>2]&63](c[f+120>>2]|0)}if((c[f+108>>2]|0)!=0){return}e=e&(1<<b)-1;d=d+b|0;e=e<<24-d;e=e|c[f+12>>2];while(1){if((d|0)<8){break}b=e>>16&255;g=f+112|0;h=c[g>>2]|0;c[g>>2]=h+1;a[h]=b&255;h=f+116|0;g=(c[h>>2]|0)-1|0;c[h>>2]=g;if((g|0)==0){cc(f)}if((b|0)==255){b=f+112|0;g=c[b>>2]|0;c[b>>2]=g+1;a[g]=0;g=f+116|0;b=(c[g>>2]|0)-1|0;c[g>>2]=b;if((b|0)==0){cc(f)}}e=e<<8;d=d-8|0}c[f+12>>2]=e;c[f+16>>2]=d;return}function cc(a){a=a|0;var b=0;b=a;a=c[(c[b+120>>2]|0)+24>>2]|0;if((aX[c[a+12>>2]&3](c[b+120>>2]|0)|0)==0){c[(c[c[b+120>>2]>>2]|0)+20>>2]=25;aT[c[c[c[b+120>>2]>>2]>>2]&63](c[b+120>>2]|0)}c[b+112>>2]=c[a>>2];c[b+116>>2]=c[a+4>>2];return}function cd(a){a=a|0;var b=0;b=a;cb(b,127,7);c[b+12>>2]=0;c[b+16>>2]=0;return}function ce(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b;b=d;d=e;if((c[f+108>>2]|0)!=0){e=(c[f+76+(b<<2)>>2]|0)+(d<<2)|0;c[e>>2]=(c[e>>2]|0)+1;return}else{e=c[f+44+(b<<2)>>2]|0;cb(f,c[e+(d<<2)>>2]|0,a[e+1024+d|0]|0);return}}function cf(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;g=i;i=i+2104|0;h=g|0;j=g+40|0;k=g+1072|0;l=b;b=e;e=f;f=h|0;eq(f|0,0,33)|0;f=j|0;eq(f|0,0,1028)|0;f=0;while(1){if((f|0)>=257){break}c[k+(f<<2)>>2]=-1;f=f+1|0}c[e+1024>>2]=1;while(1){m=-1;n=1e9;f=0;while(1){if((f|0)>256){break}do{if((c[e+(f<<2)>>2]|0)!=0){if((c[e+(f<<2)>>2]|0)>(n|0)){break}n=c[e+(f<<2)>>2]|0;m=f}}while(0);f=f+1|0}o=-1;n=1e9;f=0;while(1){if((f|0)>256){break}do{if((c[e+(f<<2)>>2]|0)!=0){if((c[e+(f<<2)>>2]|0)>(n|0)){break}if((f|0)==(m|0)){break}n=c[e+(f<<2)>>2]|0;o=f}}while(0);f=f+1|0}if((o|0)<0){break}n=e+(m<<2)|0;c[n>>2]=(c[n>>2]|0)+(c[e+(o<<2)>>2]|0);c[e+(o<<2)>>2]=0;n=j+(m<<2)|0;c[n>>2]=(c[n>>2]|0)+1;while(1){if((c[k+(m<<2)>>2]|0)<0){break}m=c[k+(m<<2)>>2]|0;n=j+(m<<2)|0;c[n>>2]=(c[n>>2]|0)+1}c[k+(m<<2)>>2]=o;n=j+(o<<2)|0;c[n>>2]=(c[n>>2]|0)+1;while(1){if((c[k+(o<<2)>>2]|0)<0){break}o=c[k+(o<<2)>>2]|0;n=j+(o<<2)|0;c[n>>2]=(c[n>>2]|0)+1}}f=0;while(1){if((f|0)>256){break}if((c[j+(f<<2)>>2]|0)!=0){if((c[j+(f<<2)>>2]|0)>32){c[(c[l>>2]|0)+20>>2]=40;aT[c[c[l>>2]>>2]&63](l)}k=h+(c[j+(f<<2)>>2]|0)|0;a[k]=(a[k]|0)+1&255}f=f+1|0}f=32;while(1){if((f|0)<=16){break}while(1){if((d[h+f|0]|0|0)<=0){break}p=f-2|0;while(1){if((d[h+p|0]|0|0)!=0){break}p=p-1|0}l=h+f|0;a[l]=(d[l]|0)-2&255;l=h+(f-1)|0;a[l]=(a[l]|0)+1&255;l=h+(p+1)|0;a[l]=(d[l]|0)+2&255;l=h+p|0;a[l]=(a[l]|0)-1&255}f=f-1|0}while(1){if((d[h+f|0]|0|0)!=0){break}f=f-1|0}l=h+f|0;a[l]=(a[l]|0)-1&255;l=b|0;k=h|0;er(l|0,k|0,17)|0;k=0;f=1;while(1){if((f|0)>32){break}p=0;while(1){if((p|0)>255){break}if((c[j+(p<<2)>>2]|0)==(f|0)){a[b+17+k|0]=p&255;k=k+1|0}p=p+1|0}f=f+1|0}c[b+276>>2]=0;i=g;return}function cg(a){a=a|0;var b=0,d=0;b=a;cF(b,0);if((c[b+208>>2]|0)==0){bF(b);c6(b);c0(b,0)}bO(b);if((c[b+212>>2]|0)!=0){bo(b)}else{bS(b)}if((c[b+200>>2]|0)>1){d=1}else{d=(c[b+216>>2]|0)!=0}bz(b,d&1);ch(b,0);ck(b);aT[c[(c[b+4>>2]|0)+24>>2]&63](b);aT[c[c[b+404>>2]>>2]&63](b);return}function ch(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;a=aW[c[c[d+4>>2]>>2]&7](d,1,64)|0;c[d+392>>2]=a;c[a>>2]=14;if((c[d+208>>2]|0)!=0){return}if((b|0)!=0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d);return}b=0;e=c[d+84>>2]|0;while(1){if((b|0)>=(c[d+76>>2]|0)){break}f=$(c[e+28>>2]|0,c[e+36>>2]|0)|0;g=$(c[e+12>>2]|0,c[e+40>>2]|0)|0;c[a+24+(b<<2)>>2]=a_[c[(c[d+4>>2]|0)+8>>2]&7](d,1,f,g)|0;b=b+1|0;e=e+88|0}return}function ci(a,b){a=a|0;b=b|0;var d=0;d=a;a=b;b=c[d+392>>2]|0;if((c[d+208>>2]|0)!=0){return}c[b+8>>2]=0;c[b+12>>2]=0;c[b+16>>2]=0;c[b+20>>2]=a;if((a|0)==0){c[b+4>>2]=12;return}else{c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d);return}}function cj(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=a;a=b;b=d;d=e;e=c[f+392>>2]|0;while(1){if((c[e+8>>2]|0)>>>0>=(c[f+284>>2]|0)>>>0){g=1363;break}if((c[e+12>>2]|0)>>>0<(c[f+280>>2]|0)>>>0){aS[c[(c[f+396>>2]|0)+4>>2]&15](f,a,b,d,e+24|0,e+12|0,c[f+280>>2]|0)}if((c[e+12>>2]|0)!=(c[f+280>>2]|0)){g=1353;break}if((a$[c[(c[f+400>>2]|0)+4>>2]&31](f,e+24|0)|0)==0){g=1355;break}if((c[e+16>>2]|0)!=0){h=b;c[h>>2]=(c[h>>2]|0)+1;c[e+16>>2]=0}c[e+12>>2]=0;h=e+8|0;c[h>>2]=(c[h>>2]|0)+1}if((g|0)==1355){if((c[e+16>>2]|0)==0){f=b;c[f>>2]=(c[f>>2]|0)-1;c[e+16>>2]=1}return}else if((g|0)==1353){return}else if((g|0)==1363){return}}function ck(a){a=a|0;var b=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,1,32)|0;c[b+404>>2]=a;c[a>>2]=28;c[a+4>>2]=38;c[a+8>>2]=6;c[a+12>>2]=36;c[a+16>>2]=10;c[a+20>>2]=66;c[a+24>>2]=4;c[a+28>>2]=0;return}function cl(a){a=a|0;var b=0;b=a;a=c[b+404>>2]|0;ct(b,216);c[a+28>>2]=0;if((c[b+244>>2]|0)!=0){cC(b)}if((c[b+256>>2]|0)==0){return}cD(b);return}function cm(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=0;d=0;e=c[b+84>>2]|0;while(1){if((d|0)>=(c[b+76>>2]|0)){break}a=a+(cv(b,c[e+16>>2]|0)|0)|0;d=d+1|0;e=e+88|0}do{if((c[b+212>>2]|0)!=0){f=1381}else{if((c[b+264>>2]|0)!=0){f=1381;break}if((c[b+72>>2]|0)!=8){f=1381;break}if((c[b+376>>2]|0)!=8){f=1381;break}g=1;d=0;e=c[b+84>>2]|0;while(1){if((d|0)>=(c[b+76>>2]|0)){break}if((c[e+20>>2]|0)>1){f=1386}else{if((c[e+24>>2]|0)>1){f=1386}}if((f|0)==1386){f=0;g=0}d=d+1|0;e=e+88|0}do{if((a|0)!=0){if((g|0)==0){break}g=0;c[(c[b>>2]|0)+20>>2]=77;aU[c[(c[b>>2]|0)+4>>2]&31](b,0)}}while(0)}}while(0);if((f|0)==1381){g=0}if((c[b+212>>2]|0)!=0){if((c[b+264>>2]|0)!=0){cA(b,202)}else{cA(b,201)}}else{if((c[b+264>>2]|0)!=0){cA(b,194)}else{if((g|0)!=0){cA(b,192)}else{cA(b,193)}}}if((c[b+264>>2]|0)==0){return}if((c[b+376>>2]|0)==8){return}cB(b);return}function cn(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+404>>2]|0;if((c[b+212>>2]|0)!=0){cx(b)}else{d=0;while(1){if((d|0)>=(c[b+288>>2]|0)){break}e=c[b+292+(d<<2)>>2]|0;do{if((c[b+360>>2]|0)==0){if((c[b+368>>2]|0)!=0){break}cw(b,c[e+20>>2]|0,0)}}while(0);if((c[b+364>>2]|0)!=0){cw(b,c[e+24>>2]|0,1)}d=d+1|0}}if((c[b+236>>2]|0)==(c[a+28>>2]|0)){f=b;cz(f);return}cy(b);c[a+28>>2]=c[b+236>>2];f=b;cz(f);return}function co(a){a=a|0;ct(a,217);return}function cp(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;ct(b,216);a=0;while(1){if((a|0)>=4){break}if((c[b+88+(a<<2)>>2]|0)!=0){d=b;e=a;cv(d,e)|0}a=a+1|0}if((c[b+212>>2]|0)!=0){f=b;ct(f,217);return}a=0;while(1){if((a|0)>=4){break}if((c[b+120+(a<<2)>>2]|0)!=0){cw(b,a,0)}if((c[b+136+(a<<2)>>2]|0)!=0){cw(b,a,1)}a=a+1|0}f=b;ct(f,217);return}function cq(a,b,d){a=a|0;b=b|0;d=d|0;var e=0;e=a;a=d;if(a>>>0>65533>>>0){c[(c[e>>2]|0)+20>>2]=12;aT[c[c[e>>2]>>2]&63](e)}ct(e,b);cu(e,a+2|0);return}function cr(a,b){a=a|0;b=b|0;cs(a,b);return}function cs(b,d){b=b|0;d=d|0;var e=0,f=0,g=0;e=b;b=c[e+24>>2]|0;f=b|0;g=c[f>>2]|0;c[f>>2]=g+1;a[g]=d&255;d=b+4|0;g=(c[d>>2]|0)-1|0;c[d>>2]=g;if((g|0)!=0){return}if((aX[c[b+12>>2]&3](e)|0)==0){c[(c[e>>2]|0)+20>>2]=25;aT[c[c[e>>2]>>2]&63](e)}return}function ct(a,b){a=a|0;b=b|0;var c=0;c=a;cs(c,255);cs(c,b);return}function cu(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;cs(c,a>>8&255);cs(c,a&255);return}function cv(a,b){a=a|0;b=b|0;var d=0,f=0,g=0,h=0,i=0;d=a;a=b;b=c[d+88+(a<<2)>>2]|0;if((b|0)==0){c[(c[d>>2]|0)+20>>2]=54;c[(c[d>>2]|0)+24>>2]=a;aT[c[c[d>>2]>>2]&63](d)}f=0;g=0;while(1){if((g|0)>(c[d+384>>2]|0)){break}if((e[b+(c[(c[d+380>>2]|0)+(g<<2)>>2]<<1)>>1]|0|0)>255){f=1}g=g+1|0}if((c[b+128>>2]|0)!=0){h=f;return h|0}ct(d,219);if((f|0)!=0){i=(c[d+384>>2]<<1)+5|0}else{i=(c[d+384>>2]|0)+4|0}cu(d,i);cs(d,a+(f<<4)|0);g=0;while(1){if((g|0)>(c[d+384>>2]|0)){break}a=e[b+(c[(c[d+380>>2]|0)+(g<<2)>>2]<<1)>>1]|0;if((f|0)!=0){cs(d,a>>>8)}cs(d,a&255);g=g+1|0}c[b+128>>2]=1;h=f;return h|0}function cw(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a;a=b;if((e|0)!=0){g=c[f+136+(a<<2)>>2]|0;a=a+16|0}else{g=c[f+120+(a<<2)>>2]|0}if((g|0)==0){c[(c[f>>2]|0)+20>>2]=52;c[(c[f>>2]|0)+24>>2]=a;aT[c[c[f>>2]>>2]&63](f)}if((c[g+276>>2]|0)!=0){return}ct(f,196);e=0;b=1;while(1){if((b|0)>16){break}e=e+(d[g+b|0]|0)|0;b=b+1|0}cu(f,e+19|0);cs(f,a);b=1;while(1){if((b|0)>16){break}cs(f,d[g+b|0]|0);b=b+1|0}b=0;while(1){if((b|0)>=(e|0)){break}cs(f,d[g+17+b|0]|0);b=b+1|0}c[g+276>>2]=1;return}function cx(b){b=b|0;var e=0,f=0,g=0,h=0,j=0,k=0;e=i;i=i+32|0;f=e|0;g=e+16|0;h=b;b=0;while(1){if((b|0)>=16){break}a[g+b|0]=0;a[f+b|0]=0;b=b+1|0}b=0;while(1){if((b|0)>=(c[h+288>>2]|0)){break}j=c[h+292+(b<<2)>>2]|0;do{if((c[h+360>>2]|0)==0){if((c[h+368>>2]|0)!=0){break}a[f+(c[j+20>>2]|0)|0]=1}}while(0);if((c[h+364>>2]|0)!=0){a[g+(c[j+24>>2]|0)|0]=1}b=b+1|0}k=0;b=0;while(1){if((b|0)>=16){break}k=k+((a[f+b|0]|0)+(a[g+b|0]|0))|0;b=b+1|0}if((k|0)==0){i=e;return}ct(h,204);cu(h,(k<<1)+2|0);b=0;while(1){if((b|0)>=16){break}if((a[f+b|0]|0)!=0){cs(h,b);cs(h,(d[h+152+b|0]|0)+(d[h+168+b|0]<<4)|0)}if((a[g+b|0]|0)!=0){cs(h,b+16|0);cs(h,d[h+184+b|0]|0)}b=b+1|0}i=e;return}function cy(a){a=a|0;var b=0;b=a;ct(b,221);cu(b,4);cu(b,c[b+236>>2]|0);return}function cz(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;ct(b,218);cu(b,(c[b+288>>2]<<1)+6|0);cs(b,c[b+288>>2]|0);a=0;while(1){if((a|0)>=(c[b+288>>2]|0)){break}d=c[b+292+(a<<2)>>2]|0;cs(b,c[d>>2]|0);do{if((c[b+360>>2]|0)==0){if((c[b+368>>2]|0)!=0){e=1542;break}f=c[d+20>>2]|0}else{e=1542}}while(0);if((e|0)==1542){e=0;f=0}if((c[b+364>>2]|0)!=0){g=c[d+24>>2]|0}else{g=0}cs(b,(f<<4)+g|0);a=a+1|0}cs(b,c[b+360>>2]|0);cs(b,c[b+364>>2]|0);cs(b,(c[b+368>>2]<<4)+(c[b+372>>2]|0)|0);return}function cA(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;ct(d,b);cu(d,((c[d+76>>2]|0)*3|0)+8|0);if((c[d+68>>2]|0)>65535){e=1551}else{if((c[d+64>>2]|0)>65535){e=1551}}if((e|0)==1551){c[(c[d>>2]|0)+20>>2]=42;c[(c[d>>2]|0)+24>>2]=65535;aT[c[c[d>>2]>>2]&63](d)}cs(d,c[d+72>>2]|0);cu(d,c[d+68>>2]|0);cu(d,c[d+64>>2]|0);cs(d,c[d+76>>2]|0);e=0;b=c[d+84>>2]|0;while(1){if((e|0)>=(c[d+76>>2]|0)){break}cs(d,c[b>>2]|0);cs(d,(c[b+8>>2]<<4)+(c[b+12>>2]|0)|0);cs(d,c[b+16>>2]|0);e=e+1|0;b=b+88|0}return}function cB(a){a=a|0;var b=0;b=a;ct(b,218);cu(b,6);cs(b,0);cs(b,0);cs(b,($(c[b+376>>2]|0,c[b+376>>2]|0)|0)-1|0);cs(b,0);return}function cC(a){a=a|0;var b=0;b=a;ct(b,224);cu(b,16);cs(b,74);cs(b,70);cs(b,73);cs(b,70);cs(b,0);cs(b,d[b+248|0]|0);cs(b,d[b+249|0]|0);cs(b,d[b+250|0]|0);cu(b,e[b+252>>1]|0);cu(b,e[b+254>>1]|0);cs(b,0);cs(b,0);return}function cD(a){a=a|0;var b=0;b=a;ct(b,238);cu(b,14);cs(b,65);cs(b,100);cs(b,111);cs(b,98);cs(b,101);cu(b,100);cu(b,0);cu(b,0);a=c[b+80>>2]|0;if((a|0)==3){cs(b,1);return}else if((a|0)==5){cs(b,2);return}else{cs(b,0);return}}function cE(a){a=a|0;var b=0,d=0;b=a;if((c[b+28>>2]>>24|0)!=0){d=1569}else{if((c[b+32>>2]>>24|0)!=0){d=1569}}if((d|0)==1569){c[(c[b>>2]|0)+20>>2]=42;c[(c[b>>2]|0)+24>>2]=65500;aT[c[c[b>>2]>>2]&63](b)}if((c[b+56>>2]|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=$(c[b+28>>2]|0,c[b+376>>2]|0)|0;c[b+68>>2]=$(c[b+32>>2]|0,c[b+376>>2]|0)|0;c[b+276>>2]=1;c[b+280>>2]=1;return}if(c[b+56>>2]<<1>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,2)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,2)|0;c[b+276>>2]=2;c[b+280>>2]=2}else{if(((c[b+56>>2]|0)*3|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,3)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,3)|0;c[b+276>>2]=3;c[b+280>>2]=3}else{if(c[b+56>>2]<<2>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,4)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,4)|0;c[b+276>>2]=4;c[b+280>>2]=4}else{if(((c[b+56>>2]|0)*5|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,5)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,5)|0;c[b+276>>2]=5;c[b+280>>2]=5}else{if(((c[b+56>>2]|0)*6|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,6)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,6)|0;c[b+276>>2]=6;c[b+280>>2]=6}else{if(((c[b+56>>2]|0)*7|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,7)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,7)|0;c[b+276>>2]=7;c[b+280>>2]=7}else{if(c[b+56>>2]<<3>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,8)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,8)|0;c[b+276>>2]=8;c[b+280>>2]=8}else{if(((c[b+56>>2]|0)*9|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,9)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,9)|0;c[b+276>>2]=9;c[b+280>>2]=9}else{if(((c[b+56>>2]|0)*10|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,10)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,10)|0;c[b+276>>2]=10;c[b+280>>2]=10}else{if(((c[b+56>>2]|0)*11|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,11)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,11)|0;c[b+276>>2]=11;c[b+280>>2]=11}else{if(((c[b+56>>2]|0)*12|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,12)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,12)|0;c[b+276>>2]=12;c[b+280>>2]=12}else{if(((c[b+56>>2]|0)*13|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,13)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,13)|0;c[b+276>>2]=13;c[b+280>>2]=13}else{if(((c[b+56>>2]|0)*14|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,14)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,14)|0;c[b+276>>2]=14;c[b+280>>2]=14}else{if(((c[b+56>>2]|0)*15|0)>>>0>=($(c[b+60>>2]|0,c[b+376>>2]|0)|0)>>>0){c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,15)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,15)|0;c[b+276>>2]=15;c[b+280>>2]=15}else{c[b+64>>2]=dV($(c[b+28>>2]|0,c[b+376>>2]|0)|0,16)|0;c[b+68>>2]=dV($(c[b+32>>2]|0,c[b+376>>2]|0)|0,16)|0;c[b+276>>2]=16;c[b+280>>2]=16}}}}}}}}}}}}}}return}function cF(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=aW[c[c[d+4>>2]>>2]&7](d,1,36)|0;c[d+388>>2]=b;c[b>>2]=32;c[b+4>>2]=44;c[b+8>>2]=8;c[b+16>>2]=0;cJ(d,a);if((c[d+204>>2]|0)!=0){cK(d);if((c[d+376>>2]|0)<8){cL(d)}}else{c[d+264>>2]=0;c[d+200>>2]=1}if((c[d+264>>2]|0)!=0){e=1625}else{if((c[d+376>>2]|0)<8){e=1625}}do{if((e|0)==1625){if((c[d+212>>2]|0)!=0){break}c[d+216>>2]=1}}while(0);if((a|0)!=0){if((c[d+216>>2]|0)!=0){c[b+20>>2]=1}else{c[b+20>>2]=2}}else{c[b+20>>2]=0}c[b+32>>2]=0;c[b+24>>2]=0;if((c[d+216>>2]|0)!=0){c[b+28>>2]=c[d+200>>2]<<1;return}else{c[b+28>>2]=c[d+200>>2];return}}function cG(a){a=a|0;var b=0,d=0,e=0,f=0;b=a;a=c[b+388>>2]|0;d=c[a+20>>2]|0;L2111:do{if((d|0)==2){e=1650}else if((d|0)==0){cN(b);cO(b);if((c[b+208>>2]|0)==0){aT[c[c[b+408>>2]>>2]&63](b);aT[c[c[b+412>>2]>>2]&63](b);aU[c[c[b+396>>2]>>2]&31](b,0)}aT[c[c[b+416>>2]>>2]&63](b);aU[c[c[b+420>>2]>>2]&31](b,c[b+216>>2]|0);aU[c[c[b+400>>2]>>2]&31](b,(c[a+28>>2]|0)>1?3:0);aU[c[c[b+392>>2]>>2]&31](b,0);if((c[b+216>>2]|0)!=0){c[a+12>>2]=0}else{c[a+12>>2]=1}}else if((d|0)==1){cN(b);cO(b);do{if((c[b+360>>2]|0)==0){if((c[b+368>>2]|0)==0){break}c[a+20>>2]=2;f=a+24|0;c[f>>2]=(c[f>>2]|0)+1;e=1650;break L2111}}while(0);aU[c[c[b+420>>2]>>2]&31](b,1);aU[c[c[b+400>>2]>>2]&31](b,2);c[a+12>>2]=0}else{c[(c[b>>2]|0)+20>>2]=49;aT[c[c[b>>2]>>2]&63](b)}}while(0);if((e|0)==1650){if((c[b+216>>2]|0)==0){cN(b);cO(b)}aU[c[c[b+420>>2]>>2]&31](b,0);aU[c[c[b+400>>2]>>2]&31](b,2);if((c[a+32>>2]|0)==0){aT[c[(c[b+404>>2]|0)+4>>2]&63](b)}aT[c[(c[b+404>>2]|0)+8>>2]&63](b);c[a+12>>2]=0}c[a+16>>2]=(c[a+24>>2]|0)==((c[a+28>>2]|0)-1|0);if((c[b+8>>2]|0)==0){return}c[(c[b+8>>2]|0)+12>>2]=c[a+24>>2];c[(c[b+8>>2]|0)+16>>2]=c[a+28>>2];return}function cH(a){a=a|0;var b=0;b=a;c[(c[b+388>>2]|0)+12>>2]=0;aT[c[(c[b+404>>2]|0)+4>>2]&63](b);aT[c[(c[b+404>>2]|0)+8>>2]&63](b);return}function cI(a){a=a|0;var b=0,d=0,e=0;b=a;a=c[b+388>>2]|0;aT[c[(c[b+420>>2]|0)+8>>2]&63](b);d=c[a+20>>2]|0;if((d|0)==0){c[a+20>>2]=2;if((c[b+216>>2]|0)==0){e=a+32|0;c[e>>2]=(c[e>>2]|0)+1}}else if((d|0)==1){c[a+20>>2]=2}else if((d|0)==2){if((c[b+216>>2]|0)!=0){c[a+20>>2]=1}b=a+32|0;c[b>>2]=(c[b>>2]|0)+1}b=a+24|0;c[b>>2]=(c[b>>2]|0)+1;return}function cJ(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0;d=a;if((b|0)!=0){cM(d)}else{cE(d)}if((c[d+376>>2]|0)<1){e=1676}else{if((c[d+376>>2]|0)>16){e=1676}}if((e|0)==1676){c[(c[d>>2]|0)+20>>2]=7;c[(c[d>>2]|0)+24>>2]=c[d+376>>2];c[(c[d>>2]|0)+28>>2]=c[d+376>>2];aT[c[c[d>>2]>>2]&63](d)}switch(c[d+376>>2]|0){case 3:{c[d+380>>2]=2456;break};case 7:{c[d+380>>2]=1688;break};case 5:{c[d+380>>2]=2160;break};case 6:{c[d+380>>2]=1952;break};case 4:{c[d+380>>2]=2328;break};case 2:{c[d+380>>2]=2560;break};default:{c[d+380>>2]=2640}}if((c[d+376>>2]|0)<8){f=($(c[d+376>>2]|0,c[d+376>>2]|0)|0)-1|0}else{f=63}c[d+384>>2]=f;do{if((c[d+68>>2]|0)>>>0<=0>>>0){e=1692}else{if((c[d+64>>2]|0)>>>0<=0>>>0){e=1692;break}if((c[d+76>>2]|0)<=0){e=1692;break}if((c[d+36>>2]|0)<=0){e=1692}}}while(0);if((e|0)==1692){c[(c[d>>2]|0)+20>>2]=33;aT[c[c[d>>2]>>2]&63](d)}if((c[d+68>>2]|0)>65500){e=1695}else{if((c[d+64>>2]|0)>65500){e=1695}}if((e|0)==1695){c[(c[d>>2]|0)+20>>2]=42;c[(c[d>>2]|0)+24>>2]=65500;aT[c[c[d>>2]>>2]&63](d)}f=$(c[d+28>>2]|0,c[d+36>>2]|0)|0;if((f|0)!=(f|0)){c[(c[d>>2]|0)+20>>2]=72;aT[c[c[d>>2]>>2]&63](d)}if((c[d+72>>2]|0)!=8){c[(c[d>>2]|0)+20>>2]=16;c[(c[d>>2]|0)+24>>2]=c[d+72>>2];aT[c[c[d>>2]>>2]&63](d)}if((c[d+76>>2]|0)>10){c[(c[d>>2]|0)+20>>2]=27;c[(c[d>>2]|0)+24>>2]=c[d+76>>2];c[(c[d>>2]|0)+28>>2]=10;aT[c[c[d>>2]>>2]&63](d)}c[d+268>>2]=1;c[d+272>>2]=1;f=0;b=c[d+84>>2]|0;while(1){if((f|0)>=(c[d+76>>2]|0)){break}do{if((c[b+8>>2]|0)<=0){e=1708}else{if((c[b+8>>2]|0)>4){e=1708;break}if((c[b+12>>2]|0)<=0){e=1708;break}if((c[b+12>>2]|0)>4){e=1708}}}while(0);if((e|0)==1708){e=0;c[(c[d>>2]|0)+20>>2]=19;aT[c[c[d>>2]>>2]&63](d)}if((c[d+268>>2]|0)>(c[b+8>>2]|0)){g=c[d+268>>2]|0}else{g=c[b+8>>2]|0}c[d+268>>2]=g;if((c[d+272>>2]|0)>(c[b+12>>2]|0)){h=c[d+272>>2]|0}else{h=c[b+12>>2]|0}c[d+272>>2]=h;f=f+1|0;b=b+88|0}f=0;b=c[d+84>>2]|0;while(1){if((f|0)>=(c[d+76>>2]|0)){break}c[b+4>>2]=f;h=1;while(1){g=$(c[d+276>>2]|0,h)|0;if((g|0)<=(((c[d+224>>2]|0)!=0?8:4)|0)){i=((c[d+268>>2]|0)%(($(c[b+8>>2]|0,h)|0)<<1|0)|0|0)==0}else{i=0}if(!i){break}h=h<<1}c[b+36>>2]=$(c[d+276>>2]|0,h)|0;h=1;while(1){g=$(c[d+280>>2]|0,h)|0;if((g|0)<=(((c[d+224>>2]|0)!=0?8:4)|0)){j=((c[d+272>>2]|0)%(($(c[b+12>>2]|0,h)|0)<<1|0)|0|0)==0}else{j=0}if(!j){break}h=h<<1}c[b+40>>2]=$(c[d+280>>2]|0,h)|0;if((c[b+36>>2]|0)>(c[b+40>>2]<<1|0)){c[b+36>>2]=c[b+40>>2]<<1}else{if((c[b+40>>2]|0)>(c[b+36>>2]<<1|0)){c[b+40>>2]=c[b+36>>2]<<1}}g=$(c[d+64>>2]|0,c[b+8>>2]|0)|0;c[b+28>>2]=dV(g,$(c[d+268>>2]|0,c[d+376>>2]|0)|0)|0;g=$(c[d+68>>2]|0,c[b+12>>2]|0)|0;c[b+32>>2]=dV(g,$(c[d+272>>2]|0,c[d+376>>2]|0)|0)|0;g=$(c[d+64>>2]|0,$(c[b+8>>2]|0,c[b+36>>2]|0)|0)|0;c[b+44>>2]=dV(g,$(c[d+268>>2]|0,c[d+376>>2]|0)|0)|0;g=$(c[d+68>>2]|0,$(c[b+12>>2]|0,c[b+40>>2]|0)|0)|0;c[b+48>>2]=dV(g,$(c[d+272>>2]|0,c[d+376>>2]|0)|0)|0;c[b+52>>2]=1;f=f+1|0;b=b+88|0}c[d+284>>2]=dV(c[d+68>>2]|0,$(c[d+272>>2]|0,c[d+376>>2]|0)|0)|0;return}function cK(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;b=i;i=i+2600|0;d=b|0;e=b+40|0;f=a;if((c[f+200>>2]|0)<=0){c[(c[f>>2]|0)+20>>2]=20;c[(c[f>>2]|0)+24>>2]=0;aT[c[c[f>>2]>>2]&63](f)}a=c[f+204>>2]|0;do{if((c[a+20>>2]|0)!=0){g=1741}else{if((c[a+24>>2]|0)!=63){g=1741;break}c[f+264>>2]=0;h=0;while(1){if((h|0)>=(c[f+76>>2]|0)){break}c[d+(h<<2)>>2]=0;h=h+1|0}}}while(0);if((g|0)==1741){c[f+264>>2]=1;j=e|0;h=0;while(1){if((h|0)>=(c[f+76>>2]|0)){break}k=0;while(1){if((k|0)>=64){break}l=j;j=l+4|0;c[l>>2]=-1;k=k+1|0}h=h+1|0}}l=1;while(1){if((l|0)>(c[f+200>>2]|0)){break}m=c[a>>2]|0;if((m|0)<=0){g=1759}else{if((m|0)>4){g=1759}}if((g|0)==1759){g=0;c[(c[f>>2]|0)+20>>2]=27;c[(c[f>>2]|0)+24>>2]=m;c[(c[f>>2]|0)+28>>2]=4;aT[c[c[f>>2]>>2]&63](f)}h=0;while(1){if((h|0)>=(m|0)){break}n=c[a+4+(h<<2)>>2]|0;if((n|0)<0){g=1764}else{if((n|0)>=(c[f+76>>2]|0)){g=1764}}if((g|0)==1764){g=0;c[(c[f>>2]|0)+20>>2]=20;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}do{if((h|0)>0){if((n|0)>(c[a+4+(h-1<<2)>>2]|0)){break}c[(c[f>>2]|0)+20>>2]=20;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}while(0);h=h+1|0}o=c[a+20>>2]|0;p=c[a+24>>2]|0;q=c[a+28>>2]|0;r=c[a+32>>2]|0;if((c[f+264>>2]|0)!=0){do{if((o|0)<0){g=1779}else{if((o|0)>=64){g=1779;break}if((p|0)<(o|0)){g=1779;break}if((p|0)>=64){g=1779;break}if((q|0)<0){g=1779;break}if((q|0)>10){g=1779;break}if((r|0)<0){g=1779;break}if((r|0)>10){g=1779}}}while(0);if((g|0)==1779){g=0;c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}if((o|0)==0){if((p|0)!=0){c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}else{if((m|0)!=1){c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}h=0;while(1){if((h|0)>=(m|0)){break}j=e+(c[a+4+(h<<2)>>2]<<8)|0;do{if((o|0)!=0){if((c[j>>2]|0)>=0){break}c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}while(0);k=o;while(1){if((k|0)>(p|0)){break}if((c[j+(k<<2)>>2]|0)<0){if((q|0)!=0){c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}else{if((q|0)!=(c[j+(k<<2)>>2]|0)){g=1800}else{if((r|0)!=(q-1|0)){g=1800}}if((g|0)==1800){g=0;c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}}c[j+(k<<2)>>2]=r;k=k+1|0}h=h+1|0}}else{do{if((o|0)!=0){g=1811}else{if((p|0)!=63){g=1811;break}if((q|0)!=0){g=1811;break}if((r|0)!=0){g=1811}}}while(0);if((g|0)==1811){g=0;c[(c[f>>2]|0)+20>>2]=18;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}h=0;while(1){if((h|0)>=(m|0)){break}n=c[a+4+(h<<2)>>2]|0;if((c[d+(n<<2)>>2]|0)!=0){c[(c[f>>2]|0)+20>>2]=20;c[(c[f>>2]|0)+24>>2]=l;aT[c[c[f>>2]>>2]&63](f)}c[d+(n<<2)>>2]=1;h=h+1|0}}a=a+36|0;l=l+1|0}if((c[f+264>>2]|0)!=0){h=0;while(1){if((h|0)>=(c[f+76>>2]|0)){break}if((c[e+(h<<8)>>2]|0)<0){c[(c[f>>2]|0)+20>>2]=46;aT[c[c[f>>2]>>2]&63](f)}h=h+1|0}i=b;return}else{h=0;while(1){if((h|0)>=(c[f+76>>2]|0)){break}if((c[d+(h<<2)>>2]|0)==0){c[(c[f>>2]|0)+20>>2]=46;aT[c[c[f>>2]>>2]&63](f)}h=h+1|0}i=b;return}}function cL(a){a=a|0;var b=0,d=0,e=0,f=0,g=0;b=a;a=c[b+204>>2]|0;d=0;e=0;while(1){if((e|0)>=(c[b+200>>2]|0)){break}if((e|0)!=(d|0)){f=a+(d*36|0)|0;g=a+(e*36|0)|0;er(f|0,g|0,36)|0}if((c[a+(d*36|0)+20>>2]|0)<=(c[b+384>>2]|0)){if((c[a+(d*36|0)+24>>2]|0)>(c[b+384>>2]|0)){c[a+(d*36|0)+24>>2]=c[b+384>>2]}d=d+1|0}e=e+1|0}c[b+200>>2]=d;return}function cM(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=a;if((c[b+276>>2]|0)==(c[b+280>>2]|0)){d=b;e=d+276|0;f=c[e>>2]|0;g=b;h=g+376|0;c[h>>2]=f;return}c[(c[b>>2]|0)+20>>2]=7;c[(c[b>>2]|0)+24>>2]=c[b+276>>2];c[(c[b>>2]|0)+28>>2]=c[b+280>>2];aT[c[c[b>>2]>>2]&63](b);d=b;e=d+276|0;f=c[e>>2]|0;g=b;h=g+376|0;c[h>>2]=f;return}function cN(a){a=a|0;var b=0,d=0;b=a;do{if((c[b+204>>2]|0)!=0){a=(c[b+204>>2]|0)+((c[(c[b+388>>2]|0)+32>>2]|0)*36|0)|0;c[b+288>>2]=c[a>>2];d=0;while(1){if((d|0)>=(c[a>>2]|0)){break}c[b+292+(d<<2)>>2]=(c[b+84>>2]|0)+((c[a+4+(d<<2)>>2]|0)*88|0);d=d+1|0}if((c[b+264>>2]|0)==0){break}c[b+360>>2]=c[a+20>>2];c[b+364>>2]=c[a+24>>2];c[b+368>>2]=c[a+28>>2];c[b+372>>2]=c[a+32>>2];return}else{if((c[b+76>>2]|0)>4){c[(c[b>>2]|0)+20>>2]=27;c[(c[b>>2]|0)+24>>2]=c[b+76>>2];c[(c[b>>2]|0)+28>>2]=4;aT[c[c[b>>2]>>2]&63](b)}c[b+288>>2]=c[b+76>>2];d=0;while(1){if((d|0)>=(c[b+76>>2]|0)){break}c[b+292+(d<<2)>>2]=(c[b+84>>2]|0)+(d*88|0);d=d+1|0}}}while(0);c[b+360>>2]=0;c[b+364>>2]=($(c[b+376>>2]|0,c[b+376>>2]|0)|0)-1;c[b+368>>2]=0;c[b+372>>2]=0;return}function cO(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0;b=a;if((c[b+288>>2]|0)==1){d=c[b+292>>2]|0;c[b+308>>2]=c[d+28>>2];c[b+312>>2]=c[d+32>>2];c[d+56>>2]=1;c[d+60>>2]=1;c[d+64>>2]=1;c[d+68>>2]=c[d+36>>2];c[d+72>>2]=1;e=((c[d+32>>2]|0)>>>0)%((c[d+12>>2]|0)>>>0)|0;if((e|0)==0){e=c[d+12>>2]|0}c[d+76>>2]=e;c[b+316>>2]=1;c[b+320>>2]=0}else{if((c[b+288>>2]|0)<=0){f=1880}else{if((c[b+288>>2]|0)>4){f=1880}}if((f|0)==1880){c[(c[b>>2]|0)+20>>2]=27;c[(c[b>>2]|0)+24>>2]=c[b+288>>2];c[(c[b>>2]|0)+28>>2]=4;aT[c[c[b>>2]>>2]&63](b)}c[b+308>>2]=dV(c[b+64>>2]|0,$(c[b+268>>2]|0,c[b+376>>2]|0)|0)|0;c[b+312>>2]=dV(c[b+68>>2]|0,$(c[b+272>>2]|0,c[b+376>>2]|0)|0)|0;c[b+316>>2]=0;f=0;while(1){if((f|0)>=(c[b+288>>2]|0)){break}d=c[b+292+(f<<2)>>2]|0;c[d+56>>2]=c[d+8>>2];c[d+60>>2]=c[d+12>>2];c[d+64>>2]=$(c[d+56>>2]|0,c[d+60>>2]|0)|0;c[d+68>>2]=$(c[d+56>>2]|0,c[d+36>>2]|0)|0;e=((c[d+28>>2]|0)>>>0)%((c[d+56>>2]|0)>>>0)|0;if((e|0)==0){e=c[d+56>>2]|0}c[d+72>>2]=e;e=((c[d+32>>2]|0)>>>0)%((c[d+60>>2]|0)>>>0)|0;if((e|0)==0){e=c[d+60>>2]|0}c[d+76>>2]=e;a=c[d+64>>2]|0;if(((c[b+316>>2]|0)+a|0)>10){c[(c[b>>2]|0)+20>>2]=14;aT[c[c[b>>2]>>2]&63](b)}while(1){g=a;a=g-1|0;if((g|0)<=0){break}g=b+316|0;h=c[g>>2]|0;c[g>>2]=h+1;c[b+320+(h<<2)>>2]=f}f=f+1|0}}if((c[b+240>>2]|0)<=0){return}f=$(c[b+240>>2]|0,c[b+308>>2]|0)|0;if((f|0)<65535){i=f}else{i=65535}c[b+236>>2]=i;return}function cP(a){a=a|0;var b=0;b=a;if((c[b+4>>2]|0)==0){return}a=1;while(1){if((a|0)<=0){break}aU[c[(c[b+4>>2]|0)+36>>2]&31](b,a);a=a-1|0}if((c[b+16>>2]|0)!=0){c[b+20>>2]=200;c[b+308>>2]=0;return}else{c[b+20>>2]=100;return}}function cQ(a){a=a|0;var b=0;b=a;if((c[b+4>>2]|0)!=0){aT[c[(c[b+4>>2]|0)+40>>2]&63](b)}c[b+4>>2]=0;c[b+20>>2]=0;return}function cR(a){a=a|0;var b=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,0,132)|0;c[a+128>>2]=0;return a|0}function cS(a){a=a|0;var b=0;b=a;a=aW[c[c[b+4>>2]>>2]&7](b,0,280)|0;c[a+276>>2]=0;return a|0}function cT(a,d,e,f,g){a=a|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=a;a=d;d=e;e=f;f=g;if((c[h+20>>2]|0)!=100){c[(c[h>>2]|0)+20>>2]=21;c[(c[h>>2]|0)+24>>2]=c[h+20>>2];aT[c[c[h>>2]>>2]&63](h)}if((a|0)<0){i=1925}else{if((a|0)>=4){i=1925}}if((i|0)==1925){c[(c[h>>2]|0)+20>>2]=32;c[(c[h>>2]|0)+24>>2]=a;aT[c[c[h>>2]>>2]&63](h)}i=h+88+(a<<2)|0;if((c[i>>2]|0)==0){c[i>>2]=cR(h)|0}h=0;while(1){if((h|0)>=64){break}a=(($(c[d+(h<<2)>>2]|0,e)|0)+50|0)/100|0;if((a|0)<=0){a=1}if((a|0)>32767){a=32767}do{if((f|0)!=0){if((a|0)<=255){break}a=255}}while(0);b[(c[i>>2]|0)+(h<<1)>>1]=a&65535;h=h+1|0}c[(c[i>>2]|0)+128>>2]=0;return}function cU(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=a;a=b;b=c;cT(d,0,8,a,b);cT(d,1,728,a,b);return}function cV(a){a=a|0;var b=0,c=0;b=a;if((b|0)<=0){b=1}if((b|0)>100){b=100}if((b|0)<50){b=5e3/(b|0)|0;c=b;return c|0}else{b=200-(b<<1)|0;c=b;return c|0}return 0}function cW(a,b,c){a=a|0;b=b|0;c=c|0;var d=0;d=b;d=cV(d)|0;cU(a,d,c);return}function cX(d){d=d|0;var e=0;e=d;if((c[e+20>>2]|0)!=100){c[(c[e>>2]|0)+20>>2]=21;c[(c[e>>2]|0)+24>>2]=c[e+20>>2];aT[c[c[e>>2]>>2]&63](e)}if((c[e+84>>2]|0)==0){c[e+84>>2]=aW[c[c[e+4>>2]>>2]&7](e,0,880)|0}c[e+56>>2]=1;c[e+60>>2]=1;c[e+72>>2]=8;cW(e,75,1);cY(e);d=0;while(1){if((d|0)>=16){break}a[e+152+d|0]=0;a[e+168+d|0]=1;a[e+184+d|0]=5;d=d+1|0}c[e+204>>2]=0;c[e+200>>2]=0;c[e+208>>2]=0;c[e+212>>2]=0;c[e+216>>2]=0;if((c[e+72>>2]|0)>8){c[e+216>>2]=1}c[e+220>>2]=0;c[e+224>>2]=1;c[e+228>>2]=0;c[e+232>>2]=0;c[e+236>>2]=0;c[e+240>>2]=0;a[e+248|0]=1;a[e+249|0]=1;a[e+250|0]=0;b[e+252>>1]=1;b[e+254>>1]=1;cZ(e);return}function cY(a){a=a|0;var b=0;b=a;c$(b,b+120|0,632,264);c$(b,b+136|0,680,296);c$(b,b+124|0,656,280);c$(b,b+140|0,704,464);return}function cZ(a){a=a|0;var b=0;b=a;switch(c[b+40>>2]|0){case 4:{c_(b,4);return};case 2:{c_(b,3);return};case 1:{c_(b,1);return};case 0:{c_(b,0);return};case 3:{c_(b,3);return};case 5:{c_(b,5);return};default:{c[(c[b>>2]|0)+20>>2]=10;aT[c[c[b>>2]>>2]&63](b);return}}}function c_(a,b){a=a|0;b=b|0;var d=0,e=0,f=0;d=a;a=b;if((c[d+20>>2]|0)!=100){c[(c[d>>2]|0)+20>>2]=21;c[(c[d>>2]|0)+24>>2]=c[d+20>>2];aT[c[c[d>>2]>>2]&63](d)}c[d+80>>2]=a;c[d+244>>2]=0;c[d+256>>2]=0;switch(a|0){case 0:{c[d+76>>2]=c[d+36>>2];if((c[d+76>>2]|0)<1){e=1990}else{if((c[d+76>>2]|0)>10){e=1990}}if((e|0)==1990){c[(c[d>>2]|0)+20>>2]=27;c[(c[d>>2]|0)+24>>2]=c[d+76>>2];c[(c[d>>2]|0)+28>>2]=10;aT[c[c[d>>2]>>2]&63](d)}e=0;while(1){if((e|0)>=(c[d+76>>2]|0)){break}f=(c[d+84>>2]|0)+(e*88|0)|0;c[f>>2]=e;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;e=e+1|0}return};case 1:{c[d+244>>2]=1;c[d+76>>2]=1;f=c[d+84>>2]|0;c[f>>2]=1;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;return};case 3:{c[d+244>>2]=1;c[d+76>>2]=3;f=c[d+84>>2]|0;c[f>>2]=1;c[f+8>>2]=2;c[f+12>>2]=2;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+88|0;c[f>>2]=2;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=1;c[f+20>>2]=1;c[f+24>>2]=1;f=(c[d+84>>2]|0)+176|0;c[f>>2]=3;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=1;c[f+20>>2]=1;c[f+24>>2]=1;return};case 4:{c[d+256>>2]=1;c[d+76>>2]=4;f=c[d+84>>2]|0;c[f>>2]=67;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+88|0;c[f>>2]=77;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+176|0;c[f>>2]=89;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+264|0;c[f>>2]=75;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;return};case 5:{c[d+256>>2]=1;c[d+76>>2]=4;f=c[d+84>>2]|0;c[f>>2]=1;c[f+8>>2]=2;c[f+12>>2]=2;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+88|0;c[f>>2]=2;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=1;c[f+20>>2]=1;c[f+24>>2]=1;f=(c[d+84>>2]|0)+176|0;c[f>>2]=3;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=1;c[f+20>>2]=1;c[f+24>>2]=1;f=(c[d+84>>2]|0)+264|0;c[f>>2]=4;c[f+8>>2]=2;c[f+12>>2]=2;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;return};case 2:{c[d+256>>2]=1;c[d+76>>2]=3;f=c[d+84>>2]|0;c[f>>2]=82;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+88|0;c[f>>2]=71;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;f=(c[d+84>>2]|0)+176|0;c[f>>2]=66;c[f+8>>2]=1;c[f+12>>2]=1;c[f+16>>2]=0;c[f+20>>2]=0;c[f+24>>2]=0;return};default:{c[(c[d>>2]|0)+20>>2]=11;aT[c[c[d>>2]>>2]&63](d);return}}}function c$(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0;g=a;a=b;b=e;e=f;if((c[a>>2]|0)==0){c[a>>2]=cS(g)|0}f=c[a>>2]|0;h=b;er(f|0,h|0,17)|0;h=0;f=1;while(1){if((f|0)>16){break}h=h+(d[b+f|0]|0)|0;f=f+1|0}if((h|0)<1){i=2013}else{if((h|0)>256){i=2013}}if((i|0)==2013){c[(c[g>>2]|0)+20>>2]=9;aT[c[c[g>>2]>>2]&63](g)}g=(c[a>>2]|0)+17|0;i=e;e=h;er(g|0,i|0,e)|0;c[(c[a>>2]|0)+276>>2]=0;return}function c0(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;d=a;if((b|0)!=0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d)}b=aW[c[c[d+4>>2]>>2]&7](d,1,64)|0;c[d+396>>2]=b;c[b>>2]=10;if((c[(c[d+412>>2]|0)+8>>2]|0)!=0){c[b+4>>2]=4;c3(d);return}c[b+4>>2]=2;a=0;e=c[d+84>>2]|0;while(1){if((a|0)>=(c[d+76>>2]|0)){break}f=$(c[e+28>>2]|0,c[d+276>>2]|0)|0;g=$(f,c[d+268>>2]|0)|0;c[b+8+(a<<2)>>2]=a_[c[(c[d+4>>2]|0)+8>>2]&7](d,1,(g|0)/(c[e+8>>2]|0)|0,c[d+272>>2]|0)|0;a=a+1|0;e=e+88|0}return}function c1(a,b){a=a|0;b=b|0;var d=0;d=a;a=c[d+396>>2]|0;if((b|0)!=0){c[(c[d>>2]|0)+20>>2]=3;aT[c[c[d>>2]>>2]&63](d)}c[a+48>>2]=c[d+32>>2];c[a+52>>2]=0;c[a+56>>2]=0;c[a+60>>2]=c[d+272>>2]<<1;return}function c2(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=c[i+396>>2]|0;j=(c[i+272>>2]|0)*3|0;while(1){if((c[f>>2]|0)>>>0>=g>>>0){k=2065;break}if((c[b>>2]|0)>>>0<d>>>0){l=d-(c[b>>2]|0)|0;m=(c[h+60>>2]|0)-(c[h+52>>2]|0)|0;if(m>>>0<l>>>0){n=m}else{n=l}m=n;aR[c[(c[i+408>>2]|0)+4>>2]&15](i,a+(c[b>>2]<<2)|0,h+8|0,c[h+52>>2]|0,m);if((c[h+48>>2]|0)==(c[i+32>>2]|0)){o=0;while(1){if((o|0)>=(c[i+76>>2]|0)){break}l=1;while(1){if((l|0)>(c[i+272>>2]|0)){break}dX(c[h+8+(o<<2)>>2]|0,0,c[h+8+(o<<2)>>2]|0,-l|0,1,c[i+28>>2]|0);l=l+1|0}o=o+1|0}}l=b;c[l>>2]=(c[l>>2]|0)+m;l=h+52|0;c[l>>2]=(c[l>>2]|0)+m;l=h+48|0;c[l>>2]=(c[l>>2]|0)-m}else{if((c[h+48>>2]|0)!=0){break}if((c[h+52>>2]|0)<(c[h+60>>2]|0)){o=0;while(1){if((o|0)>=(c[i+76>>2]|0)){break}c5(c[h+8+(o<<2)>>2]|0,c[i+28>>2]|0,c[h+52>>2]|0,c[h+60>>2]|0);o=o+1|0}c[h+52>>2]=c[h+60>>2]}}if((c[h+52>>2]|0)==(c[h+60>>2]|0)){aR[c[(c[i+412>>2]|0)+4>>2]&15](i,h+8|0,c[h+56>>2]|0,e,c[f>>2]|0);m=f;c[m>>2]=(c[m>>2]|0)+1;m=h+56|0;c[m>>2]=(c[m>>2]|0)+(c[i+272>>2]|0);if((c[h+56>>2]|0)>=(j|0)){c[h+56>>2]=0}if((c[h+52>>2]|0)>=(j|0)){c[h+52>>2]=0}c[h+60>>2]=(c[h+52>>2]|0)+(c[i+272>>2]|0)}}if((k|0)==2065){return}return}function c3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0;b=a;a=c[b+396>>2]|0;d=c[b+272>>2]|0;e=($((c[b+76>>2]|0)*5|0,d)|0)<<2;f=aW[c[c[b+4>>2]>>2]&7](b,1,e)|0;e=0;g=c[b+84>>2]|0;while(1){if((e|0)>=(c[b+76>>2]|0)){break}h=$(c[g+28>>2]|0,c[b+276>>2]|0)|0;i=$(h,c[b+268>>2]|0)|0;h=a_[c[(c[b+4>>2]|0)+8>>2]&7](b,1,(i|0)/(c[g+8>>2]|0)|0,d*3|0)|0;i=f+(d<<2)|0;j=h;k=(d*3|0)<<2;er(i|0,j|0,k)|0;k=0;while(1){if((k|0)>=(d|0)){break}c[f+(k<<2)>>2]=c[h+((d<<1)+k<<2)>>2];c[f+((d<<2)+k<<2)>>2]=c[h+(k<<2)>>2];k=k+1|0}c[a+8+(e<<2)>>2]=f+(d<<2);f=f+((d*5|0)<<2)|0;e=e+1|0;g=g+88|0}return}function c4(a,b,d,e,f,g,h){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0;i=a;a=b;b=d;d=e;e=f;f=g;g=h;h=c[i+396>>2]|0;while(1){if((c[b>>2]|0)>>>0<d>>>0){j=(c[f>>2]|0)>>>0<g>>>0}else{j=0}if(!j){k=2100;break}l=d-(c[b>>2]|0)|0;m=(c[i+272>>2]|0)-(c[h+52>>2]|0)|0;if(m>>>0<l>>>0){n=m}else{n=l}m=n;aR[c[(c[i+408>>2]|0)+4>>2]&15](i,a+(c[b>>2]<<2)|0,h+8|0,c[h+52>>2]|0,m);l=b;c[l>>2]=(c[l>>2]|0)+m;l=h+52|0;c[l>>2]=(c[l>>2]|0)+m;l=h+48|0;c[l>>2]=(c[l>>2]|0)-m;do{if((c[h+48>>2]|0)==0){if((c[h+52>>2]|0)>=(c[i+272>>2]|0)){break}o=0;while(1){if((o|0)>=(c[i+76>>2]|0)){break}c5(c[h+8+(o<<2)>>2]|0,c[i+28>>2]|0,c[h+52>>2]|0,c[i+272>>2]|0);o=o+1|0}c[h+52>>2]=c[i+272>>2]}}while(0);if((c[h+52>>2]|0)==(c[i+272>>2]|0)){aR[c[(c[i+412>>2]|0)+4>>2]&15](i,h+8|0,0,e,c[f>>2]|0);c[h+52>>2]=0;l=f;c[l>>2]=(c[l>>2]|0)+1}if((c[h+48>>2]|0)==0){if((c[f>>2]|0)>>>0<g>>>0){break}}}if((k|0)==2100){return}o=0;k=c[i+84>>2]|0;while(1){if((o|0)>=(c[i+76>>2]|0)){break}h=$(c[k+12>>2]|0,c[k+40>>2]|0)|0;m=(h|0)/(c[i+280>>2]|0)|0;h=$(c[k+28>>2]|0,c[k+36>>2]|0)|0;c5(c[e+(o<<2)>>2]|0,h,$(c[f>>2]|0,m)|0,$(g,m)|0);o=o+1|0;k=k+88|0}c[f>>2]=g;return}function c5(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a;a=b;b=c;c=d;d=b;while(1){if((d|0)>=(c|0)){break}dX(e,b-1|0,e,d,1,a);d=d+1|0}return}function c6(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=b;b=1;e=aW[c[c[d+4>>2]>>2]&7](d,1,112)|0;c[d+412>>2]=e;c[e>>2]=40;c[e+4>>2]=12;c[e+8>>2]=0;if((c[d+220>>2]|0)!=0){c[(c[d>>2]|0)+20>>2]=26;aT[c[c[d>>2]>>2]&63](d)}f=0;g=c[d+84>>2]|0;while(1){if((f|0)>=(c[d+76>>2]|0)){break}h=$(c[g+8>>2]|0,c[g+36>>2]|0)|0;i=(h|0)/(c[d+276>>2]|0)|0;h=$(c[g+12>>2]|0,c[g+40>>2]|0)|0;j=(h|0)/(c[d+280>>2]|0)|0;h=c[d+268>>2]|0;k=c[d+272>>2]|0;c[e+52+(f<<2)>>2]=j;do{if((h|0)==(i|0)){if((k|0)!=(j|0)){l=2117;break}if((c[d+228>>2]|0)!=0){c[e+12+(f<<2)>>2]=2;c[e+8>>2]=1}else{c[e+12+(f<<2)>>2]=6}}else{l=2117}}while(0);if((l|0)==2117){l=0;do{if((h|0)==(i<<1|0)){if((k|0)!=(j|0)){l=2120;break}b=0;c[e+12+(f<<2)>>2]=4}else{l=2120}}while(0);if((l|0)==2120){l=0;do{if((h|0)==(i<<1|0)){if((k|0)!=(j<<1|0)){l=2126;break}if((c[d+228>>2]|0)!=0){c[e+12+(f<<2)>>2]=14;c[e+8>>2]=1}else{c[e+12+(f<<2)>>2]=10}}else{l=2126}}while(0);if((l|0)==2126){l=0;do{if(((h|0)%(i|0)|0|0)==0){if(((k|0)%(j|0)|0|0)!=0){l=2129;break}b=0;c[e+12+(f<<2)>>2]=8;a[e+92+f|0]=((h|0)/(i|0)|0)&255;a[e+102+f|0]=((k|0)/(j|0)|0)&255}else{l=2129}}while(0);if((l|0)==2129){l=0;c[(c[d>>2]|0)+20>>2]=39;aT[c[c[d>>2]>>2]&63](d)}}}}f=f+1|0;g=g+88|0}if((c[d+228>>2]|0)==0){return}if((b|0)!=0){return}c[(c[d>>2]|0)+20>>2]=101;aU[c[(c[d>>2]|0)+4>>2]&31](d,0);return}function c7(a){a=a|0;return}function c8(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0;g=a;a=b;b=d;d=e;e=f;f=c[g+412>>2]|0;h=0;i=c[g+84>>2]|0;while(1){if((h|0)>=(c[g+76>>2]|0)){break}j=(c[d+(h<<2)>>2]|0)+(($(e,c[f+52+(h<<2)>>2]|0)|0)<<2)|0;a1[c[f+12+(h<<2)>>2]&15](g,i,(c[a+(h<<2)>>2]|0)+(b<<2)|0,j);h=h+1|0;i=i+88|0}return}function c9(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=b;b=e;e=f;f=g;g=$(c[b+28>>2]|0,c[b+36>>2]|0)|0;df(e-4|0,(c[h+272>>2]|0)+2|0,c[h+28>>2]|0,g);b=65536-(c[h+228>>2]<<9)|0;i=c[h+228>>2]<<6;j=0;while(1){if((j|0)>=(c[h+272>>2]|0)){break}k=c[f+(j<<2)>>2]|0;l=c[e+(j<<2)>>2]|0;m=c[e+(j-1<<2)>>2]|0;n=c[e+(j+1<<2)>>2]|0;o=m;m=o+1|0;p=n;n=p+1|0;q=(d[o]|0)+(d[p]|0)+(d[l]|0)|0;p=l;l=p+1|0;o=d[p]|0;p=(d[m]|0)+(d[n]|0)+(d[l]|0)|0;r=q+(q-o)+p|0;o=($(o,b)|0)+($(r,i)|0)|0;s=k;k=s+1|0;a[s]=o+32768>>16&255;s=q;q=p;t=g-2|0;while(1){if(t>>>0<=0>>>0){break}u=l;l=u+1|0;o=d[u]|0;m=m+1|0;n=n+1|0;p=(d[m]|0)+(d[n]|0)+(d[l]|0)|0;r=s+(q-o)+p|0;o=($(o,b)|0)+($(r,i)|0)|0;u=k;k=u+1|0;a[u]=o+32768>>16&255;s=q;q=p;t=t-1|0}o=d[l]|0;r=s+(q-o)+q|0;o=($(o,b)|0)+($(r,i)|0)|0;a[k]=o+32768>>16&255;j=j+1|0}return}function da(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0;f=a;a=b;b=e;dX(d,0,b,0,c[f+272>>2]|0,c[f+28>>2]|0);df(b,c[f+272>>2]|0,c[f+28>>2]|0,$(c[a+28>>2]|0,c[a+36>>2]|0)|0);return}function db(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0;h=b;b=e;e=f;f=g;g=$(c[b+28>>2]|0,c[b+36>>2]|0)|0;df(e,c[h+272>>2]|0,c[h+28>>2]|0,g<<1);b=0;while(1){if((b|0)>=(c[h+272>>2]|0)){break}i=c[f+(b<<2)>>2]|0;j=c[e+(b<<2)>>2]|0;k=0;l=0;while(1){if(l>>>0>=g>>>0){break}m=i;i=m+1|0;a[m]=(d[j]|0)+(d[j+1|0]|0)+k>>1&255;k=k^1;j=j+2|0;l=l+1|0}b=b+1|0}return}function dc(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;h=b;b=e;e=f;f=g;g=$(c[b+28>>2]|0,c[b+36>>2]|0)|0;df(e-4|0,(c[h+272>>2]|0)+2|0,c[h+28>>2]|0,g<<1);b=16384-((c[h+228>>2]|0)*80|0)|0;i=c[h+228>>2]<<4;j=0;k=0;while(1){if((k|0)>=(c[h+272>>2]|0)){break}l=c[f+(j<<2)>>2]|0;m=c[e+(k<<2)>>2]|0;n=c[e+(k+1<<2)>>2]|0;o=c[e+(k-1<<2)>>2]|0;p=c[e+(k+2<<2)>>2]|0;q=(d[m]|0)+(d[m+1|0]|0)+(d[n]|0)+(d[n+1|0]|0)|0;r=(d[o]|0)+(d[o+1|0]|0)+(d[p]|0)+(d[p+1|0]|0)+(d[m]|0)+(d[m+2|0]|0)+(d[n]|0)+(d[n+2|0]|0)|0;r=r+r|0;r=r+((d[o]|0)+(d[o+2|0]|0)+(d[p]|0)+(d[p+2|0]|0))|0;q=($(q,b)|0)+($(r,i)|0)|0;s=l;l=s+1|0;a[s]=q+32768>>16&255;m=m+2|0;n=n+2|0;o=o+2|0;p=p+2|0;s=g-2|0;while(1){if(s>>>0<=0>>>0){break}q=(d[m]|0)+(d[m+1|0]|0)+(d[n]|0)+(d[n+1|0]|0)|0;r=(d[o]|0)+(d[o+1|0]|0)+(d[p]|0)+(d[p+1|0]|0)+(d[m-1|0]|0)+(d[m+2|0]|0)+(d[n-1|0]|0)+(d[n+2|0]|0)|0;r=r+r|0;r=r+((d[o-1|0]|0)+(d[o+2|0]|0)+(d[p-1|0]|0)+(d[p+2|0]|0))|0;q=($(q,b)|0)+($(r,i)|0)|0;t=l;l=t+1|0;a[t]=q+32768>>16&255;m=m+2|0;n=n+2|0;o=o+2|0;p=p+2|0;s=s-1|0}q=(d[m]|0)+(d[m+1|0]|0)+(d[n]|0)+(d[n+1|0]|0)|0;r=(d[o]|0)+(d[o+1|0]|0)+(d[p]|0)+(d[p+1|0]|0)+(d[m-1|0]|0)+(d[m+1|0]|0)+(d[n-1|0]|0)+(d[n+1|0]|0)|0;r=r+r|0;r=r+((d[o-1|0]|0)+(d[o+1|0]|0)+(d[p-1|0]|0)+(d[p+1|0]|0))|0;q=($(q,b)|0)+($(r,i)|0)|0;a[l]=q+32768>>16&255;k=k+2|0;j=j+1|0}return}function dd(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;h=b;b=e;e=f;f=g;g=$(c[b+28>>2]|0,c[b+36>>2]|0)|0;df(e,c[h+272>>2]|0,c[h+28>>2]|0,g<<1);b=0;i=0;while(1){if((i|0)>=(c[h+272>>2]|0)){break}j=c[f+(b<<2)>>2]|0;k=c[e+(i<<2)>>2]|0;l=c[e+(i+1<<2)>>2]|0;m=1;n=0;while(1){if(n>>>0>=g>>>0){break}o=j;j=o+1|0;a[o]=(d[k]|0)+(d[k+1|0]|0)+(d[l]|0)+(d[l+1|0]|0)+m>>2&255;m=m^3;k=k+2|0;l=l+2|0;n=n+1|0}i=i+2|0;b=b+1|0}return}function de(b,e,f,g){b=b|0;e=e|0;f=f|0;g=g|0;var h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;h=b;b=e;e=f;f=g;g=c[h+412>>2]|0;i=$(c[b+28>>2]|0,c[b+36>>2]|0)|0;j=d[g+92+(c[b+4>>2]|0)|0]|0;k=d[g+102+(c[b+4>>2]|0)|0]|0;b=$(j,k)|0;g=(b|0)/2|0;df(e,c[h+272>>2]|0,c[h+28>>2]|0,$(i,j)|0);l=0;m=0;while(1){if((m|0)>=(c[h+272>>2]|0)){break}n=c[f+(l<<2)>>2]|0;o=0;p=0;while(1){if(o>>>0>=i>>>0){break}q=0;r=0;while(1){if((r|0)>=(k|0)){break}s=(c[e+(m+r<<2)>>2]|0)+p|0;t=0;while(1){if((t|0)>=(j|0)){break}u=s;s=u+1|0;q=q+(d[u]|0)|0;t=t+1|0}r=r+1|0}r=n;n=r+1|0;a[r]=((q+g|0)/(b|0)|0)&255;o=o+1|0;p=p+j|0}m=m+k|0;l=l+1|0}return}function df(b,d,e,f){b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0;g=b;b=d;d=e;e=f-d|0;if((e|0)<=0){return}f=0;while(1){if((f|0)>=(b|0)){break}h=(c[g+(f<<2)>>2]|0)+d|0;i=a[h-1|0]|0;j=e;while(1){if((j|0)<=0){break}k=h;h=k+1|0;a[k]=i;j=j-1|0}f=f+1|0}return}function dg(a){a=a|0;var b=0;b=a;c[b>>2]=12;c[b+4>>2]=6;c[b+8>>2]=26;c[b+12>>2]=16;c[b+16>>2]=42;c[b+104>>2]=0;c[b+108>>2]=0;c[b+20>>2]=0;c[b+112>>2]=1176;c[b+116>>2]=126;c[b+120>>2]=0;c[b+124>>2]=0;c[b+128>>2]=0;return b|0}function dh(a){a=a|0;var b=0;b=a;aT[c[(c[b>>2]|0)+8>>2]&63](b);cQ(b);aG(1);return}function di(a,b){a=a|0;b=b|0;var d=0,e=0;d=a;a=b;b=c[d>>2]|0;if((a|0)>=0){if((c[b+104>>2]|0)>=(a|0)){aT[c[b+8>>2]&63](d)}return}if((c[b+108>>2]|0)==0){e=2217}else{if((c[b+104>>2]|0)>=3){e=2217}}if((e|0)==2217){aT[c[b+8>>2]&63](d)}d=b+108|0;c[d>>2]=(c[d>>2]|0)+1;return}function dj(a){a=a|0;var b=0,d=0,e=0;b=i;i=i+200|0;d=b|0;e=a;aU[c[(c[e>>2]|0)+12>>2]&31](e,d|0);ax(c[m>>2]|0,6776,(e=i,i=i+8|0,c[e>>2]=d,e)|0)|0;i=e;i=b;return}function dk(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;e=i;f=d;d=c[b>>2]|0;b=c[d+20>>2]|0;g=0;do{if((b|0)>0){if((b|0)>(c[d+116>>2]|0)){h=2229;break}g=c[(c[d+112>>2]|0)+(b<<2)>>2]|0}else{h=2229}}while(0);if((h|0)==2229){do{if((c[d+120>>2]|0)!=0){if((b|0)<(c[d+124>>2]|0)){break}if((b|0)>(c[d+128>>2]|0)){break}g=c[(c[d+120>>2]|0)+(b-(c[d+124>>2]|0)<<2)>>2]|0}}while(0)}if((g|0)==0){c[d+24>>2]=b;g=c[c[d+112>>2]>>2]|0}b=0;j=g;while(1){k=j;j=k+1|0;l=a[k]|0;if((l<<24>>24|0)==0){break}if((l<<24>>24|0)==37){h=2239;break}}if((h|0)==2239){if((a[j]|0)==115){b=1}}if((b|0)!=0){b=f;j=g;h=d+24|0;aH(b|0,j|0,(m=i,i=i+8|0,c[m>>2]=h,m)|0)|0;i=m;i=e;return}else{h=f;f=g;g=c[d+24>>2]|0;j=c[d+28>>2]|0;b=c[d+32>>2]|0;l=c[d+36>>2]|0;k=c[d+40>>2]|0;n=c[d+44>>2]|0;o=c[d+48>>2]|0;p=c[d+52>>2]|0;aH(h|0,f|0,(m=i,i=i+64|0,c[m>>2]=g,c[m+8>>2]=j,c[m+16>>2]=b,c[m+24>>2]=l,c[m+32>>2]=k,c[m+40>>2]=n,c[m+48>>2]=o,c[m+56>>2]=p,m)|0)|0;i=m;i=e;return}}function dl(a){a=a|0;var b=0;b=a;c[(c[b>>2]|0)+108>>2]=0;c[(c[b>>2]|0)+20>>2]=0;return}function dm(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,h=0,i=0,j=0.0,k=0.0,l=0.0,m=0.0,n=0.0,o=0.0,p=0.0,q=0.0,r=0.0,s=0.0,t=0.0,u=0.0,v=0.0,w=0.0,x=0.0,y=0.0,z=0.0,A=0.0,B=0.0;f=a;a=b;b=e;e=f;h=0;while(1){if((h|0)>=8){break}i=(c[a+(h<<2)>>2]|0)+b|0;j=+((d[i|0]|0)+(d[i+7|0]|0)|0);k=+((d[i|0]|0)-(d[i+7|0]|0)|0);l=+((d[i+1|0]|0)+(d[i+6|0]|0)|0);m=+((d[i+1|0]|0)-(d[i+6|0]|0)|0);n=+((d[i+2|0]|0)+(d[i+5|0]|0)|0);o=+((d[i+2|0]|0)-(d[i+5|0]|0)|0);p=+((d[i+3|0]|0)+(d[i+4|0]|0)|0);q=+((d[i+3|0]|0)-(d[i+4|0]|0)|0);r=j+p;s=j-p;t=l+n;u=l-n;g[e>>2]=r+t-1024.0;g[e+16>>2]=r-t;v=(u+s)*.7071067690849304;g[e+8>>2]=s+v;g[e+24>>2]=s-v;r=q+o;t=o+m;u=m+k;w=(r-u)*.3826834261417389;x=.5411961078643799*r+w;y=1.3065630197525024*u+w;z=t*.7071067690849304;A=k+z;B=k-z;g[e+20>>2]=B+x;g[e+12>>2]=B-x;g[e+4>>2]=A+y;g[e+28>>2]=A-y;e=e+32|0;h=h+1|0}e=f;h=7;while(1){if((h|0)<0){break}j=+g[e>>2]+ +g[e+224>>2];k=+g[e>>2]- +g[e+224>>2];l=+g[e+32>>2]+ +g[e+192>>2];m=+g[e+32>>2]- +g[e+192>>2];n=+g[e+64>>2]+ +g[e+160>>2];o=+g[e+64>>2]- +g[e+160>>2];p=+g[e+96>>2]+ +g[e+128>>2];q=+g[e+96>>2]- +g[e+128>>2];r=j+p;s=j-p;t=l+n;u=l-n;g[e>>2]=r+t;g[e+128>>2]=r-t;v=(u+s)*.7071067690849304;g[e+64>>2]=s+v;g[e+192>>2]=s-v;r=q+o;t=o+m;u=m+k;w=(r-u)*.3826834261417389;x=.5411961078643799*r+w;y=1.3065630197525024*u+w;z=t*.7071067690849304;A=k+z;B=k-z;g[e+160>>2]=B+x;g[e+96>>2]=B-x;g[e+32>>2]=A+y;g[e+224>>2]=A-y;e=e+4|0;h=h-1|0}return}function dn(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=a;a=b;b=e;e=f;g=0;while(1){if((g|0)>=8){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+7|0]|0)|0;j=(d[h|0]|0)-(d[h+7|0]|0)|0;k=(d[h+1|0]|0)+(d[h+6|0]|0)|0;l=(d[h+1|0]|0)-(d[h+6|0]|0)|0;m=(d[h+2|0]|0)+(d[h+5|0]|0)|0;n=(d[h+2|0]|0)-(d[h+5|0]|0)|0;o=(d[h+3|0]|0)+(d[h+4|0]|0)|0;p=(d[h+3|0]|0)-(d[h+4|0]|0)|0;q=i+o|0;r=i-o|0;s=k+m|0;t=k-m|0;c[e>>2]=q+s-1024;c[e+16>>2]=q-s;u=((t+r|0)*181|0)>>8;c[e+8>>2]=r+u;c[e+24>>2]=r-u;q=p+n|0;s=n+l|0;t=l+j|0;v=((q-t|0)*98|0)>>8;w=((q*139|0)>>8)+v|0;x=((t*334|0)>>8)+v|0;y=(s*181|0)>>8;z=j+y|0;A=j-y|0;c[e+20>>2]=A+w;c[e+12>>2]=A-w;c[e+4>>2]=z+x;c[e+28>>2]=z-x;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+224>>2]|0)|0;j=(c[e>>2]|0)-(c[e+224>>2]|0)|0;k=(c[e+32>>2]|0)+(c[e+192>>2]|0)|0;l=(c[e+32>>2]|0)-(c[e+192>>2]|0)|0;m=(c[e+64>>2]|0)+(c[e+160>>2]|0)|0;n=(c[e+64>>2]|0)-(c[e+160>>2]|0)|0;o=(c[e+96>>2]|0)+(c[e+128>>2]|0)|0;p=(c[e+96>>2]|0)-(c[e+128>>2]|0)|0;q=i+o|0;r=i-o|0;s=k+m|0;t=k-m|0;c[e>>2]=q+s;c[e+128>>2]=q-s;u=((t+r|0)*181|0)>>8;c[e+64>>2]=r+u;c[e+192>>2]=r-u;q=p+n|0;s=n+l|0;t=l+j|0;v=((q-t|0)*98|0)>>8;w=((q*139|0)>>8)+v|0;x=((t*334|0)>>8)+v|0;y=(s*181|0)>>8;z=j+y|0;A=j-y|0;c[e+160>>2]=A+w;c[e+96>>2]=A-w;c[e+32>>2]=z+x;c[e+224>>2]=z-x;e=e+4|0;g=g-1|0}return}function dp(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=a;a=b;b=e;e=f;g=0;while(1){if((g|0)>=8){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+7|0]|0)|0;j=(d[h+1|0]|0)+(d[h+6|0]|0)|0;k=(d[h+2|0]|0)+(d[h+5|0]|0)|0;l=(d[h+3|0]|0)+(d[h+4|0]|0)|0;m=i+l|0;n=i-l|0;o=j+k|0;p=j-k|0;i=(d[h|0]|0)-(d[h+7|0]|0)|0;j=(d[h+1|0]|0)-(d[h+6|0]|0)|0;k=(d[h+2|0]|0)-(d[h+5|0]|0)|0;l=(d[h+3|0]|0)-(d[h+4|0]|0)|0;c[e>>2]=m+o-1024<<2;c[e+16>>2]=m-o<<2;q=(n+p|0)*4433|0;q=q+1024|0;c[e+8>>2]=q+(n*6270|0)>>11;c[e+24>>2]=q-(p*15137|0)>>11;m=i+l|0;o=j+k|0;n=i+k|0;p=j+l|0;q=(n+p|0)*9633|0;q=q+1024|0;i=i*12299|0;j=j*25172|0;k=k*16819|0;l=l*2446|0;m=m*-7373|0;o=o*-20995|0;n=n*-3196|0;p=p*-16069|0;n=n+q|0;p=p+q|0;c[e+4>>2]=i+m+n>>11;c[e+12>>2]=j+o+p>>11;c[e+20>>2]=k+o+n>>11;c[e+28>>2]=l+m+p>>11;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+192>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+160>>2]|0)|0;l=(c[e+96>>2]|0)+(c[e+128>>2]|0)|0;m=i+l+2|0;n=i-l|0;o=j+k|0;p=j-k|0;i=(c[e>>2]|0)-(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+192>>2]|0)|0;k=(c[e+64>>2]|0)-(c[e+160>>2]|0)|0;l=(c[e+96>>2]|0)-(c[e+128>>2]|0)|0;c[e>>2]=m+o>>2;c[e+128>>2]=m-o>>2;q=(n+p|0)*4433|0;q=q+16384|0;c[e+64>>2]=q+(n*6270|0)>>15;c[e+192>>2]=q-(p*15137|0)>>15;m=i+l|0;o=j+k|0;n=i+k|0;p=j+l|0;q=(n+p|0)*9633|0;q=q+16384|0;i=i*12299|0;j=j*25172|0;k=k*16819|0;l=l*2446|0;m=m*-7373|0;o=o*-20995|0;n=n*-3196|0;p=p*-16069|0;n=n+q|0;p=p+q|0;c[e+32>>2]=i+m+n>>15;c[e+96>>2]=j+o+p>>15;c[e+160>>2]=k+o+n>>15;c[e+224>>2]=l+m+p>>15;e=e+4|0;g=g-1|0}return}function dq(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=7){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+6|0]|0)|0;j=(d[h+1|0]|0)+(d[h+5|0]|0)|0;k=(d[h+2|0]|0)+(d[h+4|0]|0)|0;l=d[h+3|0]|0;m=(d[h|0]|0)-(d[h+6|0]|0)|0;n=(d[h+1|0]|0)-(d[h+5|0]|0)|0;o=(d[h+2|0]|0)-(d[h+4|0]|0)|0;p=i+k|0;c[e>>2]=p+j+l-896<<2;l=l+l|0;p=p-l|0;p=p-l|0;p=p*2896|0;q=(i-k|0)*7542|0;r=(j-k|0)*2578|0;c[e+8>>2]=p+q+r+1024>>11;p=p-q|0;q=(i-j|0)*7223|0;c[e+16>>2]=q+r-((j-l|0)*5793|0)+1024>>11;c[e+24>>2]=p+q+1024>>11;j=(m+n|0)*7663|0;k=(m-n|0)*1395|0;i=j-k|0;j=j+k|0;k=(n+o|0)*-11295|0;j=j+k|0;l=(m+o|0)*5027|0;i=i+l|0;k=k+(l+(o*15326|0))|0;c[e+4>>2]=i+1024>>11;c[e+12>>2]=j+1024>>11;c[e+20>>2]=k+1024>>11;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=7){break}i=(c[e>>2]|0)+(c[e+192>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+160>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+128>>2]|0)|0;l=c[e+96>>2]|0;m=(c[e>>2]|0)-(c[e+192>>2]|0)|0;n=(c[e+32>>2]|0)-(c[e+160>>2]|0)|0;o=(c[e+64>>2]|0)-(c[e+128>>2]|0)|0;p=i+k|0;c[e>>2]=((p+j+l|0)*10700|0)+16384>>15;l=l+l|0;p=p-l|0;p=p-l|0;p=p*3783|0;q=(i-k|0)*9850|0;r=(j-k|0)*3367|0;c[e+64>>2]=p+q+r+16384>>15;p=p-q|0;q=(i-j|0)*9434|0;c[e+128>>2]=q+r-((j-l|0)*7566|0)+16384>>15;c[e+192>>2]=p+q+16384>>15;j=(m+n|0)*10009|0;k=(m-n|0)*1822|0;i=j-k|0;j=j+k|0;k=(n+o|0)*-14752|0;j=j+k|0;l=(m+o|0)*6565|0;i=i+l|0;k=k+(l+(o*20017|0))|0;c[e+32>>2]=i+16384>>15;c[e+96>>2]=j+16384>>15;c[e+160>>2]=k+16384>>15;e=e+4|0;g=g+1|0}return}function dr(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=6){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+5|0]|0)|0;j=(d[h+1|0]|0)+(d[h+4|0]|0)|0;k=(d[h+2|0]|0)+(d[h+3|0]|0)|0;l=i+k|0;m=i-k|0;i=(d[h|0]|0)-(d[h+5|0]|0)|0;n=(d[h+1|0]|0)-(d[h+4|0]|0)|0;k=(d[h+2|0]|0)-(d[h+3|0]|0)|0;c[e>>2]=l+j-768<<2;c[e+8>>2]=(m*10033|0)+1024>>11;c[e+16>>2]=((l-j-j|0)*5793|0)+1024>>11;l=((i+k|0)*2998|0)+1024>>11;c[e+4>>2]=l+(i+n<<2);c[e+12>>2]=i-n-k<<2;c[e+20>>2]=l+(k-n<<2);e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=6){break}i=(c[e>>2]|0)+(c[e+160>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+96>>2]|0)|0;l=i+k|0;m=i-k|0;i=(c[e>>2]|0)-(c[e+160>>2]|0)|0;n=(c[e+32>>2]|0)-(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)-(c[e+96>>2]|0)|0;c[e>>2]=((l+j|0)*14564|0)+16384>>15;c[e+64>>2]=(m*17837|0)+16384>>15;c[e+128>>2]=((l-j-j|0)*10298|0)+16384>>15;l=(i+k|0)*5331|0;c[e+32>>2]=l+((i+n|0)*14564|0)+16384>>15;c[e+96>>2]=((i-n-k|0)*14564|0)+16384>>15;c[e+160>>2]=l+((k-n|0)*14564|0)+16384>>15;e=e+4|0;g=g+1|0}return}function ds(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=5){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+4|0]|0)|0;j=(d[h+1|0]|0)+(d[h+3|0]|0)|0;k=d[h+2|0]|0;l=i+j|0;m=i-j|0;i=(d[h|0]|0)-(d[h+4|0]|0)|0;j=(d[h+1|0]|0)-(d[h+3|0]|0)|0;c[e>>2]=l+k-640<<3;m=m*6476|0;l=l-(k<<2)|0;l=l*2896|0;c[e+8>>2]=m+l+512>>10;c[e+16>>2]=m-l+512>>10;l=(i+j|0)*6810|0;c[e+4>>2]=l+(i*4209|0)+512>>10;c[e+12>>2]=l-(j*17828|0)+512>>10;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=5){break}i=(c[e>>2]|0)+(c[e+128>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+96>>2]|0)|0;k=c[e+64>>2]|0;l=i+j|0;m=i-j|0;i=(c[e>>2]|0)-(c[e+128>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+96>>2]|0)|0;c[e>>2]=((l+k|0)*10486|0)+16384>>15;m=m*8290|0;l=l-(k<<2)|0;l=l*3707|0;c[e+64>>2]=m+l+16384>>15;c[e+128>>2]=m-l+16384>>15;l=(i+j|0)*8716|0;c[e+32>>2]=l+(i*5387|0)+16384>>15;c[e+96>>2]=l-(j*22820|0)+16384>>15;e=e+4|0;g=g+1|0}return}function dt(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=4){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+3|0]|0)|0;j=(d[h+1|0]|0)+(d[h+2|0]|0)|0;k=(d[h|0]|0)-(d[h+3|0]|0)|0;l=(d[h+1|0]|0)-(d[h+2|0]|0)|0;c[e>>2]=i+j-512<<4;c[e+8>>2]=i-j<<4;i=(k+l|0)*4433|0;i=i+256|0;c[e+4>>2]=i+(k*6270|0)>>9;c[e+12>>2]=i-(l*15137|0)>>9;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=4){break}i=(c[e>>2]|0)+(c[e+96>>2]|0)+2|0;j=(c[e+32>>2]|0)+(c[e+64>>2]|0)|0;k=(c[e>>2]|0)-(c[e+96>>2]|0)|0;l=(c[e+32>>2]|0)-(c[e+64>>2]|0)|0;c[e>>2]=i+j>>2;c[e+64>>2]=i-j>>2;i=(k+l|0)*4433|0;i=i+16384|0;c[e+32>>2]=i+(k*6270|0)>>15;c[e+96>>2]=i-(l*15137|0)>>15;e=e+4|0;g=g+1|0}return}function du(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=3){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+2|0]|0)|0;j=d[h+1|0]|0;k=(d[h|0]|0)-(d[h+2|0]|0)|0;c[e>>2]=i+j-384<<4;c[e+8>>2]=((i-j-j|0)*5793|0)+256>>9;c[e+4>>2]=(k*10033|0)+256>>9;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=3){break}i=(c[e>>2]|0)+(c[e+64>>2]|0)|0;j=c[e+32>>2]|0;k=(c[e>>2]|0)-(c[e+64>>2]|0)|0;c[e>>2]=((i+j|0)*14564|0)+16384>>15;c[e+64>>2]=((i-j-j|0)*10298|0)+16384>>15;c[e+32>>2]=(k*17837|0)+16384>>15;e=e+4|0;g=g+1|0}return}function dv(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=(c[a>>2]|0)+b|0;g=(d[e|0]|0)+(d[e+1|0]|0)|0;h=(d[e|0]|0)-(d[e+1|0]|0)|0;e=(c[a+4>>2]|0)+b|0;b=(d[e|0]|0)+(d[e+1|0]|0)|0;a=(d[e|0]|0)-(d[e+1|0]|0)|0;c[f>>2]=g+b-512<<4;c[f+32>>2]=g-b<<4;c[f+4>>2]=h+a<<4;c[f+36>>2]=h-a<<4;return}function dw(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;c[f>>2]=(d[(c[a>>2]|0)+b|0]|0)-128<<6;return}function dx(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=i;i=i+32|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+8|0]|0)|0;m=(d[k+1|0]|0)+(d[k+7|0]|0)|0;n=(d[k+2|0]|0)+(d[k+6|0]|0)|0;o=(d[k+3|0]|0)+(d[k+5|0]|0)|0;p=d[k+4|0]|0;q=(d[k|0]|0)-(d[k+8|0]|0)|0;r=(d[k+1|0]|0)-(d[k+7|0]|0)|0;s=(d[k+2|0]|0)-(d[k+6|0]|0)|0;t=(d[k+3|0]|0)-(d[k+5|0]|0)|0;u=l+n+o|0;v=m+p|0;c[e>>2]=u+v-1152<<1;c[e+24>>2]=((u-v-v|0)*5793|0)+2048>>12;u=(l-n|0)*10887|0;v=(m-p-p|0)*5793|0;c[e+8>>2]=((n-o|0)*8875|0)+u+v+2048>>12;c[e+16>>2]=((o-l|0)*2012|0)+u-v+2048>>12;c[e+12>>2]=((q-s-t|0)*10033|0)+2048>>12;r=r*10033|0;l=(q+s|0)*7447|0;m=(q+t|0)*3962|0;c[e+4>>2]=r+l+m+2048>>12;n=(s-t|0)*11409|0;c[e+20>>2]=l-r-n+2048>>12;c[e+28>>2]=m-r+n+2048>>12;j=j+1|0;if((j|0)!=8){if((j|0)==9){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h>>2]|0)|0;m=(c[e+32>>2]|0)+(c[e+224>>2]|0)|0;n=(c[e+64>>2]|0)+(c[e+192>>2]|0)|0;o=(c[e+96>>2]|0)+(c[e+160>>2]|0)|0;p=c[e+128>>2]|0;q=(c[e>>2]|0)-(c[h>>2]|0)|0;r=(c[e+32>>2]|0)-(c[e+224>>2]|0)|0;s=(c[e+64>>2]|0)-(c[e+192>>2]|0)|0;t=(c[e+96>>2]|0)-(c[e+160>>2]|0)|0;u=l+n+o|0;v=m+p|0;c[e>>2]=((u+v|0)*12945|0)+16384>>15;c[e+192>>2]=((u-v-v|0)*9154|0)+16384>>15;u=(l-n|0)*17203|0;v=(m-p-p|0)*9154|0;c[e+64>>2]=((n-o|0)*14024|0)+u+v+16384>>15;c[e+128>>2]=((o-l|0)*3179|0)+u-v+16384>>15;c[e+96>>2]=((q-s-t|0)*15855|0)+16384>>15;r=r*15855|0;l=(q+s|0)*11768|0;m=(q+t|0)*6262|0;c[e+32>>2]=r+l+m+16384>>15;n=(s-t|0)*18029|0;c[e+160>>2]=l-r-n+16384>>15;c[e+224>>2]=m-r+n+16384>>15;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dy(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+64|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+9|0]|0)|0;m=(d[k+1|0]|0)+(d[k+8|0]|0)|0;n=(d[k+2|0]|0)+(d[k+7|0]|0)|0;o=(d[k+3|0]|0)+(d[k+6|0]|0)|0;p=(d[k+4|0]|0)+(d[k+5|0]|0)|0;q=l+p|0;r=l-p|0;s=m+o|0;t=m-o|0;l=(d[k|0]|0)-(d[k+9|0]|0)|0;m=(d[k+1|0]|0)-(d[k+8|0]|0)|0;u=(d[k+2|0]|0)-(d[k+7|0]|0)|0;o=(d[k+3|0]|0)-(d[k+6|0]|0)|0;p=(d[k+4|0]|0)-(d[k+5|0]|0)|0;c[e>>2]=q+s+n-1280<<1;n=n+n|0;c[e+16>>2]=((q-n|0)*9373|0)-((s-n|0)*3580|0)+2048>>12;q=(r+t|0)*6810|0;c[e+8>>2]=q+(r*4209|0)+2048>>12;c[e+24>>2]=q-(t*17828|0)+2048>>12;q=l+p|0;s=m-o|0;c[e+20>>2]=q-s-u<<1;u=u<<13;c[e+4>>2]=(l*11443|0)+(m*10323|0)+u+(o*5260|0)+(p*1812|0)+2048>>12;n=((l-p|0)*7791|0)-((m+o|0)*4815|0)|0;r=((q+s|0)*2531|0)+(s<<12)-u|0;c[e+12>>2]=n+r+2048>>12;c[e+28>>2]=n-r+2048>>12;j=j+1|0;if((j|0)!=8){if((j|0)==10){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+32>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h>>2]|0)|0;n=(c[e+64>>2]|0)+(c[e+224>>2]|0)|0;o=(c[e+96>>2]|0)+(c[e+192>>2]|0)|0;p=(c[e+128>>2]|0)+(c[e+160>>2]|0)|0;q=l+p|0;r=l-p|0;s=m+o|0;t=m-o|0;l=(c[e>>2]|0)-(c[h+32>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h>>2]|0)|0;u=(c[e+64>>2]|0)-(c[e+224>>2]|0)|0;o=(c[e+96>>2]|0)-(c[e+192>>2]|0)|0;p=(c[e+128>>2]|0)-(c[e+160>>2]|0)|0;c[e>>2]=((q+s+n|0)*10486|0)+16384>>15;n=n+n|0;c[e+128>>2]=((q-n|0)*11997|0)-((s-n|0)*4582|0)+16384>>15;q=(r+t|0)*8716|0;c[e+64>>2]=q+(r*5387|0)+16384>>15;c[e+192>>2]=q-(t*22820|0)+16384>>15;q=l+p|0;s=m-o|0;c[e+160>>2]=((q-s-u|0)*10486|0)+16384>>15;u=u*10486|0;c[e+32>>2]=(l*14647|0)+(m*13213|0)+u+(o*6732|0)+(p*2320|0)+16384>>15;n=((l-p|0)*9973|0)-((m+o|0)*6163|0)|0;r=((q+s|0)*3240|0)+(s*5243|0)-u|0;c[e+96>>2]=n+r+16384>>15;c[e+224>>2]=n-r+16384>>15;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dz(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+96|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+10|0]|0)|0;m=(d[k+1|0]|0)+(d[k+9|0]|0)|0;n=(d[k+2|0]|0)+(d[k+8|0]|0)|0;o=(d[k+3|0]|0)+(d[k+7|0]|0)|0;p=(d[k+4|0]|0)+(d[k+6|0]|0)|0;q=d[k+5|0]|0;r=(d[k|0]|0)-(d[k+10|0]|0)|0;s=(d[k+1|0]|0)-(d[k+9|0]|0)|0;t=(d[k+2|0]|0)-(d[k+8|0]|0)|0;u=(d[k+3|0]|0)-(d[k+7|0]|0)|0;v=(d[k+4|0]|0)-(d[k+6|0]|0)|0;c[e>>2]=l+m+n+o+p+q-1408<<1;q=q+q|0;l=l-q|0;m=m-q|0;n=n-q|0;o=o-q|0;p=p-q|0;w=((l+o|0)*11116|0)+((n+p|0)*1649|0)|0;x=(m-o|0)*7587|0;y=(l-m|0)*9746|0;c[e+8>>2]=w+x-(o*8342|0)-(p*11395|0)+2048>>12;c[e+16>>2]=x+y+(m*511|0)-(n*11116|0)+(p*4813|0)+2048>>12;c[e+24>>2]=w+y-(l*13275|0)-(n*6461|0)+2048>>12;m=(r+s|0)*10538|0;n=(r+t|0)*8756|0;o=(r+u|0)*6263|0;l=m+n+o-(r*14090|0)+(v*3264|0)|0;p=(s+t|0)*-6263|0;q=(s+u|0)*-11467|0;m=m+(p+q+(s*10456|0)-(v*8756|0))|0;r=(t+u|0)*3264|0;n=n+(p+r-(t*16294|0)+(v*11467|0))|0;o=o+(q+r+(u*10695|0)-(v*10538|0))|0;c[e+4>>2]=l+2048>>12;c[e+12>>2]=m+2048>>12;c[e+20>>2]=n+2048>>12;c[e+28>>2]=o+2048>>12;j=j+1|0;if((j|0)!=8){if((j|0)==11){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+64>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+32>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h>>2]|0)|0;o=(c[e+96>>2]|0)+(c[e+224>>2]|0)|0;p=(c[e+128>>2]|0)+(c[e+192>>2]|0)|0;q=c[e+160>>2]|0;r=(c[e>>2]|0)-(c[h+64>>2]|0)|0;s=(c[e+32>>2]|0)-(c[h+32>>2]|0)|0;t=(c[e+64>>2]|0)-(c[h>>2]|0)|0;u=(c[e+96>>2]|0)-(c[e+224>>2]|0)|0;v=(c[e+128>>2]|0)-(c[e+192>>2]|0)|0;c[e>>2]=((l+m+n+o+p+q|0)*8666|0)+16384>>15;q=q+q|0;l=l-q|0;m=m-q|0;n=n-q|0;o=o-q|0;p=p-q|0;w=((l+o|0)*11759|0)+((n+p|0)*1744|0)|0;x=(m-o|0)*8026|0;y=(l-m|0)*10310|0;c[e+64>>2]=w+x-(o*8825|0)-(p*12054|0)+16384>>15;c[e+128>>2]=x+y+(m*540|0)-(n*11759|0)+(p*5091|0)+16384>>15;c[e+192>>2]=w+y-(l*14043|0)-(n*6835|0)+16384>>15;m=(r+s|0)*11148|0;n=(r+t|0)*9262|0;o=(r+u|0)*6626|0;l=m+n+o-(r*14905|0)+(v*3453|0)|0;p=(s+t|0)*-6626|0;q=(s+u|0)*-12131|0;m=m+(p+q+(s*11061|0)-(v*9262|0))|0;r=(t+u|0)*3453|0;n=n+(p+r-(t*17237|0)+(v*12131|0))|0;o=o+(q+r+(u*11314|0)-(v*11148|0))|0;c[e+32>>2]=l+16384>>15;c[e+96>>2]=m+16384>>15;c[e+160>>2]=n+16384>>15;c[e+224>>2]=o+16384>>15;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dA(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+128|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+11|0]|0)|0;m=(d[k+1|0]|0)+(d[k+10|0]|0)|0;n=(d[k+2|0]|0)+(d[k+9|0]|0)|0;o=(d[k+3|0]|0)+(d[k+8|0]|0)|0;p=(d[k+4|0]|0)+(d[k+7|0]|0)|0;q=(d[k+5|0]|0)+(d[k+6|0]|0)|0;r=l+q|0;s=l-q|0;t=m+p|0;u=m-p|0;v=n+o|0;w=n-o|0;l=(d[k|0]|0)-(d[k+11|0]|0)|0;m=(d[k+1|0]|0)-(d[k+10|0]|0)|0;n=(d[k+2|0]|0)-(d[k+9|0]|0)|0;o=(d[k+3|0]|0)-(d[k+8|0]|0)|0;p=(d[k+4|0]|0)-(d[k+7|0]|0)|0;q=(d[k+5|0]|0)-(d[k+6|0]|0)|0;c[e>>2]=r+t+v-1536;c[e+24>>2]=s-u-w;c[e+16>>2]=((r-v|0)*10033|0)+4096>>13;c[e+8>>2]=u-w+((s+w|0)*11190|0)+4096>>13;r=(m+p|0)*4433|0;u=r+(m*6270|0)|0;w=r-(p*15137|0)|0;v=(l+n|0)*9191|0;s=(l+o|0)*7053|0;r=v+s+u-(l*4758|0)+(q*1512|0)|0;t=(n+o|0)*-1512|0;v=v+(t-w-(n*19165|0)+(q*7053|0))|0;s=s+(t-u+(o*5946|0)-(q*9191|0))|0;t=w+((l-o|0)*10703|0)-((n+q|0)*4433|0)|0;c[e+4>>2]=r+4096>>13;c[e+12>>2]=t+4096>>13;c[e+20>>2]=v+4096>>13;c[e+28>>2]=s+4096>>13;j=j+1|0;if((j|0)!=8){if((j|0)==12){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+96>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+64>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+32>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h>>2]|0)|0;p=(c[e+128>>2]|0)+(c[e+224>>2]|0)|0;q=(c[e+160>>2]|0)+(c[e+192>>2]|0)|0;r=l+q|0;s=l-q|0;t=m+p|0;u=m-p|0;v=n+o|0;w=n-o|0;l=(c[e>>2]|0)-(c[h+96>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h+64>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+32>>2]|0)|0;o=(c[e+96>>2]|0)-(c[h>>2]|0)|0;p=(c[e+128>>2]|0)-(c[e+224>>2]|0)|0;q=(c[e+160>>2]|0)-(c[e+192>>2]|0)|0;c[e>>2]=((r+t+v|0)*7282|0)+8192>>14;c[e+192>>2]=((s-u-w|0)*7282|0)+8192>>14;c[e+128>>2]=((r-v|0)*8918|0)+8192>>14;c[e+64>>2]=((u-w|0)*7282|0)+((s+w|0)*9947|0)+8192>>14;r=(m+p|0)*3941|0;u=r+(m*5573|0)|0;w=r-(p*13455|0)|0;v=(l+n|0)*8170|0;s=(l+o|0)*6269|0;r=v+s+u-(l*4229|0)+(q*1344|0)|0;t=(n+o|0)*-1344|0;v=v+(t-w-(n*17036|0)+(q*6269|0))|0;s=s+(t-u+(o*5285|0)-(q*8170|0))|0;t=w+((l-o|0)*9514|0)-((n+q|0)*3941|0)|0;c[e+32>>2]=r+8192>>14;c[e+96>>2]=t+8192>>14;c[e+160>>2]=v+8192>>14;c[e+224>>2]=s+8192>>14;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dB(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0;f=i;i=i+160|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+12|0]|0)|0;m=(d[k+1|0]|0)+(d[k+11|0]|0)|0;n=(d[k+2|0]|0)+(d[k+10|0]|0)|0;o=(d[k+3|0]|0)+(d[k+9|0]|0)|0;p=(d[k+4|0]|0)+(d[k+8|0]|0)|0;q=(d[k+5|0]|0)+(d[k+7|0]|0)|0;r=d[k+6|0]|0;s=(d[k|0]|0)-(d[k+12|0]|0)|0;t=(d[k+1|0]|0)-(d[k+11|0]|0)|0;u=(d[k+2|0]|0)-(d[k+10|0]|0)|0;v=(d[k+3|0]|0)-(d[k+9|0]|0)|0;w=(d[k+4|0]|0)-(d[k+8|0]|0)|0;x=(d[k+5|0]|0)-(d[k+7|0]|0)|0;c[e>>2]=l+m+n+o+p+q+r-1664;r=r+r|0;l=l-r|0;m=m-r|0;n=n-r|0;o=o-r|0;p=p-r|0;q=q-r|0;c[e+8>>2]=(l*11249|0)+(m*8672|0)+(n*4108|0)-(o*1396|0)-(p*6581|0)-(q*10258|0)+4096>>13;y=((l-n|0)*9465|0)-((o-p|0)*3570|0)-((m-q|0)*2592|0)|0;z=((l+n|0)*793|0)-((o+p|0)*7678|0)+((m+q|0)*3989|0)|0;c[e+16>>2]=y+z+4096>>13;c[e+24>>2]=y-z+4096>>13;m=(s+t|0)*10832|0;n=(s+u|0)*9534|0;o=((s+v|0)*7682|0)+((w+x|0)*2773|0)|0;l=m+n+o-(s*16549|0)+(w*2611|0)|0;p=((w-x|0)*7682|0)-((t+u|0)*2773|0)|0;q=(t+v|0)*-9534|0;m=m+(p+q+(t*6859|0)-(w*19183|0))|0;r=(u+v|0)*-5384|0;n=n+(p+r-(u*12879|0)+(x*18515|0))|0;o=o+(q+r+(v*18068|0)-(x*14273|0))|0;c[e+4>>2]=l+4096>>13;c[e+12>>2]=m+4096>>13;c[e+20>>2]=n+4096>>13;c[e+28>>2]=o+4096>>13;j=j+1|0;if((j|0)!=8){if((j|0)==13){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+128>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+96>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+64>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h+32>>2]|0)|0;p=(c[e+128>>2]|0)+(c[h>>2]|0)|0;q=(c[e+160>>2]|0)+(c[e+224>>2]|0)|0;r=c[e+192>>2]|0;s=(c[e>>2]|0)-(c[h+128>>2]|0)|0;t=(c[e+32>>2]|0)-(c[h+96>>2]|0)|0;u=(c[e+64>>2]|0)-(c[h+64>>2]|0)|0;v=(c[e+96>>2]|0)-(c[h+32>>2]|0)|0;w=(c[e+128>>2]|0)-(c[h>>2]|0)|0;x=(c[e+160>>2]|0)-(c[e+224>>2]|0)|0;c[e>>2]=((l+m+n+o+p+q+r|0)*6205|0)+8192>>14;r=r+r|0;l=l-r|0;m=m-r|0;n=n-r|0;o=o-r|0;p=p-r|0;q=q-r|0;c[e+64>>2]=(l*8520|0)+(m*6568|0)+(n*3112|0)-(o*1058|0)-(p*4985|0)-(q*7770|0)+8192>>14;y=((l-n|0)*7169|0)-((o-p|0)*2704|0)-((m-q|0)*1963|0)|0;z=((l+n|0)*601|0)-((o+p|0)*5816|0)+((m+q|0)*3021|0)|0;c[e+128>>2]=y+z+8192>>14;c[e+192>>2]=y-z+8192>>14;m=(s+t|0)*8204|0;n=(s+u|0)*7221|0;o=((s+v|0)*5819|0)+((w+x|0)*2100|0)|0;l=m+n+o-(s*12534|0)+(w*1978|0)|0;p=((w-x|0)*5819|0)-((t+u|0)*2100|0)|0;q=(t+v|0)*-7221|0;m=m+(p+q+(t*5195|0)-(w*14529|0))|0;r=(u+v|0)*-4078|0;n=n+(p+r-(u*9754|0)+(x*14023|0))|0;o=o+(q+r+(v*13685|0)-(x*10811|0))|0;c[e+32>>2]=l+8192>>14;c[e+96>>2]=m+8192>>14;c[e+160>>2]=n+8192>>14;c[e+224>>2]=o+8192>>14;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dC(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0;f=i;i=i+192|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+13|0]|0)|0;m=(d[k+1|0]|0)+(d[k+12|0]|0)|0;n=(d[k+2|0]|0)+(d[k+11|0]|0)|0;o=(d[k+3|0]|0)+(d[k+10|0]|0)|0;p=(d[k+4|0]|0)+(d[k+9|0]|0)|0;q=(d[k+5|0]|0)+(d[k+8|0]|0)|0;r=(d[k+6|0]|0)+(d[k+7|0]|0)|0;s=l+r|0;t=l-r|0;u=m+q|0;v=m-q|0;w=n+p|0;x=n-p|0;l=(d[k|0]|0)-(d[k+13|0]|0)|0;m=(d[k+1|0]|0)-(d[k+12|0]|0)|0;n=(d[k+2|0]|0)-(d[k+11|0]|0)|0;y=(d[k+3|0]|0)-(d[k+10|0]|0)|0;p=(d[k+4|0]|0)-(d[k+9|0]|0)|0;q=(d[k+5|0]|0)-(d[k+8|0]|0)|0;r=(d[k+6|0]|0)-(d[k+7|0]|0)|0;c[e>>2]=s+u+w+o-1792;o=o+o|0;c[e+16>>2]=((s-o|0)*10438|0)+((u-o|0)*2578|0)-((w-o|0)*7223|0)+4096>>13;s=(t+v|0)*9058|0;c[e+8>>2]=s+(t*2237|0)+(x*5027|0)+4096>>13;c[e+24>>2]=s-(v*14084|0)-(x*11295|0)+4096>>13;s=m+n|0;u=q-p|0;c[e+28>>2]=l-s+y-u-r;y=y<<13;s=s*-1297|0;u=u*11512|0;s=s+(u-y)|0;u=((l+n|0)*9810|0)+((p+r|0)*6164|0)|0;c[e+20>>2]=s+u-(n*19447|0)+(p*9175|0)+4096>>13;w=((l+m|0)*10935|0)+((q-r|0)*3826|0)|0;c[e+12>>2]=s+w-(m*3474|0)-(q*25148|0)+4096>>13;c[e+4>>2]=u+w+y+r-((l+r|0)*9232|0)+4096>>13;j=j+1|0;if((j|0)!=8){if((j|0)==14){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+160>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+128>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+96>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h+64>>2]|0)|0;p=(c[e+128>>2]|0)+(c[h+32>>2]|0)|0;q=(c[e+160>>2]|0)+(c[h>>2]|0)|0;r=(c[e+192>>2]|0)+(c[e+224>>2]|0)|0;s=l+r|0;t=l-r|0;u=m+q|0;v=m-q|0;w=n+p|0;x=n-p|0;l=(c[e>>2]|0)-(c[h+160>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h+128>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+96>>2]|0)|0;y=(c[e+96>>2]|0)-(c[h+64>>2]|0)|0;p=(c[e+128>>2]|0)-(c[h+32>>2]|0)|0;q=(c[e+160>>2]|0)-(c[h>>2]|0)|0;r=(c[e+192>>2]|0)-(c[e+224>>2]|0)|0;c[e>>2]=((s+u+w+o|0)*5350|0)+8192>>14;o=o+o|0;c[e+128>>2]=((s-o|0)*6817|0)+((u-o|0)*1684|0)-((w-o|0)*4717|0)+8192>>14;s=(t+v|0)*5915|0;c[e+64>>2]=s+(t*1461|0)+(x*3283|0)+8192>>14;c[e+192>>2]=s-(v*9198|0)-(x*7376|0)+8192>>14;s=m+n|0;u=q-p|0;c[e+224>>2]=((l-s+y-u-r|0)*5350|0)+8192>>14;y=y*5350|0;s=s*-847|0;u=u*7518|0;s=s+(u-y)|0;u=((l+n|0)*6406|0)+((p+r|0)*4025|0)|0;c[e+160>>2]=s+u-(n*12700|0)+(p*5992|0)+8192>>14;w=((l+m|0)*7141|0)+((q-r|0)*2499|0)|0;c[e+96>>2]=s+w-(m*2269|0)-(q*16423|0)+8192>>14;c[e+32>>2]=u+w+y-(l*6029|0)-(r*679|0)+8192>>14;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dD(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0;f=i;i=i+224|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+14|0]|0)|0;m=(d[k+1|0]|0)+(d[k+13|0]|0)|0;n=(d[k+2|0]|0)+(d[k+12|0]|0)|0;o=(d[k+3|0]|0)+(d[k+11|0]|0)|0;p=(d[k+4|0]|0)+(d[k+10|0]|0)|0;q=(d[k+5|0]|0)+(d[k+9|0]|0)|0;r=(d[k+6|0]|0)+(d[k+8|0]|0)|0;s=d[k+7|0]|0;t=(d[k|0]|0)-(d[k+14|0]|0)|0;u=(d[k+1|0]|0)-(d[k+13|0]|0)|0;v=(d[k+2|0]|0)-(d[k+12|0]|0)|0;w=(d[k+3|0]|0)-(d[k+11|0]|0)|0;x=(d[k+4|0]|0)-(d[k+10|0]|0)|0;y=(d[k+5|0]|0)-(d[k+9|0]|0)|0;z=(d[k+6|0]|0)-(d[k+8|0]|0)|0;A=l+p+q|0;B=m+o+r|0;C=n+s|0;c[e>>2]=A+B+C-1920;C=C+C|0;c[e+24>>2]=((A-C|0)*9373|0)-((B-C|0)*3580|0)+4096>>13;n=n+((m+p>>1)-s-s)|0;A=((o-n|0)*12543|0)-((r-n|0)*18336|0)|0;B=((q-n|0)*6541|0)-((l-n|0)*748|0)|0;C=((l-o|0)*11332|0)+((r-q|0)*7752|0)+((m-p|0)*6476|0)|0;c[e+8>>2]=A+C+4096>>13;c[e+16>>2]=B+C+4096>>13;n=(t-v-w+y+z|0)*10033|0;m=((t-x-y|0)*11018|0)+((u-w-z|0)*6810|0)|0;v=v*10033|0;p=((t-z|0)*11522|0)+((u+x|0)*11018|0)+((w+y|0)*4712|0)|0;l=(w*3897|0)-(x*4209|0)+(z*13930|0)+p+v|0;o=(t*-2912|0)-(u*17828|0)-(y*7121|0)+p-v|0;c[e+4>>2]=l+4096>>13;c[e+12>>2]=m+4096>>13;c[e+20>>2]=n+4096>>13;c[e+28>>2]=o+4096>>13;j=j+1|0;if((j|0)!=8){if((j|0)==15){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+192>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+160>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+128>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h+96>>2]|0)|0;p=(c[e+128>>2]|0)+(c[h+64>>2]|0)|0;q=(c[e+160>>2]|0)+(c[h+32>>2]|0)|0;r=(c[e+192>>2]|0)+(c[h>>2]|0)|0;s=c[e+224>>2]|0;t=(c[e>>2]|0)-(c[h+192>>2]|0)|0;u=(c[e+32>>2]|0)-(c[h+160>>2]|0)|0;v=(c[e+64>>2]|0)-(c[h+128>>2]|0)|0;w=(c[e+96>>2]|0)-(c[h+96>>2]|0)|0;x=(c[e+128>>2]|0)-(c[h+64>>2]|0)|0;y=(c[e+160>>2]|0)-(c[h+32>>2]|0)|0;z=(c[e+192>>2]|0)-(c[h>>2]|0)|0;A=l+p+q|0;B=m+o+r|0;C=n+s|0;c[e>>2]=((A+B+C|0)*9321|0)+16384>>15;C=C+C|0;c[e+192>>2]=((A-C|0)*10664|0)-((B-C|0)*4073|0)+16384>>15;n=n+((m+p>>1)-s-s)|0;A=((o-n|0)*14271|0)-((r-n|0)*20862|0)|0;B=((q-n|0)*7442|0)-((l-n|0)*852|0)|0;C=((l-o|0)*12893|0)+((r-q|0)*8820|0)+((m-p|0)*7369|0)|0;c[e+64>>2]=A+C+16384>>15;c[e+128>>2]=B+C+16384>>15;n=(t-v-w+y+z|0)*11415|0;m=((t-x-y|0)*12536|0)+((u-w-z|0)*7748|0)|0;v=v*11415|0;p=((t-z|0)*13109|0)+((u+x|0)*12536|0)+((w+y|0)*5361|0)|0;l=(w*4434|0)-(x*4788|0)+(z*15850|0)+p+v|0;o=(t*-3314|0)-(u*20284|0)-(y*8102|0)+p-v|0;c[e+32>>2]=l+16384>>15;c[e+96>>2]=m+16384>>15;c[e+160>>2]=n+16384>>15;c[e+224>>2]=o+16384>>15;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dE(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;f=i;i=i+256|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+15|0]|0)|0;m=(d[k+1|0]|0)+(d[k+14|0]|0)|0;n=(d[k+2|0]|0)+(d[k+13|0]|0)|0;o=(d[k+3|0]|0)+(d[k+12|0]|0)|0;p=(d[k+4|0]|0)+(d[k+11|0]|0)|0;q=(d[k+5|0]|0)+(d[k+10|0]|0)|0;r=(d[k+6|0]|0)+(d[k+9|0]|0)|0;s=(d[k+7|0]|0)+(d[k+8|0]|0)|0;t=l+s|0;u=l-s|0;v=m+r|0;w=m-r|0;x=n+q|0;y=n-q|0;z=o+p|0;A=o-p|0;l=(d[k|0]|0)-(d[k+15|0]|0)|0;m=(d[k+1|0]|0)-(d[k+14|0]|0)|0;n=(d[k+2|0]|0)-(d[k+13|0]|0)|0;o=(d[k+3|0]|0)-(d[k+12|0]|0)|0;p=(d[k+4|0]|0)-(d[k+11|0]|0)|0;q=(d[k+5|0]|0)-(d[k+10|0]|0)|0;r=(d[k+6|0]|0)-(d[k+9|0]|0)|0;s=(d[k+7|0]|0)-(d[k+8|0]|0)|0;c[e>>2]=t+v+x+z-2048<<2;c[e+16>>2]=((t-z|0)*10703|0)+((v-x|0)*4433|0)+1024>>11;t=((A-w|0)*2260|0)+((u-y|0)*11363|0)|0;c[e+8>>2]=t+(w*11893|0)+(y*17799|0)+1024>>11;c[e+24>>2]=t-(u*1730|0)-(A*8697|0)+1024>>11;v=((l+m|0)*11086|0)+((r-s|0)*3363|0)|0;x=((l+n|0)*10217|0)+((q+s|0)*5461|0)|0;z=((l+o|0)*8956|0)+((p-s|0)*7350|0)|0;u=((m+n|0)*1136|0)+((r-q|0)*11529|0)|0;w=((m+o|0)*-5461|0)+((p+r|0)*-10217|0)|0;y=((n+o|0)*-11086|0)+((q-p|0)*3363|0)|0;t=v+x+z-(l*18730|0)+(s*6387|0)|0;v=v+(u+w+(m*589|0)-(r*13631|0))|0;x=x+(u+y-(n*9222|0)+(q*10055|0))|0;z=z+(w+y+(o*8728|0)+(p*17760|0))|0;c[e+4>>2]=t+1024>>11;c[e+12>>2]=v+1024>>11;c[e+20>>2]=x+1024>>11;c[e+28>>2]=z+1024>>11;j=j+1|0;if((j|0)!=8){if((j|0)==16){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+224>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+192>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+160>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h+128>>2]|0)|0;p=(c[e+128>>2]|0)+(c[h+96>>2]|0)|0;q=(c[e+160>>2]|0)+(c[h+64>>2]|0)|0;r=(c[e+192>>2]|0)+(c[h+32>>2]|0)|0;s=(c[e+224>>2]|0)+(c[h>>2]|0)|0;t=l+s|0;u=l-s|0;v=m+r|0;w=m-r|0;x=n+q|0;y=n-q|0;z=o+p|0;A=o-p|0;l=(c[e>>2]|0)-(c[h+224>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h+192>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+160>>2]|0)|0;o=(c[e+96>>2]|0)-(c[h+128>>2]|0)|0;p=(c[e+128>>2]|0)-(c[h+96>>2]|0)|0;q=(c[e+160>>2]|0)-(c[h+64>>2]|0)|0;r=(c[e+192>>2]|0)-(c[h+32>>2]|0)|0;s=(c[e+224>>2]|0)-(c[h>>2]|0)|0;c[e>>2]=t+v+x+z+8>>4;c[e+128>>2]=((t-z|0)*10703|0)+((v-x|0)*4433|0)+65536>>17;t=((A-w|0)*2260|0)+((u-y|0)*11363|0)|0;c[e+64>>2]=t+(w*11893|0)+(y*17799|0)+65536>>17;c[e+192>>2]=t-(u*1730|0)-(A*8697|0)+65536>>17;v=((l+m|0)*11086|0)+((r-s|0)*3363|0)|0;x=((l+n|0)*10217|0)+((q+s|0)*5461|0)|0;z=((l+o|0)*8956|0)+((p-s|0)*7350|0)|0;u=((m+n|0)*1136|0)+((r-q|0)*11529|0)|0;w=((m+o|0)*-5461|0)+((p+r|0)*-10217|0)|0;y=((n+o|0)*-11086|0)+((q-p|0)*3363|0)|0;t=v+x+z-(l*18730|0)+(s*6387|0)|0;v=v+(u+w+(m*589|0)-(r*13631|0))|0;x=x+(u+y-(n*9222|0)+(q*10055|0))|0;z=z+(w+y+(o*8728|0)+(p*17760|0))|0;c[e+32>>2]=t+65536>>17;c[e+96>>2]=v+65536>>17;c[e+160>>2]=x+65536>>17;c[e+224>>2]=z+65536>>17;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dF(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;f=a;a=b;b=e;e=f;g=0;g=0;while(1){if((g|0)>=8){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+15|0]|0)|0;j=(d[h+1|0]|0)+(d[h+14|0]|0)|0;k=(d[h+2|0]|0)+(d[h+13|0]|0)|0;l=(d[h+3|0]|0)+(d[h+12|0]|0)|0;m=(d[h+4|0]|0)+(d[h+11|0]|0)|0;n=(d[h+5|0]|0)+(d[h+10|0]|0)|0;o=(d[h+6|0]|0)+(d[h+9|0]|0)|0;p=(d[h+7|0]|0)+(d[h+8|0]|0)|0;q=i+p|0;r=i-p|0;s=j+o|0;t=j-o|0;u=k+n|0;v=k-n|0;w=l+m|0;x=l-m|0;i=(d[h|0]|0)-(d[h+15|0]|0)|0;j=(d[h+1|0]|0)-(d[h+14|0]|0)|0;k=(d[h+2|0]|0)-(d[h+13|0]|0)|0;l=(d[h+3|0]|0)-(d[h+12|0]|0)|0;m=(d[h+4|0]|0)-(d[h+11|0]|0)|0;n=(d[h+5|0]|0)-(d[h+10|0]|0)|0;o=(d[h+6|0]|0)-(d[h+9|0]|0)|0;p=(d[h+7|0]|0)-(d[h+8|0]|0)|0;c[e>>2]=q+s+u+w-2048<<2;c[e+16>>2]=((q-w|0)*10703|0)+((s-u|0)*4433|0)+1024>>11;q=((x-t|0)*2260|0)+((r-v|0)*11363|0)|0;c[e+8>>2]=q+(t*11893|0)+(v*17799|0)+1024>>11;c[e+24>>2]=q-(r*1730|0)-(x*8697|0)+1024>>11;s=((i+j|0)*11086|0)+((o-p|0)*3363|0)|0;u=((i+k|0)*10217|0)+((n+p|0)*5461|0)|0;w=((i+l|0)*8956|0)+((m-p|0)*7350|0)|0;r=((j+k|0)*1136|0)+((o-n|0)*11529|0)|0;t=((j+l|0)*-5461|0)+((m+o|0)*-10217|0)|0;v=((k+l|0)*-11086|0)+((n-m|0)*3363|0)|0;q=s+u+w-(i*18730|0)+(p*6387|0)|0;s=s+(r+t+(j*589|0)-(o*13631|0))|0;u=u+(r+v-(k*9222|0)+(n*10055|0))|0;w=w+(t+v+(l*8728|0)+(m*17760|0))|0;c[e+4>>2]=q+1024>>11;c[e+12>>2]=s+1024>>11;c[e+20>>2]=u+1024>>11;c[e+28>>2]=w+1024>>11;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+192>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+160>>2]|0)|0;l=(c[e+96>>2]|0)+(c[e+128>>2]|0)|0;q=i+l|0;u=i-l|0;s=j+k|0;w=j-k|0;i=(c[e>>2]|0)-(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+192>>2]|0)|0;k=(c[e+64>>2]|0)-(c[e+160>>2]|0)|0;l=(c[e+96>>2]|0)-(c[e+128>>2]|0)|0;c[e>>2]=q+s+4>>3;c[e+128>>2]=q-s+4>>3;f=(u+w|0)*4433|0;c[e+64>>2]=f+(u*6270|0)+32768>>16;c[e+192>>2]=f-(w*15137|0)+32768>>16;q=i+l|0;s=j+k|0;u=i+k|0;w=j+l|0;f=(u+w|0)*9633|0;i=i*12299|0;j=j*25172|0;k=k*16819|0;l=l*2446|0;q=q*-7373|0;s=s*-20995|0;u=u*-3196|0;w=w*-16069|0;u=u+f|0;w=w+f|0;c[e+32>>2]=i+q+u+32768>>16;c[e+96>>2]=j+s+w+32768>>16;c[e+160>>2]=k+s+u+32768>>16;c[e+224>>2]=l+q+w+32768>>16;e=e+4|0;g=g-1|0}return}function dG(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;f=a;a=b;b=e;e=f+224|0;eq(e|0,0,32)|0;e=f;g=0;while(1){if((g|0)>=7){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+13|0]|0)|0;j=(d[h+1|0]|0)+(d[h+12|0]|0)|0;k=(d[h+2|0]|0)+(d[h+11|0]|0)|0;l=(d[h+3|0]|0)+(d[h+10|0]|0)|0;m=(d[h+4|0]|0)+(d[h+9|0]|0)|0;n=(d[h+5|0]|0)+(d[h+8|0]|0)|0;o=(d[h+6|0]|0)+(d[h+7|0]|0)|0;p=i+o|0;q=i-o|0;r=j+n|0;s=j-n|0;t=k+m|0;u=k-m|0;i=(d[h|0]|0)-(d[h+13|0]|0)|0;j=(d[h+1|0]|0)-(d[h+12|0]|0)|0;k=(d[h+2|0]|0)-(d[h+11|0]|0)|0;v=(d[h+3|0]|0)-(d[h+10|0]|0)|0;m=(d[h+4|0]|0)-(d[h+9|0]|0)|0;n=(d[h+5|0]|0)-(d[h+8|0]|0)|0;o=(d[h+6|0]|0)-(d[h+7|0]|0)|0;c[e>>2]=p+r+t+l-1792<<2;l=l+l|0;c[e+16>>2]=((p-l|0)*10438|0)+((r-l|0)*2578|0)-((t-l|0)*7223|0)+1024>>11;p=(q+s|0)*9058|0;c[e+8>>2]=p+(q*2237|0)+(u*5027|0)+1024>>11;c[e+24>>2]=p-(s*14084|0)-(u*11295|0)+1024>>11;p=j+k|0;r=n-m|0;c[e+28>>2]=i-p+v-r-o<<2;v=v<<13;p=p*-1297|0;r=r*11512|0;p=p+(r-v)|0;r=((i+k|0)*9810|0)+((m+o|0)*6164|0)|0;c[e+20>>2]=p+r-(k*19447|0)+(m*9175|0)+1024>>11;t=((i+j|0)*10935|0)+((n-o|0)*3826|0)|0;c[e+12>>2]=p+t-(j*3474|0)-(n*25148|0)+1024>>11;c[e+4>>2]=r+t+v+o-((i+o|0)*9232|0)+1024>>11;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+192>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+160>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+128>>2]|0)|0;v=c[e+96>>2]|0;p=(c[e>>2]|0)-(c[e+192>>2]|0)|0;r=(c[e+32>>2]|0)-(c[e+160>>2]|0)|0;t=(c[e+64>>2]|0)-(c[e+128>>2]|0)|0;f=i+k|0;c[e>>2]=((f+j+v|0)*10700|0)+32768>>16;v=v+v|0;f=f-v|0;f=f-v|0;f=f*3783|0;b=(i-k|0)*9850|0;a=(j-k|0)*3367|0;c[e+64>>2]=f+b+a+32768>>16;f=f-b|0;b=(i-j|0)*9434|0;c[e+128>>2]=b+a-((j-v|0)*7566|0)+32768>>16;c[e+192>>2]=f+b+32768>>16;j=(p+r|0)*10009|0;k=(p-r|0)*1822|0;i=j-k|0;j=j+k|0;k=(r+t|0)*-14752|0;j=j+k|0;v=(p+t|0)*6565|0;i=i+v|0;k=k+(v+(t*20017|0))|0;c[e+32>>2]=i+32768>>16;c[e+96>>2]=j+32768>>16;c[e+160>>2]=k+32768>>16;e=e+4|0;g=g-1|0}return}function dH(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0;f=a;a=b;b=e;e=f+192|0;eq(e|0,0,64)|0;e=f;g=0;while(1){if((g|0)>=6){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+11|0]|0)|0;j=(d[h+1|0]|0)+(d[h+10|0]|0)|0;k=(d[h+2|0]|0)+(d[h+9|0]|0)|0;l=(d[h+3|0]|0)+(d[h+8|0]|0)|0;m=(d[h+4|0]|0)+(d[h+7|0]|0)|0;n=(d[h+5|0]|0)+(d[h+6|0]|0)|0;o=i+n|0;p=i-n|0;q=j+m|0;r=j-m|0;s=k+l|0;t=k-l|0;i=(d[h|0]|0)-(d[h+11|0]|0)|0;j=(d[h+1|0]|0)-(d[h+10|0]|0)|0;k=(d[h+2|0]|0)-(d[h+9|0]|0)|0;l=(d[h+3|0]|0)-(d[h+8|0]|0)|0;m=(d[h+4|0]|0)-(d[h+7|0]|0)|0;n=(d[h+5|0]|0)-(d[h+6|0]|0)|0;c[e>>2]=o+q+s-1536<<2;c[e+24>>2]=p-r-t<<2;c[e+16>>2]=((o-s|0)*10033|0)+1024>>11;c[e+8>>2]=r-t+((p+t|0)*11190|0)+1024>>11;o=(j+m|0)*4433|0;r=o+(j*6270|0)|0;t=o-(m*15137|0)|0;s=(i+k|0)*9191|0;p=(i+l|0)*7053|0;o=s+p+r-(i*4758|0)+(n*1512|0)|0;q=(k+l|0)*-1512|0;s=s+(q-t-(k*19165|0)+(n*7053|0))|0;p=p+(q-r+(l*5946|0)-(n*9191|0))|0;q=t+((i-l|0)*10703|0)-((k+n|0)*4433|0)|0;c[e+4>>2]=o+1024>>11;c[e+12>>2]=q+1024>>11;c[e+20>>2]=s+1024>>11;c[e+28>>2]=p+1024>>11;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+160>>2]|0)|0;q=(c[e+32>>2]|0)+(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+96>>2]|0)|0;o=i+k|0;s=i-k|0;i=(c[e>>2]|0)-(c[e+160>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)-(c[e+96>>2]|0)|0;c[e>>2]=((o+q|0)*14564|0)+32768>>16;c[e+64>>2]=(s*17837|0)+32768>>16;c[e+128>>2]=((o-q-q|0)*10298|0)+32768>>16;o=(i+k|0)*5331|0;c[e+32>>2]=o+((i+j|0)*14564|0)+32768>>16;c[e+96>>2]=((i-j-k|0)*14564|0)+32768>>16;c[e+160>>2]=o+((k-j|0)*14564|0)+32768>>16;e=e+4|0;g=g-1|0}return}function dI(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;f=a;a=b;b=e;e=f+160|0;eq(e|0,0,96)|0;e=f;g=0;while(1){if((g|0)>=5){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+9|0]|0)|0;j=(d[h+1|0]|0)+(d[h+8|0]|0)|0;k=(d[h+2|0]|0)+(d[h+7|0]|0)|0;l=(d[h+3|0]|0)+(d[h+6|0]|0)|0;m=(d[h+4|0]|0)+(d[h+5|0]|0)|0;n=i+m|0;o=i-m|0;p=j+l|0;q=j-l|0;i=(d[h|0]|0)-(d[h+9|0]|0)|0;j=(d[h+1|0]|0)-(d[h+8|0]|0)|0;r=(d[h+2|0]|0)-(d[h+7|0]|0)|0;l=(d[h+3|0]|0)-(d[h+6|0]|0)|0;m=(d[h+4|0]|0)-(d[h+5|0]|0)|0;c[e>>2]=n+p+k-1280<<2;k=k+k|0;c[e+16>>2]=((n-k|0)*9373|0)-((p-k|0)*3580|0)+1024>>11;n=(o+q|0)*6810|0;c[e+8>>2]=n+(o*4209|0)+1024>>11;c[e+24>>2]=n-(q*17828|0)+1024>>11;n=i+m|0;p=j-l|0;c[e+20>>2]=n-p-r<<2;r=r<<13;c[e+4>>2]=(i*11443|0)+(j*10323|0)+r+(l*5260|0)+(m*1812|0)+1024>>11;k=((i-m|0)*7791|0)-((j+l|0)*4815|0)|0;o=((n+p|0)*2531|0)+(p<<12)-r|0;c[e+12>>2]=k+o+1024>>11;c[e+28>>2]=k-o+1024>>11;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+128>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+96>>2]|0)|0;r=c[e+64>>2]|0;n=i+j|0;p=i-j|0;i=(c[e>>2]|0)-(c[e+128>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+96>>2]|0)|0;c[e>>2]=((n+r|0)*10486|0)+16384>>15;p=p*8290|0;n=n-(r<<2)|0;n=n*3707|0;c[e+64>>2]=p+n+16384>>15;c[e+128>>2]=p-n+16384>>15;n=(i+j|0)*8716|0;c[e+32>>2]=n+(i*5387|0)+16384>>15;c[e+96>>2]=n-(j*22820|0)+16384>>15;e=e+4|0;g=g-1|0}return}function dJ(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0;f=a;a=b;b=e;e=f+128|0;eq(e|0,0,128)|0;e=f;g=0;while(1){if((g|0)>=4){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+7|0]|0)|0;j=(d[h+1|0]|0)+(d[h+6|0]|0)|0;k=(d[h+2|0]|0)+(d[h+5|0]|0)|0;l=(d[h+3|0]|0)+(d[h+4|0]|0)|0;m=i+l|0;n=i-l|0;o=j+k|0;p=j-k|0;i=(d[h|0]|0)-(d[h+7|0]|0)|0;j=(d[h+1|0]|0)-(d[h+6|0]|0)|0;k=(d[h+2|0]|0)-(d[h+5|0]|0)|0;l=(d[h+3|0]|0)-(d[h+4|0]|0)|0;c[e>>2]=m+o-1024<<3;c[e+16>>2]=m-o<<3;h=(n+p|0)*4433|0;h=h+512|0;c[e+8>>2]=h+(n*6270|0)>>10;c[e+24>>2]=h-(p*15137|0)>>10;m=i+l|0;o=j+k|0;n=i+k|0;p=j+l|0;h=(n+p|0)*9633|0;h=h+512|0;i=i*12299|0;j=j*25172|0;k=k*16819|0;l=l*2446|0;m=m*-7373|0;o=o*-20995|0;n=n*-3196|0;p=p*-16069|0;n=n+h|0;p=p+h|0;c[e+4>>2]=i+m+n>>10;c[e+12>>2]=j+o+p>>10;c[e+20>>2]=k+o+n>>10;c[e+28>>2]=l+m+p>>10;e=e+32|0;g=g+1|0}e=f;g=7;while(1){if((g|0)<0){break}i=(c[e>>2]|0)+(c[e+96>>2]|0)+2|0;j=(c[e+32>>2]|0)+(c[e+64>>2]|0)|0;m=(c[e>>2]|0)-(c[e+96>>2]|0)|0;o=(c[e+32>>2]|0)-(c[e+64>>2]|0)|0;c[e>>2]=i+j>>2;c[e+64>>2]=i-j>>2;i=(m+o|0)*4433|0;i=i+16384|0;c[e+32>>2]=i+(m*6270|0)>>15;c[e+96>>2]=i-(o*15137|0)>>15;e=e+4|0;g=g-1|0}return}function dK(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=3){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+5|0]|0)|0;j=(d[h+1|0]|0)+(d[h+4|0]|0)|0;k=(d[h+2|0]|0)+(d[h+3|0]|0)|0;l=i+k|0;m=i-k|0;i=(d[h|0]|0)-(d[h+5|0]|0)|0;n=(d[h+1|0]|0)-(d[h+4|0]|0)|0;k=(d[h+2|0]|0)-(d[h+3|0]|0)|0;c[e>>2]=l+j-768<<3;c[e+8>>2]=(m*10033|0)+512>>10;c[e+16>>2]=((l-j-j|0)*5793|0)+512>>10;l=((i+k|0)*2998|0)+512>>10;c[e+4>>2]=l+(i+n<<3);c[e+12>>2]=i-n-k<<3;c[e+20>>2]=l+(k-n<<3);e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=6){break}i=(c[e>>2]|0)+(c[e+64>>2]|0)|0;n=c[e+32>>2]|0;k=(c[e>>2]|0)-(c[e+64>>2]|0)|0;c[e>>2]=((i+n|0)*14564|0)+16384>>15;c[e+64>>2]=((i-n-n|0)*10298|0)+16384>>15;c[e+32>>2]=(k*17837|0)+16384>>15;e=e+4|0;g=g+1|0}return}function dL(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=2){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+3|0]|0)|0;j=(d[h+1|0]|0)+(d[h+2|0]|0)|0;k=(d[h|0]|0)-(d[h+3|0]|0)|0;l=(d[h+1|0]|0)-(d[h+2|0]|0)|0;c[e>>2]=i+j-512<<5;c[e+8>>2]=i-j<<5;i=(k+l|0)*4433|0;i=i+128|0;c[e+4>>2]=i+(k*6270|0)>>8;c[e+12>>2]=i-(l*15137|0)>>8;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=4){break}i=(c[e>>2]|0)+2|0;j=c[e+32>>2]|0;c[e>>2]=i+j>>2;c[e+32>>2]=i-j>>2;e=e+4|0;g=g+1|0}return}function dM(a,b,e){a=a|0;b=b|0;e=e|0;var f=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=(c[a>>2]|0)+b|0;b=d[e|0]|0;a=d[e+1|0]|0;c[f>>2]=b+a-256<<5;c[f+4>>2]=b-a<<5;return}function dN(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0;f=i;i=i+256|0;g=f|0;h=a;a=b;b=e;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+7|0]|0)|0;m=(d[k+1|0]|0)+(d[k+6|0]|0)|0;n=(d[k+2|0]|0)+(d[k+5|0]|0)|0;o=(d[k+3|0]|0)+(d[k+4|0]|0)|0;p=l+o|0;q=l-o|0;r=m+n|0;s=m-n|0;l=(d[k|0]|0)-(d[k+7|0]|0)|0;m=(d[k+1|0]|0)-(d[k+6|0]|0)|0;n=(d[k+2|0]|0)-(d[k+5|0]|0)|0;o=(d[k+3|0]|0)-(d[k+4|0]|0)|0;c[e>>2]=p+r-1024<<2;c[e+16>>2]=p-r<<2;k=(q+s|0)*4433|0;c[e+8>>2]=k+(q*6270|0)+1024>>11;c[e+24>>2]=k-(s*15137|0)+1024>>11;p=l+o|0;r=m+n|0;q=l+n|0;s=m+o|0;k=(q+s|0)*9633|0;l=l*12299|0;m=m*25172|0;n=n*16819|0;o=o*2446|0;p=p*-7373|0;r=r*-20995|0;q=q*-3196|0;s=s*-16069|0;q=q+k|0;s=s+k|0;c[e+4>>2]=l+p+q+1024>>11;c[e+12>>2]=m+r+s+1024>>11;c[e+20>>2]=n+r+q+1024>>11;c[e+28>>2]=o+p+s+1024>>11;j=j+1|0;if((j|0)!=8){if((j|0)==16){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=7;while(1){if((j|0)<0){break}l=(c[e>>2]|0)+(c[h+224>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+192>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+160>>2]|0)|0;o=(c[e+96>>2]|0)+(c[h+128>>2]|0)|0;g=(c[e+128>>2]|0)+(c[h+96>>2]|0)|0;b=(c[e+160>>2]|0)+(c[h+64>>2]|0)|0;a=(c[e+192>>2]|0)+(c[h+32>>2]|0)|0;k=(c[e+224>>2]|0)+(c[h>>2]|0)|0;p=l+k|0;t=l-k|0;r=m+a|0;u=m-a|0;q=n+b|0;v=n-b|0;s=o+g|0;w=o-g|0;l=(c[e>>2]|0)-(c[h+224>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h+192>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+160>>2]|0)|0;o=(c[e+96>>2]|0)-(c[h+128>>2]|0)|0;g=(c[e+128>>2]|0)-(c[h+96>>2]|0)|0;b=(c[e+160>>2]|0)-(c[h+64>>2]|0)|0;a=(c[e+192>>2]|0)-(c[h+32>>2]|0)|0;k=(c[e+224>>2]|0)-(c[h>>2]|0)|0;c[e>>2]=p+r+q+s+4>>3;c[e+128>>2]=((p-s|0)*10703|0)+((r-q|0)*4433|0)+32768>>16;p=((w-u|0)*2260|0)+((t-v|0)*11363|0)|0;c[e+64>>2]=p+(u*11893|0)+(v*17799|0)+32768>>16;c[e+192>>2]=p-(t*1730|0)-(w*8697|0)+32768>>16;r=((l+m|0)*11086|0)+((a-k|0)*3363|0)|0;q=((l+n|0)*10217|0)+((b+k|0)*5461|0)|0;s=((l+o|0)*8956|0)+((g-k|0)*7350|0)|0;t=((m+n|0)*1136|0)+((a-b|0)*11529|0)|0;u=((m+o|0)*-5461|0)+((g+a|0)*-10217|0)|0;v=((n+o|0)*-11086|0)+((b-g|0)*3363|0)|0;p=r+q+s-(l*18730|0)+(k*6387|0)|0;r=r+(t+u+(m*589|0)-(a*13631|0))|0;q=q+(t+v-(n*9222|0)+(b*10055|0))|0;s=s+(u+v+(o*8728|0)+(g*17760|0))|0;c[e+32>>2]=p+32768>>16;c[e+96>>2]=r+32768>>16;c[e+160>>2]=q+32768>>16;c[e+224>>2]=s+32768>>16;e=e+4|0;h=h+4|0;j=j-1|0}i=f;return}function dO(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;f=i;i=i+192|0;g=f|0;h=a;a=b;b=e;e=h;eq(e|0,0,256)|0;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+6|0]|0)|0;m=(d[k+1|0]|0)+(d[k+5|0]|0)|0;n=(d[k+2|0]|0)+(d[k+4|0]|0)|0;o=d[k+3|0]|0;p=(d[k|0]|0)-(d[k+6|0]|0)|0;q=(d[k+1|0]|0)-(d[k+5|0]|0)|0;r=(d[k+2|0]|0)-(d[k+4|0]|0)|0;k=l+n|0;c[e>>2]=k+m+o-896<<2;o=o+o|0;k=k-o|0;k=k-o|0;k=k*2896|0;s=(l-n|0)*7542|0;t=(m-n|0)*2578|0;c[e+8>>2]=k+s+t+1024>>11;k=k-s|0;s=(l-m|0)*7223|0;c[e+16>>2]=s+t-((m-o|0)*5793|0)+1024>>11;c[e+24>>2]=k+s+1024>>11;m=(p+q|0)*7663|0;n=(p-q|0)*1395|0;l=m-n|0;m=m+n|0;n=(q+r|0)*-11295|0;m=m+n|0;o=(p+r|0)*5027|0;l=l+o|0;n=n+(o+(r*15326|0))|0;c[e+4>>2]=l+1024>>11;c[e+12>>2]=m+1024>>11;c[e+20>>2]=n+1024>>11;j=j+1|0;if((j|0)!=8){if((j|0)==14){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=0;while(1){if((j|0)>=7){break}l=(c[e>>2]|0)+(c[h+160>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h+128>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+96>>2]|0)|0;g=(c[e+96>>2]|0)+(c[h+64>>2]|0)|0;b=(c[e+128>>2]|0)+(c[h+32>>2]|0)|0;a=(c[e+160>>2]|0)+(c[h>>2]|0)|0;s=(c[e+192>>2]|0)+(c[e+224>>2]|0)|0;p=l+s|0;k=l-s|0;q=m+a|0;t=m-a|0;r=n+b|0;u=n-b|0;l=(c[e>>2]|0)-(c[h+160>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h+128>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+96>>2]|0)|0;o=(c[e+96>>2]|0)-(c[h+64>>2]|0)|0;b=(c[e+128>>2]|0)-(c[h+32>>2]|0)|0;a=(c[e+160>>2]|0)-(c[h>>2]|0)|0;s=(c[e+192>>2]|0)-(c[e+224>>2]|0)|0;c[e>>2]=((p+q+r+g|0)*5350|0)+16384>>15;g=g+g|0;c[e+128>>2]=((p-g|0)*6817|0)+((q-g|0)*1684|0)-((r-g|0)*4717|0)+16384>>15;p=(k+t|0)*5915|0;c[e+64>>2]=p+(k*1461|0)+(u*3283|0)+16384>>15;c[e+192>>2]=p-(t*9198|0)-(u*7376|0)+16384>>15;p=m+n|0;q=a-b|0;c[e+224>>2]=((l-p+o-q-s|0)*5350|0)+16384>>15;o=o*5350|0;p=p*-847|0;q=q*7518|0;p=p+(q-o)|0;q=((l+n|0)*6406|0)+((b+s|0)*4025|0)|0;c[e+160>>2]=p+q-(n*12700|0)+(b*5992|0)+16384>>15;r=((l+m|0)*7141|0)+((a-s|0)*2499|0)|0;c[e+96>>2]=p+r-(m*2269|0)-(a*16423|0)+16384>>15;c[e+32>>2]=q+r+o-(l*6029|0)-(s*679|0)+16384>>15;e=e+4|0;h=h+4|0;j=j+1|0}i=f;return}function dP(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;f=i;i=i+128|0;g=f|0;h=a;a=b;b=e;e=h;eq(e|0,0,256)|0;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+5|0]|0)|0;m=(d[k+1|0]|0)+(d[k+4|0]|0)|0;n=(d[k+2|0]|0)+(d[k+3|0]|0)|0;o=l+n|0;p=l-n|0;l=(d[k|0]|0)-(d[k+5|0]|0)|0;q=(d[k+1|0]|0)-(d[k+4|0]|0)|0;n=(d[k+2|0]|0)-(d[k+3|0]|0)|0;c[e>>2]=o+m-768<<2;c[e+8>>2]=(p*10033|0)+1024>>11;c[e+16>>2]=((o-m-m|0)*5793|0)+1024>>11;o=((l+n|0)*2998|0)+1024>>11;c[e+4>>2]=o+(l+q<<2);c[e+12>>2]=l-q-n<<2;c[e+20>>2]=o+(n-q<<2);j=j+1|0;if((j|0)!=8){if((j|0)==12){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=0;while(1){if((j|0)>=6){break}l=(c[e>>2]|0)+(c[h+96>>2]|0)|0;q=(c[e+32>>2]|0)+(c[h+64>>2]|0)|0;n=(c[e+64>>2]|0)+(c[h+32>>2]|0)|0;g=(c[e+96>>2]|0)+(c[h>>2]|0)|0;b=(c[e+128>>2]|0)+(c[e+224>>2]|0)|0;a=(c[e+160>>2]|0)+(c[e+192>>2]|0)|0;o=l+a|0;k=l-a|0;m=q+b|0;r=q-b|0;p=n+g|0;s=n-g|0;l=(c[e>>2]|0)-(c[h+96>>2]|0)|0;q=(c[e+32>>2]|0)-(c[h+64>>2]|0)|0;n=(c[e+64>>2]|0)-(c[h+32>>2]|0)|0;g=(c[e+96>>2]|0)-(c[h>>2]|0)|0;b=(c[e+128>>2]|0)-(c[e+224>>2]|0)|0;a=(c[e+160>>2]|0)-(c[e+192>>2]|0)|0;c[e>>2]=((o+m+p|0)*7282|0)+16384>>15;c[e+192>>2]=((k-r-s|0)*7282|0)+16384>>15;c[e+128>>2]=((o-p|0)*8918|0)+16384>>15;c[e+64>>2]=((r-s|0)*7282|0)+((k+s|0)*9947|0)+16384>>15;o=(q+b|0)*3941|0;r=o+(q*5573|0)|0;s=o-(b*13455|0)|0;p=(l+n|0)*8170|0;k=(l+g|0)*6269|0;o=p+k+r-(l*4229|0)+(a*1344|0)|0;m=(n+g|0)*-1344|0;p=p+(m-s-(n*17036|0)+(a*6269|0))|0;k=k+(m-r+(g*5285|0)-(a*8170|0))|0;m=s+((l-g|0)*9514|0)-((n+a|0)*3941|0)|0;c[e+32>>2]=o+16384>>15;c[e+96>>2]=m+16384>>15;c[e+160>>2]=p+16384>>15;c[e+224>>2]=k+16384>>15;e=e+4|0;h=h+4|0;j=j+1|0}i=f;return}function dQ(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;f=i;i=i+64|0;g=f|0;h=a;a=b;b=e;e=h;eq(e|0,0,256)|0;e=h;j=0;while(1){k=(c[a+(j<<2)>>2]|0)+b|0;l=(d[k|0]|0)+(d[k+4|0]|0)|0;m=(d[k+1|0]|0)+(d[k+3|0]|0)|0;n=d[k+2|0]|0;o=l+m|0;p=l-m|0;l=(d[k|0]|0)-(d[k+4|0]|0)|0;m=(d[k+1|0]|0)-(d[k+3|0]|0)|0;c[e>>2]=o+n-640<<2;p=p*6476|0;o=o-(n<<2)|0;o=o*2896|0;c[e+8>>2]=p+o+1024>>11;c[e+16>>2]=p-o+1024>>11;o=(l+m|0)*6810|0;c[e+4>>2]=o+(l*4209|0)+1024>>11;c[e+12>>2]=o-(m*17828|0)+1024>>11;j=j+1|0;if((j|0)!=8){if((j|0)==10){break}e=e+32|0}else{e=g|0}}e=h;h=g|0;j=0;while(1){if((j|0)>=5){break}l=(c[e>>2]|0)+(c[h+32>>2]|0)|0;m=(c[e+32>>2]|0)+(c[h>>2]|0)|0;g=(c[e+64>>2]|0)+(c[e+224>>2]|0)|0;b=(c[e+96>>2]|0)+(c[e+192>>2]|0)|0;a=(c[e+128>>2]|0)+(c[e+160>>2]|0)|0;o=l+a|0;k=l-a|0;p=m+b|0;q=m-b|0;l=(c[e>>2]|0)-(c[h+32>>2]|0)|0;m=(c[e+32>>2]|0)-(c[h>>2]|0)|0;n=(c[e+64>>2]|0)-(c[e+224>>2]|0)|0;b=(c[e+96>>2]|0)-(c[e+192>>2]|0)|0;a=(c[e+128>>2]|0)-(c[e+160>>2]|0)|0;c[e>>2]=((o+p+g|0)*10486|0)+16384>>15;g=g+g|0;c[e+128>>2]=((o-g|0)*11997|0)-((p-g|0)*4582|0)+16384>>15;o=(k+q|0)*8716|0;c[e+64>>2]=o+(k*5387|0)+16384>>15;c[e+192>>2]=o-(q*22820|0)+16384>>15;o=l+a|0;p=m-b|0;c[e+160>>2]=((o-p-n|0)*10486|0)+16384>>15;n=n*10486|0;c[e+32>>2]=(l*14647|0)+(m*13213|0)+n+(b*6732|0)+(a*2320|0)+16384>>15;g=((l-a|0)*9973|0)-((m+b|0)*6163|0)|0;k=((o+p|0)*3240|0)+(p*5243|0)-n|0;c[e+96>>2]=g+k+16384>>15;c[e+224>>2]=g-k+16384>>15;e=e+4|0;h=h+4|0;j=j+1|0}i=f;return}function dR(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=8){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+3|0]|0)|0;j=(d[h+1|0]|0)+(d[h+2|0]|0)|0;k=(d[h|0]|0)-(d[h+3|0]|0)|0;l=(d[h+1|0]|0)-(d[h+2|0]|0)|0;c[e>>2]=i+j-512<<3;c[e+8>>2]=i-j<<3;i=(k+l|0)*4433|0;i=i+512|0;c[e+4>>2]=i+(k*6270|0)>>10;c[e+12>>2]=i-(l*15137|0)>>10;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=4){break}i=(c[e>>2]|0)+(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+192>>2]|0)|0;f=(c[e+64>>2]|0)+(c[e+160>>2]|0)|0;b=(c[e+96>>2]|0)+(c[e+128>>2]|0)|0;k=i+b+2|0;a=i-b|0;l=j+f|0;h=j-f|0;i=(c[e>>2]|0)-(c[e+224>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+192>>2]|0)|0;f=(c[e+64>>2]|0)-(c[e+160>>2]|0)|0;b=(c[e+96>>2]|0)-(c[e+128>>2]|0)|0;c[e>>2]=k+l>>2;c[e+128>>2]=k-l>>2;m=(a+h|0)*4433|0;m=m+16384|0;c[e+64>>2]=m+(a*6270|0)>>15;c[e+192>>2]=m-(h*15137|0)>>15;k=i+b|0;l=j+f|0;a=i+f|0;h=j+b|0;m=(a+h|0)*9633|0;m=m+16384|0;i=i*12299|0;j=j*25172|0;f=f*16819|0;b=b*2446|0;k=k*-7373|0;l=l*-20995|0;a=a*-3196|0;h=h*-16069|0;a=a+m|0;h=h+m|0;c[e+32>>2]=i+k+a>>15;c[e+96>>2]=j+l+h>>15;c[e+160>>2]=f+l+a>>15;c[e+224>>2]=b+k+h>>15;e=e+4|0;g=g+1|0}return}function dS(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=6){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=(d[h|0]|0)+(d[h+2|0]|0)|0;j=d[h+1|0]|0;k=(d[h|0]|0)-(d[h+2|0]|0)|0;c[e>>2]=i+j-384<<3;c[e+8>>2]=((i-j-j|0)*5793|0)+512>>10;c[e+4>>2]=(k*10033|0)+512>>10;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=3){break}i=(c[e>>2]|0)+(c[e+160>>2]|0)|0;f=(c[e+32>>2]|0)+(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)+(c[e+96>>2]|0)|0;b=i+k|0;a=i-k|0;i=(c[e>>2]|0)-(c[e+160>>2]|0)|0;j=(c[e+32>>2]|0)-(c[e+128>>2]|0)|0;k=(c[e+64>>2]|0)-(c[e+96>>2]|0)|0;c[e>>2]=((b+f|0)*14564|0)+16384>>15;c[e+64>>2]=(a*17837|0)+16384>>15;c[e+128>>2]=((b-f-f|0)*10298|0)+16384>>15;b=(i+k|0)*5331|0;c[e+32>>2]=b+((i+j|0)*14564|0)+16384>>15;c[e+96>>2]=((i-j-k|0)*14564|0)+16384>>15;c[e+160>>2]=b+((k-j|0)*14564|0)+16384>>15;e=e+4|0;g=g+1|0}return}function dT(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=f;g=0;while(1){if((g|0)>=4){break}h=(c[a+(g<<2)>>2]|0)+b|0;i=d[h|0]|0;j=d[h+1|0]|0;c[e>>2]=i+j-256<<3;c[e+4>>2]=i-j<<3;e=e+32|0;g=g+1|0}e=f;g=0;while(1){if((g|0)>=2){break}i=(c[e>>2]|0)+(c[e+96>>2]|0)|0;j=(c[e+32>>2]|0)+(c[e+64>>2]|0)|0;f=(c[e>>2]|0)-(c[e+96>>2]|0)|0;b=(c[e+32>>2]|0)-(c[e+64>>2]|0)|0;c[e>>2]=i+j;c[e+64>>2]=i-j;i=(f+b|0)*4433|0;i=i+4096|0;c[e+32>>2]=i+(f*6270|0)>>13;c[e+96>>2]=i-(b*15137|0)>>13;e=e+4|0;g=g+1|0}return}function dU(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0;f=a;a=b;b=e;e=f;eq(e|0,0,256)|0;e=d[(c[a>>2]|0)+b|0]|0;g=d[(c[a+4>>2]|0)+b|0]|0;c[f>>2]=e+g-256<<5;c[f+32>>2]=e-g<<5;return}function dV(a,b){a=a|0;b=b|0;var c=0;c=b;return(a+c-1|0)/(c|0)|0|0}function dW(a,b){a=a|0;b=b|0;var c=0;c=a;a=b;c=c+(a-1)|0;return c-((c|0)%(a|0)|0)|0}function dX(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0;h=a;a=d;d=g;h=h+(b<<2)|0;a=a+(e<<2)|0;e=f;while(1){if((e|0)<=0){break}f=h;h=f+4|0;b=a;a=b+4|0;g=c[b>>2]|0;b=c[f>>2]|0;f=d;er(g|0,b|0,f)|0;e=e-1|0}return}function dY(b){b=b|0;var d=0,e=0,f=0,g=0,h=0,j=0;d=i;i=i+16|0;e=d|0;f=d+8|0;g=b;c[g+4>>2]=0;if(1e9!=1e9){c[(c[g>>2]|0)+20>>2]=2;aT[c[c[g>>2]>>2]&63](g)}c[e>>2]=eh(g)|0;b=eb(g,84)|0;if((b|0)==0){ei(g);c[(c[g>>2]|0)+20>>2]=56;c[(c[g>>2]|0)+24>>2]=0;aT[c[c[g>>2]>>2]&63](g)}c[b>>2]=2;c[b+4>>2]=4;c[b+8>>2]=4;c[b+12>>2]=2;c[b+16>>2]=2;c[b+20>>2]=4;c[b+24>>2]=4;c[b+28>>2]=4;c[b+32>>2]=2;c[b+36>>2]=2;c[b+40>>2]=16;c[b+48>>2]=1e9;c[b+44>>2]=c[e>>2];h=1;while(1){if((h|0)<0){break}c[b+52+(h<<2)>>2]=0;c[b+60+(h<<2)>>2]=0;h=h-1|0}c[b+68>>2]=0;c[b+72>>2]=0;c[b+76>>2]=84;c[g+4>>2]=b;g=aK(6328)|0;if((g|0)==0){i=d;return}a[f]=120;h=as(g|0,7016,(g=i,i=i+16|0,c[g>>2]=e,c[g+8>>2]=f,g)|0)|0;i=g;if((h|0)>0){if((a[f]|0)==109){j=330}else{if((a[f]|0)==77){j=330}}if((j|0)==330){c[e>>2]=(c[e>>2]|0)*1e3|0}c[b+44>>2]=(c[e>>2]|0)*1e3|0}i=d;return}function dZ(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0;e=a;a=b;b=d;d=c[e+4>>2]|0;if(b>>>0>999999984>>>0){ea(e,1)}f=(b>>>0)%8|0;if(f>>>0>0>>>0){b=b+(8-f)|0}if((a|0)<0){g=342}else{if((a|0)>=2){g=342}}if((g|0)==342){c[(c[e>>2]|0)+20>>2]=15;c[(c[e>>2]|0)+24>>2]=a;aT[c[c[e>>2]>>2]&63](e)}f=0;h=c[d+52+(a<<2)>>2]|0;while(1){if((h|0)==0){break}if((c[h+8>>2]|0)>>>0>=b>>>0){g=346;break}f=h;h=c[h>>2]|0}if((h|0)!=0){i=h;j=i+16|0;k=j;l=k;m=h;n=m;o=n+4|0;p=c[o>>2]|0;q=l;r=q+p|0;l=r;s=b;t=h;u=t;v=u+4|0;w=c[v>>2]|0;x=w+s|0;c[v>>2]=x;y=b;z=h;A=z;B=A+8|0;C=c[B>>2]|0;D=C-y|0;c[B>>2]=D;E=l;return E|0}g=b+16|0;if((f|0)==0){F=c[2960+(a<<2)>>2]|0}else{F=c[2968+(a<<2)>>2]|0}if(F>>>0>(1e9-g|0)>>>0){F=1e9-g|0}while(1){h=eb(e,g+F|0)|0;if((h|0)!=0){break}F=(F>>>0)/2|0;if(F>>>0<50>>>0){ea(e,2)}}e=d+76|0;c[e>>2]=(c[e>>2]|0)+(g+F);c[h>>2]=0;c[h+4>>2]=0;c[h+8>>2]=b+F;if((f|0)==0){c[d+52+(a<<2)>>2]=h}else{c[f>>2]=h}i=h;j=i+16|0;k=j;l=k;m=h;n=m;o=n+4|0;p=c[o>>2]|0;q=l;r=q+p|0;l=r;s=b;t=h;u=t;v=u+4|0;w=c[v>>2]|0;x=w+s|0;c[v>>2]=x;y=b;z=h;A=z;B=A+8|0;C=c[B>>2]|0;D=C-y|0;c[B>>2]=D;E=l;return E|0}function d_(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0;e=a;a=b;b=d;d=c[e+4>>2]|0;if(b>>>0>999999984>>>0){ea(e,3)}f=(b>>>0)%8|0;if(f>>>0>0>>>0){b=b+(8-f)|0}if((a|0)<0){g=373}else{if((a|0)>=2){g=373}}if((g|0)==373){c[(c[e>>2]|0)+20>>2]=15;c[(c[e>>2]|0)+24>>2]=a;aT[c[c[e>>2]>>2]&63](e)}g=ed(e,b+16|0)|0;if((g|0)==0){ea(e,4)}e=d+76|0;c[e>>2]=(c[e>>2]|0)+(b+16);c[g>>2]=c[d+60+(a<<2)>>2];c[g+4>>2]=b;c[g+8>>2]=0;c[d+60+(a<<2)>>2]=g;return g+16|0}function d$(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=c[f+4>>2]|0;g=999999984/(b>>>0)|0;if((g|0)<=0){c[(c[f>>2]|0)+20>>2]=72;aT[c[c[f>>2]>>2]&63](f)}if((g|0)<(d|0)){h=g}else{h=d}c[e+80>>2]=h;e=dZ(f,a,d<<2)|0;g=0;while(1){if(g>>>0>=d>>>0){break}if(h>>>0<(d-g|0)>>>0){i=h}else{i=d-g|0}h=i;j=d_(f,a,$(h,b)|0)|0;k=h;while(1){if(k>>>0<=0>>>0){break}l=g;g=l+1|0;c[e+(l<<2)>>2]=j;j=j+b|0;k=k-1|0}}return e|0}function d0(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0;f=a;a=b;b=d;d=e;e=c[f+4>>2]|0;g=999999984/(b<<7>>>0)|0;if((g|0)<=0){c[(c[f>>2]|0)+20>>2]=72;aT[c[c[f>>2]>>2]&63](f)}if((g|0)<(d|0)){h=g}else{h=d}c[e+80>>2]=h;e=dZ(f,a,d<<2)|0;g=0;while(1){if(g>>>0>=d>>>0){break}if(h>>>0<(d-g|0)>>>0){i=h}else{i=d-g|0}h=i;j=d_(f,a,($(h,b)|0)<<7)|0;k=h;while(1){if(k>>>0<=0>>>0){break}l=g;g=l+1|0;c[e+(l<<2)>>2]=j;j=j+(b<<7)|0;k=k-1|0}}return e|0}function d1(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=a;a=b;b=c[h+4>>2]|0;if((a|0)!=1){c[(c[h>>2]|0)+20>>2]=15;c[(c[h>>2]|0)+24>>2]=a;aT[c[c[h>>2]>>2]&63](h)}i=dZ(h,a,128)|0;c[i>>2]=0;c[i+4>>2]=f;c[i+8>>2]=e;c[i+12>>2]=g;c[i+32>>2]=d;c[i+40>>2]=0;c[i+44>>2]=c[b+68>>2];c[b+68>>2]=i;return i|0}function d2(a,b,d,e,f,g){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;g=g|0;var h=0,i=0;h=a;a=b;b=c[h+4>>2]|0;if((a|0)!=1){c[(c[h>>2]|0)+20>>2]=15;c[(c[h>>2]|0)+24>>2]=a;aT[c[c[h>>2]>>2]&63](h)}i=dZ(h,a,128)|0;c[i>>2]=0;c[i+4>>2]=f;c[i+8>>2]=e;c[i+12>>2]=g;c[i+32>>2]=d;c[i+40>>2]=0;c[i+44>>2]=c[b+72>>2];c[b+72>>2]=i;return i|0}function d3(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0;b=a;a=c[b+4>>2]|0;d=0;e=0;f=c[a+68>>2]|0;while(1){if((f|0)==0){break}if((c[f>>2]|0)==0){d=d+($(c[f+12>>2]|0,c[f+8>>2]|0)|0)|0;e=e+($(c[f+4>>2]|0,c[f+8>>2]|0)|0)|0}f=c[f+44>>2]|0}g=c[a+72>>2]|0;while(1){if((g|0)==0){break}if((c[g>>2]|0)==0){d=d+(($(c[g+12>>2]|0,c[g+8>>2]|0)|0)<<7)|0;e=e+(($(c[g+4>>2]|0,c[g+8>>2]|0)|0)<<7)|0}g=c[g+44>>2]|0}if((d|0)<=0){return}h=ef(b,d,e,c[a+76>>2]|0)|0;if((h|0)>=(e|0)){i=1e9}else{i=(h|0)/(d|0)|0;if((i|0)<=0){i=1}}f=c[a+68>>2]|0;while(1){if((f|0)==0){break}if((c[f>>2]|0)==0){j=((((c[f+4>>2]|0)-1|0)>>>0)/((c[f+12>>2]|0)>>>0)|0)+1|0;if((j|0)<=(i|0)){c[f+16>>2]=c[f+4>>2]}else{c[f+16>>2]=$(i,c[f+12>>2]|0)|0;eg(b,f+48|0,$(c[f+4>>2]|0,c[f+8>>2]|0)|0);c[f+40>>2]=1}c[f>>2]=d$(b,1,c[f+8>>2]|0,c[f+16>>2]|0)|0;c[f+20>>2]=c[a+80>>2];c[f+24>>2]=0;c[f+28>>2]=0;c[f+36>>2]=0}f=c[f+44>>2]|0}g=c[a+72>>2]|0;while(1){if((g|0)==0){break}if((c[g>>2]|0)==0){j=((((c[g+4>>2]|0)-1|0)>>>0)/((c[g+12>>2]|0)>>>0)|0)+1|0;if((j|0)<=(i|0)){c[g+16>>2]=c[g+4>>2]}else{c[g+16>>2]=$(i,c[g+12>>2]|0)|0;eg(b,g+48|0,($(c[g+4>>2]|0,c[g+8>>2]|0)|0)<<7);c[g+40>>2]=1}c[g>>2]=d0(b,1,c[g+8>>2]|0,c[g+16>>2]|0)|0;c[g+20>>2]=c[a+80>>2];c[g+24>>2]=0;c[g+28>>2]=0;c[g+36>>2]=0}g=c[g+44>>2]|0}return}function d4(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=a;a=b;b=d;d=e;e=f;f=b+d|0;do{if(f>>>0>(c[a+4>>2]|0)>>>0){h=458}else{if(d>>>0>(c[a+12>>2]|0)>>>0){h=458;break}if((c[a>>2]|0)==0){h=458}}}while(0);if((h|0)==458){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}if(b>>>0<(c[a+24>>2]|0)>>>0){h=461}else{if(f>>>0>((c[a+24>>2]|0)+(c[a+16>>2]|0)|0)>>>0){h=461}}if((h|0)==461){if((c[a+40>>2]|0)==0){c[(c[g>>2]|0)+20>>2]=71;aT[c[c[g>>2]>>2]&63](g)}if((c[a+36>>2]|0)!=0){d9(g,a,1);c[a+36>>2]=0}if(b>>>0>(c[a+24>>2]|0)>>>0){c[a+24>>2]=b}else{h=f-(c[a+16>>2]|0)|0;if((h|0)<0){h=0}c[a+24>>2]=h}d9(g,a,0)}if((c[a+28>>2]|0)>>>0<f>>>0){if((c[a+28>>2]|0)>>>0<b>>>0){if((e|0)!=0){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}i=b}else{i=c[a+28>>2]|0}if((e|0)!=0){c[a+28>>2]=f}if((c[a+32>>2]|0)!=0){h=c[a+8>>2]|0;i=i-(c[a+24>>2]|0)|0;f=f-(c[a+24>>2]|0)|0;while(1){if(i>>>0>=f>>>0){break}d=c[(c[a>>2]|0)+(i<<2)>>2]|0;j=h;eq(d|0,0,j|0)|0;i=i+1|0}}else{if((e|0)==0){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}}}if((e|0)==0){k=a;l=k|0;m=c[l>>2]|0;n=b;o=a;p=o+24|0;q=c[p>>2]|0;r=n-q|0;s=m+(r<<2)|0;return s|0}c[a+36>>2]=1;k=a;l=k|0;m=c[l>>2]|0;n=b;o=a;p=o+24|0;q=c[p>>2]|0;r=n-q|0;s=m+(r<<2)|0;return s|0}function d5(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;g=a;a=b;b=d;d=e;e=f;f=b+d|0;do{if(f>>>0>(c[a+4>>2]|0)>>>0){h=496}else{if(d>>>0>(c[a+12>>2]|0)>>>0){h=496;break}if((c[a>>2]|0)==0){h=496}}}while(0);if((h|0)==496){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}if(b>>>0<(c[a+24>>2]|0)>>>0){h=499}else{if(f>>>0>((c[a+24>>2]|0)+(c[a+16>>2]|0)|0)>>>0){h=499}}if((h|0)==499){if((c[a+40>>2]|0)==0){c[(c[g>>2]|0)+20>>2]=71;aT[c[c[g>>2]>>2]&63](g)}if((c[a+36>>2]|0)!=0){d8(g,a,1);c[a+36>>2]=0}if(b>>>0>(c[a+24>>2]|0)>>>0){c[a+24>>2]=b}else{h=f-(c[a+16>>2]|0)|0;if((h|0)<0){h=0}c[a+24>>2]=h}d8(g,a,0)}if((c[a+28>>2]|0)>>>0<f>>>0){if((c[a+28>>2]|0)>>>0<b>>>0){if((e|0)!=0){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}i=b}else{i=c[a+28>>2]|0}if((e|0)!=0){c[a+28>>2]=f}if((c[a+32>>2]|0)!=0){h=c[a+8>>2]<<7;i=i-(c[a+24>>2]|0)|0;f=f-(c[a+24>>2]|0)|0;while(1){if(i>>>0>=f>>>0){break}d=c[(c[a>>2]|0)+(i<<2)>>2]|0;j=h;eq(d|0,0,j|0)|0;i=i+1|0}}else{if((e|0)==0){c[(c[g>>2]|0)+20>>2]=23;aT[c[c[g>>2]>>2]&63](g)}}}if((e|0)==0){k=a;l=k|0;m=c[l>>2]|0;n=b;o=a;p=o+24|0;q=c[p>>2]|0;r=n-q|0;s=m+(r<<2)|0;return s|0}c[a+36>>2]=1;k=a;l=k|0;m=c[l>>2]|0;n=b;o=a;p=o+24|0;q=c[p>>2]|0;r=n-q|0;s=m+(r<<2)|0;return s|0}function d6(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=a;a=b;b=c[d+4>>2]|0;if((a|0)<0){e=533}else{if((a|0)>=2){e=533}}if((e|0)==533){c[(c[d>>2]|0)+20>>2]=15;c[(c[d>>2]|0)+24>>2]=a;aT[c[c[d>>2]>>2]&63](d)}if((a|0)==1){e=c[b+68>>2]|0;while(1){if((e|0)==0){break}if((c[e+40>>2]|0)!=0){c[e+40>>2]=0;aU[c[e+56>>2]&31](d,e+48|0)}e=c[e+44>>2]|0}c[b+68>>2]=0;e=c[b+72>>2]|0;while(1){if((e|0)==0){break}if((c[e+40>>2]|0)!=0){c[e+40>>2]=0;aU[c[e+56>>2]&31](d,e+48|0)}e=c[e+44>>2]|0}c[b+72>>2]=0}e=c[b+60+(a<<2)>>2]|0;c[b+60+(a<<2)>>2]=0;while(1){if((e|0)==0){break}f=c[e>>2]|0;g=(c[e+4>>2]|0)+(c[e+8>>2]|0)+16|0;ee(d,e,g);h=b+76|0;c[h>>2]=(c[h>>2]|0)-g;e=f}e=c[b+52+(a<<2)>>2]|0;c[b+52+(a<<2)>>2]=0;while(1){if((e|0)==0){break}a=c[e>>2]|0;g=(c[e+4>>2]|0)+(c[e+8>>2]|0)+16|0;ec(d,e,g);f=b+76|0;c[f>>2]=(c[f>>2]|0)-g;e=a}return}function d7(a){a=a|0;var b=0;b=a;a=1;while(1){if((a|0)<0){break}d6(b,a);a=a-1|0}ec(b,c[b+4>>2]|0,84);c[b+4>>2]=0;ei(b);return}function d8(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=a;a=b;b=d;d=c[a+8>>2]<<7;f=$(c[a+24>>2]|0,d)|0;g=0;while(1){if((g|0)>=(c[a+16>>2]|0)){h=579;break}if((c[a+20>>2]|0)<((c[a+16>>2]|0)-g|0)){i=c[a+20>>2]|0}else{i=(c[a+16>>2]|0)-g|0}j=i;k=(c[a+24>>2]|0)+g|0;if((j|0)<((c[a+28>>2]|0)-k|0)){l=j}else{l=(c[a+28>>2]|0)-k|0}j=l;if((j|0)<((c[a+4>>2]|0)-k|0)){m=j}else{m=(c[a+4>>2]|0)-k|0}j=m;if((j|0)<=0){break}k=$(j,d)|0;if((b|0)!=0){aR[c[a+52>>2]&15](e,a+48|0,c[(c[a>>2]|0)+(g<<2)>>2]|0,f,k)}else{aR[c[a+48>>2]&15](e,a+48|0,c[(c[a>>2]|0)+(g<<2)>>2]|0,f,k)}f=f+k|0;g=g+(c[a+20>>2]|0)|0}if((h|0)==579){return}return}function d9(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0;e=a;a=b;b=d;d=c[a+8>>2]|0;f=$(c[a+24>>2]|0,d)|0;g=0;while(1){if((g|0)>=(c[a+16>>2]|0)){h=601;break}if((c[a+20>>2]|0)<((c[a+16>>2]|0)-g|0)){i=c[a+20>>2]|0}else{i=(c[a+16>>2]|0)-g|0}j=i;k=(c[a+24>>2]|0)+g|0;if((j|0)<((c[a+28>>2]|0)-k|0)){l=j}else{l=(c[a+28>>2]|0)-k|0}j=l;if((j|0)<((c[a+4>>2]|0)-k|0)){m=j}else{m=(c[a+4>>2]|0)-k|0}j=m;if((j|0)<=0){break}k=$(j,d)|0;if((b|0)!=0){aR[c[a+52>>2]&15](e,a+48|0,c[(c[a>>2]|0)+(g<<2)>>2]|0,f,k)}else{aR[c[a+48>>2]&15](e,a+48|0,c[(c[a>>2]|0)+(g<<2)>>2]|0,f,k)}f=f+k|0;g=g+(c[a+20>>2]|0)|0}if((h|0)==601){return}return}function ea(a,b){a=a|0;b=b|0;var d=0;d=a;c[(c[d>>2]|0)+20>>2]=56;c[(c[d>>2]|0)+24>>2]=b;aT[c[c[d>>2]>>2]&63](d);return}function eb(a,b){a=a|0;b=b|0;return eo(b)|0}function ec(a,b,c){a=a|0;b=b|0;c=c|0;ep(b);return}function ed(a,b){a=a|0;b=b|0;return eo(b)|0}function ee(a,b,c){a=a|0;b=b|0;c=c|0;ep(b);return}function ef(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return c|0}function eg(a,b,d){a=a|0;b=b|0;d=d|0;d=a;c[(c[d>>2]|0)+20>>2]=51;aT[c[c[d>>2]>>2]&63](d);return}function eh(a){a=a|0;return 0}function ei(a){a=a|0;return}function ej(a){a=a|0;var b=0;b=a;if((c[b+24>>2]|0)==0){c[b+24>>2]=aW[c[c[b+4>>2]>>2]&7](b,0,28)|0}a=c[b+24>>2]|0;c[a+8>>2]=22;c[a+12>>2]=2;c[a+16>>2]=20;c[a+20>>2]=0;return}function ek(a){a=a|0;var b=0;b=a;a=c[b+24>>2]|0;c[a+24>>2]=aW[c[c[b+4>>2]>>2]&7](b,1,4096)|0;c[a>>2]=c[a+24>>2];c[a+4>>2]=4096;return}function el(a){a=a|0;var b=0;b=a;a=c[b+24>>2]|0;if((aI(c[a+20>>2]|0,c[a+24>>2]|0,4096)|0)!=4096){c[(c[b>>2]|0)+20>>2]=38;aT[c[c[b>>2]>>2]&63](b)}c[a>>2]=c[a+24>>2];c[a+4>>2]=4096;return 1}function em(a){a=a|0;var b=0,d=0;b=a;a=c[b+24>>2]|0;d=4096-(c[a+4>>2]|0)|0;if(d>>>0<=0>>>0){return}if((aI(c[a+20>>2]|0,c[a+24>>2]|0,d|0)|0)!=(d|0)){c[(c[b>>2]|0)+20>>2]=38;aT[c[c[b>>2]>>2]&63](b)}return}function en(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0;e=i;i=i+144|0;f=eo(432)|0;c[f>>2]=dg(e|0)|0;bj(f,80,432);ej(f);c[f+28>>2]=a;c[f+32>>2]=b;c[f+36>>2]=3;c[f+40>>2]=2;cX(f);cW(f,d,1);bm(f,1);i=e;return f|0}function eo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0,ar=0,as=0,at=0,au=0,av=0,ax=0,ay=0,az=0,aA=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0;do{if(a>>>0<245>>>0){if(a>>>0<11>>>0){b=16}else{b=a+11&-8}d=b>>>3;e=c[2032]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=8168+(h<<2)|0;j=8168+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[2032]=e&~(1<<g)}else{if(l>>>0<(c[2036]|0)>>>0){aw();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{aw();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[2034]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=8168+(p<<2)|0;m=8168+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[2032]=e&~(1<<r)}else{if(l>>>0<(c[2036]|0)>>>0){aw();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{aw();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[2034]|0;if((l|0)!=0){q=c[2037]|0;d=l>>>3;l=d<<1;f=8168+(l<<2)|0;k=c[2032]|0;h=1<<d;do{if((k&h|0)==0){c[2032]=k|h;s=f;t=8168+(l+2<<2)|0}else{d=8168+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[2036]|0)>>>0){s=g;t=d;break}aw();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[2034]=m;c[2037]=e;n=i;return n|0}l=c[2033]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[8432+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[2036]|0;if(r>>>0<i>>>0){aw();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){aw();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){aw();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){aw();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){aw();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{aw();return 0}}}while(0);L875:do{if((e|0)!=0){f=d+28|0;i=8432+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[2033]=c[2033]&~(1<<c[f>>2]);break L875}else{if(e>>>0<(c[2036]|0)>>>0){aw();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L875}}}while(0);if(v>>>0<(c[2036]|0)>>>0){aw();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16>>>0){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[2034]|0;if((f|0)!=0){e=c[2037]|0;i=f>>>3;f=i<<1;q=8168+(f<<2)|0;k=c[2032]|0;g=1<<i;do{if((k&g|0)==0){c[2032]=k|g;y=q;z=8168+(f+2<<2)|0}else{i=8168+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[2036]|0)>>>0){y=l;z=i;break}aw();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[2034]=p;c[2037]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231>>>0){o=-1;break}f=a+11|0;g=f&-8;k=c[2033]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215>>>0){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[8432+(A<<2)>>2]|0;L923:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L923}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[8432+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[2034]|0)-g|0)>>>0){o=g;break}q=K;m=c[2036]|0;if(q>>>0<m>>>0){aw();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){aw();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){aw();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){aw();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){aw();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{aw();return 0}}}while(0);L973:do{if((e|0)!=0){i=K+28|0;m=8432+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[2033]=c[2033]&~(1<<c[i>>2]);break L973}else{if(e>>>0<(c[2036]|0)>>>0){aw();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L973}}}while(0);if(L>>>0<(c[2036]|0)>>>0){aw();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16>>>0){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256>>>0){e=i<<1;m=8168+(e<<2)|0;r=c[2032]|0;j=1<<i;do{if((r&j|0)==0){c[2032]=r|j;O=m;P=8168+(e+2<<2)|0}else{i=8168+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[2036]|0)>>>0){O=d;P=i;break}aw();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215>>>0){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=8432+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[2033]|0;l=1<<Q;if((m&l|0)==0){c[2033]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=776;break}else{l=l<<1;m=j}}if((T|0)==776){if(S>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[2036]|0;if(m>>>0<i>>>0){aw();return 0}if(j>>>0<i>>>0){aw();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[2034]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[2037]|0;if(S>>>0>15>>>0){R=J;c[2037]=R+o;c[2034]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[2034]=0;c[2037]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[2035]|0;if(o>>>0<J>>>0){S=J-o|0;c[2035]=S;J=c[2038]|0;K=J;c[2038]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[2026]|0)==0){J=aB(30)|0;if((J-1&J|0)==0){c[2028]=J;c[2027]=J;c[2029]=-1;c[2030]=-1;c[2031]=0;c[2143]=0;c[2026]=(aO(0)|0)&-16^1431655768;break}else{aw();return 0}}}while(0);J=o+48|0;S=c[2028]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[2142]|0;do{if((O|0)!=0){P=c[2140]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1065:do{if((c[2143]&4|0)==0){O=c[2038]|0;L1067:do{if((O|0)==0){T=806}else{L=O;P=8576;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=806;break L1067}else{P=M}}if((P|0)==0){T=806;break}L=R-(c[2035]|0)&Q;if(L>>>0>=2147483647>>>0){W=0;break}m=aM(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=815}}while(0);do{if((T|0)==806){O=aM(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[2027]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[2140]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647>>>0)){W=0;break}m=c[2142]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=aM($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=815}}while(0);L1087:do{if((T|0)==815){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=826;break L1065}do{if((Z|0)!=-1&_>>>0<2147483647>>>0&_>>>0<J>>>0){g=c[2028]|0;O=K-_+g&-g;if(O>>>0>=2147483647>>>0){ac=_;break}if((aM(O|0)|0)==-1){aM(m|0)|0;W=Y;break L1087}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=826;break L1065}}}while(0);c[2143]=c[2143]|4;ad=W;T=823}else{ad=0;T=823}}while(0);do{if((T|0)==823){if(S>>>0>=2147483647>>>0){break}W=aM(S|0)|0;Z=aM(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=826}}}while(0);do{if((T|0)==826){ad=(c[2140]|0)+aa|0;c[2140]=ad;if(ad>>>0>(c[2141]|0)>>>0){c[2141]=ad}ad=c[2038]|0;L1107:do{if((ad|0)==0){S=c[2036]|0;if((S|0)==0|ab>>>0<S>>>0){c[2036]=ab}c[2144]=ab;c[2145]=aa;c[2147]=0;c[2041]=c[2026];c[2040]=-1;S=0;do{Y=S<<1;ac=8168+(Y<<2)|0;c[8168+(Y+3<<2)>>2]=ac;c[8168+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32>>>0);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[2038]=ab+ae;c[2035]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[2039]=c[2030]}else{S=8576;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=838;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==838){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[2038]|0;Y=(c[2035]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[2038]=Z+ai;c[2035]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[2039]=c[2030];break L1107}}while(0);if(ab>>>0<(c[2036]|0)>>>0){c[2036]=ab}S=ab+aa|0;Y=8576;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=848;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==848){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[2038]|0)){J=(c[2035]|0)+K|0;c[2035]=J;c[2038]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[2037]|0)){J=(c[2034]|0)+K|0;c[2034]=J;c[2037]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1152:do{if(X>>>0<256>>>0){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=8168+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[2036]|0)>>>0){aw();return 0}if((c[U+12>>2]|0)==(Z|0)){break}aw();return 0}}while(0);if((Q|0)==(U|0)){c[2032]=c[2032]&~(1<<V);break}do{if((Q|0)==(R|0)){am=Q+8|0}else{if(Q>>>0<(c[2036]|0)>>>0){aw();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){am=m;break}aw();return 0}}while(0);c[U+12>>2]=Q;c[am>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){an=0;break}else{ao=O;ap=e}}else{ao=L;ap=g}while(1){g=ao+20|0;L=c[g>>2]|0;if((L|0)!=0){ao=L;ap=g;continue}g=ao+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{ao=L;ap=g}}if(ap>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[ap>>2]=0;an=ao;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[2036]|0)>>>0){aw();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){aw();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;an=P;break}else{aw();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=8432+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=an;if((an|0)!=0){break}c[2033]=c[2033]&~(1<<c[P>>2]);break L1152}else{if(m>>>0<(c[2036]|0)>>>0){aw();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=an}else{c[m+20>>2]=an}if((an|0)==0){break L1152}}}while(0);if(an>>>0<(c[2036]|0)>>>0){aw();return 0}c[an+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[an+16>>2]=P;c[P+24>>2]=an;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[an+20>>2]=P;c[P+24>>2]=an;break}}}while(0);aq=ab+(($|al)+aa)|0;ar=$+K|0}else{aq=Z;ar=K}J=aq+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=ar|1;c[ab+(ar+W)>>2]=ar;J=ar>>>3;if(ar>>>0<256>>>0){V=J<<1;X=8168+(V<<2)|0;P=c[2032]|0;m=1<<J;do{if((P&m|0)==0){c[2032]=P|m;as=X;at=8168+(V+2<<2)|0}else{J=8168+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[2036]|0)>>>0){as=U;at=J;break}aw();return 0}}while(0);c[at>>2]=_;c[as+12>>2]=_;c[ab+(W+8)>>2]=as;c[ab+(W+12)>>2]=X;break}V=ac;m=ar>>>8;do{if((m|0)==0){au=0}else{if(ar>>>0>16777215>>>0){au=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;au=ar>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8432+(au<<2)|0;c[ab+(W+28)>>2]=au;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[2033]|0;Q=1<<au;if((X&Q|0)==0){c[2033]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((au|0)==31){av=0}else{av=25-(au>>>1)|0}Q=ar<<av;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(ar|0)){break}ax=X+16+(Q>>>31<<2)|0;m=c[ax>>2]|0;if((m|0)==0){T=921;break}else{Q=Q<<1;X=m}}if((T|0)==921){if(ax>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[ax>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[2036]|0;if(X>>>0<$>>>0){aw();return 0}if(m>>>0<$>>>0){aw();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=8576;while(1){ay=c[W>>2]|0;if(ay>>>0<=Y>>>0){az=c[W+4>>2]|0;aA=ay+az|0;if(aA>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=ay+(az-39)|0;if((W&7|0)==0){aC=0}else{aC=-W&7}W=ay+(az-47+aC)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aD=0}else{aD=-_&7}_=aa-40-aD|0;c[2038]=ab+aD;c[2035]=_;c[ab+(aD+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[2039]=c[2030];c[ac+4>>2]=27;c[W>>2]=c[2144];c[W+4>>2]=c[2145];c[W+8>>2]=c[2146];c[W+12>>2]=c[2147];c[2144]=ab;c[2145]=aa;c[2147]=0;c[2146]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aA>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aA>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256>>>0){K=W<<1;Z=8168+(K<<2)|0;S=c[2032]|0;m=1<<W;do{if((S&m|0)==0){c[2032]=S|m;aE=Z;aF=8168+(K+2<<2)|0}else{W=8168+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[2036]|0)>>>0){aE=Q;aF=W;break}aw();return 0}}while(0);c[aF>>2]=ad;c[aE+12>>2]=ad;c[ad+8>>2]=aE;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aG=0}else{if(_>>>0>16777215>>>0){aG=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aG=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=8432+(aG<<2)|0;c[ad+28>>2]=aG;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[2033]|0;Q=1<<aG;if((Z&Q|0)==0){c[2033]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aG|0)==31){aH=0}else{aH=25-(aG>>>1)|0}Q=_<<aH;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aI=Z+16+(Q>>>31<<2)|0;m=c[aI>>2]|0;if((m|0)==0){T=956;break}else{Q=Q<<1;Z=m}}if((T|0)==956){if(aI>>>0<(c[2036]|0)>>>0){aw();return 0}else{c[aI>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[2036]|0;if(Z>>>0<m>>>0){aw();return 0}if(_>>>0<m>>>0){aw();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[2035]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[2035]=_;ad=c[2038]|0;Q=ad;c[2038]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(aN()|0)>>2]=12;n=0;return n|0}function ep(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[2036]|0;if(b>>>0<e>>>0){aw()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){aw()}h=f&-8;i=a+(h-8)|0;j=i;L1324:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){aw()}if((n|0)==(c[2037]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[2034]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256>>>0){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=8168+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){aw()}if((c[k+12>>2]|0)==(n|0)){break}aw()}}while(0);if((s|0)==(k|0)){c[2032]=c[2032]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){aw()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}aw()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){aw()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){aw()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){aw()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{aw()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=8432+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[2033]=c[2033]&~(1<<c[v>>2]);q=n;r=o;break L1324}else{if(p>>>0<(c[2036]|0)>>>0){aw()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1324}}}while(0);if(A>>>0<(c[2036]|0)>>>0){aw()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[2036]|0)>>>0){aw()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[2036]|0)>>>0){aw()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){aw()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){aw()}do{if((e&2|0)==0){if((j|0)==(c[2038]|0)){B=(c[2035]|0)+r|0;c[2035]=B;c[2038]=q;c[q+4>>2]=B|1;if((q|0)!=(c[2037]|0)){return}c[2037]=0;c[2034]=0;return}if((j|0)==(c[2037]|0)){B=(c[2034]|0)+r|0;c[2034]=B;c[2037]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1426:do{if(e>>>0<256>>>0){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=8168+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[2036]|0)>>>0){aw()}if((c[u+12>>2]|0)==(j|0)){break}aw()}}while(0);if((g|0)==(u|0)){c[2032]=c[2032]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[2036]|0)>>>0){aw()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}aw()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[2036]|0)>>>0){aw()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[2036]|0)>>>0){aw()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){aw()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{aw()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=8432+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[2033]=c[2033]&~(1<<c[t>>2]);break L1426}else{if(f>>>0<(c[2036]|0)>>>0){aw()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1426}}}while(0);if(E>>>0<(c[2036]|0)>>>0){aw()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[2036]|0)>>>0){aw()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[2036]|0)>>>0){aw()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[2037]|0)){H=B;break}c[2034]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256>>>0){d=r<<1;e=8168+(d<<2)|0;A=c[2032]|0;E=1<<r;do{if((A&E|0)==0){c[2032]=A|E;I=e;J=8168+(d+2<<2)|0}else{r=8168+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[2036]|0)>>>0){I=h;J=r;break}aw()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215>>>0){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=8432+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[2033]|0;d=1<<K;do{if((r&d|0)==0){c[2033]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1133;break}else{A=A<<1;J=E}}if((N|0)==1133){if(M>>>0<(c[2036]|0)>>>0){aw()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[2036]|0;if(J>>>0<E>>>0){aw()}if(B>>>0<E>>>0){aw()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[2040]|0)-1|0;c[2040]=q;if((q|0)==0){O=8584}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[2040]=-1;return}function eq(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,i=0;f=b+e|0;if((e|0)>=20){d=d&255;g=b&3;h=d|d<<8|d<<16|d<<24;i=f&~3;if(g){g=b+4-g|0;while((b|0)<(g|0)){a[b]=d;b=b+1|0}}while((b|0)<(i|0)){c[b>>2]=h;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}return b-e|0}function er(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function es(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function et(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aR[a&15](b|0,c|0,d|0,e|0,f|0)}function eu(a,b,c,d,e,f,g,h){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;h=h|0;aS[a&15](b|0,c|0,d|0,e|0,f|0,g|0,h|0)}function ev(a,b){a=a|0;b=b|0;aT[a&63](b|0)}function ew(a,b,c){a=a|0;b=b|0;c=c|0;aU[a&31](b|0,c|0)}function ex(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;return aV[a&7](b|0,c|0,d|0,e|0,f|0,g|0)|0}function ey(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;return aW[a&7](b|0,c|0,d|0)|0}function ez(a,b){a=a|0;b=b|0;return aX[a&3](b|0)|0}function eA(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aY[a&127](b|0,c|0,d|0)}function eB(a){a=a|0;aZ[a&1]()}function eC(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;return a_[a&7](b|0,c|0,d|0,e|0)|0}function eD(a,b,c){a=a|0;b=b|0;c=c|0;return a$[a&31](b|0,c|0)|0}function eE(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;return a0[a&7](b|0,c|0,d|0,e|0,f|0)|0}function eF(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;a1[a&15](b|0,c|0,d|0,e|0)}function eG(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(0)}function eH(a,b,c,d,e,f,g){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;g=g|0;aa(1)}function eI(a){a=a|0;aa(2)}function eJ(a,b){a=a|0;b=b|0;aa(3)}function eK(a,b,c,d,e,f){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;f=f|0;aa(4);return 0}function eL(a,b,c){a=a|0;b=b|0;c=c|0;aa(5);return 0}function eM(a){a=a|0;aa(6);return 0}function eN(a,b,c){a=a|0;b=b|0;c=c|0;aa(7)}function eO(){aa(8)}function eP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(9);return 0}function eQ(a,b){a=a|0;b=b|0;aa(10);return 0}function eR(a,b,c,d,e){a=a|0;b=b|0;c=c|0;d=d|0;e=e|0;aa(11);return 0}function eS(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;aa(12)}
// EMSCRIPTEN_END_FUNCS
var aR=[eG,eG,bJ,eG,bK,eG,bN,eG,bM,eG,bH,eG,c8,eG,bL,eG];var aS=[eH,eH,c4,eH,c2,eH,bR,eH,bQ,eH,eH,eH,eH,eH,eH,eH];var aT=[eI,eI,bV,eI,d3,eI,cn,eI,cI,eI,cp,eI,dh,eI,bI,eI,d7,eI,bP,eI,em,eI,ek,eI,bG,eI,dj,eI,cl,eI,bU,eI,cG,eI,bq,eI,co,eI,cm,eI,c7,eI,dl,eI,cH,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI,eI];var aU=[eJ,eJ,d6,eJ,cr,eJ,di,eJ,bT,eJ,c1,eJ,bA,eJ,ci,eJ,dk,eJ,bp,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ,eJ];var aV=[eK,eK,d1,eK,d2,eK,eK,eK];var aW=[eL,eL,dZ,eL,d_,eL,eL,eL];var aX=[eM,eM,el,eM];var aY=[eN,eN,dL,eN,dt,eN,dJ,eN,dA,eN,dR,eN,dx,eN,dK,eN,dF,eN,dP,eN,dw,eN,dU,eN,dp,eN,ds,eN,dI,eN,dG,eN,dE,eN,dO,eN,dn,eN,dz,eN,dC,eN,dQ,eN,dS,eN,du,eN,dT,eN,dv,eN,dM,eN,dq,eN,dr,eN,dN,eN,dH,eN,dy,eN,dB,eN,cq,eN,dm,eN,dD,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN,eN];var aZ=[eO,eO];var a_=[eP,eP,d0,eP,d$,eP,eP,eP];var a$=[eQ,eQ,b_,eQ,bC,eQ,bu,eQ,bs,eQ,bD,eQ,b$,eQ,bY,eQ,bw,eQ,bv,eQ,bE,eQ,bZ,eQ,bW,eQ,bX,eQ,bt,eQ,eQ,eQ];var a0=[eR,eR,d5,eR,d4,eR,eR,eR];var a1=[eS,eS,c9,eS,db,eS,da,eS,de,eS,dd,eS,cj,eS,dc,eS];return{_strlen:es,_jpeg_start_compress:bm,_jpeg_finish_compress:bl,_joutjs_init:en,_memset:eq,_malloc:eo,_memcpy:er,_jpeg_write_scanlines:bn,_free:ep,runPostSets:bi,stackAlloc:a2,stackSave:a3,stackRestore:a4,setThrew:a5,setTempRet0:a8,setTempRet1:a9,setTempRet2:ba,setTempRet3:bb,setTempRet4:bc,setTempRet5:bd,setTempRet6:be,setTempRet7:bf,setTempRet8:bg,setTempRet9:bh,dynCall_viiiii:et,dynCall_viiiiiii:eu,dynCall_vi:ev,dynCall_vii:ew,dynCall_iiiiiii:ex,dynCall_iiii:ey,dynCall_ii:ez,dynCall_viii:eA,dynCall_v:eB,dynCall_iiiii:eC,dynCall_iii:eD,dynCall_iiiiii:eE,dynCall_viiii:eF}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_viiiii": invoke_viiiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiiiii": invoke_iiiiiii, "invoke_iiii": invoke_iiii, "invoke_ii": invoke_ii, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiii": invoke_iiiii, "invoke_iii": invoke_iii, "invoke_iiiiii": invoke_iiiiii, "invoke_viiii": invoke_viiii, "_sscanf": _sscanf, "_snprintf": _snprintf, "__scanString": __scanString, "__getFloat": __getFloat, "_abort": _abort, "_fprintf": _fprintf, "_fflush": _fflush, "___buildEnvironment": ___buildEnvironment, "__reallyNegative": __reallyNegative, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "_fwrite": _fwrite, "_send": _send, "_write": _write, "_exit": _exit, "_sprintf": _sprintf, "_jswrite": _jswrite, "__formatString": __formatString, "_getenv": _getenv, "_pwrite": _pwrite, "_sbrk": _sbrk, "___errno_location": ___errno_location, "_time": _time, "__exit": __exit, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "NaN": NaN, "Infinity": Infinity, "_stderr": _stderr, "_jpeg_aritab": _jpeg_aritab }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _jpeg_start_compress = Module["_jpeg_start_compress"] = asm["_jpeg_start_compress"];
var _jpeg_finish_compress = Module["_jpeg_finish_compress"] = asm["_jpeg_finish_compress"];
var _joutjs_init = Module["_joutjs_init"] = asm["_joutjs_init"];
var _memset = Module["_memset"] = asm["_memset"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _jpeg_write_scanlines = Module["_jpeg_write_scanlines"] = asm["_jpeg_write_scanlines"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = asm["dynCall_viiiiiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = asm["dynCall_iiiiiii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// Warning: printing of i64 values may be slightly rounded! No deep i64 math used, so precise i64 code not included
var i64Math = null;
// === Auto-generated postamble setup entry stuff ===
if (memoryInitializer) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
    applyData(Module['readBinary'](memoryInitializer));
  } else {
    addRunDependency('memory initializer');
    Browser.asyncLoad(memoryInitializer, function(data) {
      applyData(data);
      removeRunDependency('memory initializer');
    }, function(data) {
      throw 'could not load memory initializer ' + memoryInitializer;
    });
  }
}
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun'] && shouldRunNow) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
    Module.printErr('preload time: ' + (Date.now() - preloadStartTime) + ' ms');
  }
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  try {
    var ret = Module['_main'](argc, argv, 0);
    // if we're not running an evented main loop, it's time to exit
    if (!Module['noExitRuntime']) {
      exit(ret);
    }
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (preloadStartTime === null) preloadStartTime = Date.now();
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    Module['calledRun'] = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  // exit the runtime
  exitRuntime();
  // TODO We should handle this differently based on environment.
  // In the browser, the best we can do is throw an exception
  // to halt execution, but in node we could process.exit and
  // I'd imagine SM shell would have something equivalent.
  // This would let us set a proper exit status (which
  // would be great for checking test exit statuses).
  // https://github.com/kripken/emscripten/issues/1371
  // throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
    Module.printErr(text);
  }
  ABORT = true;
  EXITSTATUS = 1;
  throw 'abort() at ' + stackTrace();
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
