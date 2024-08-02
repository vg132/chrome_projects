chrome.tabs.getSelected(null, function (tab) {
	chrome.extension.sendRequest({ 'please': 'returnviewstate', 'tab': tab.id }, function (response) {

		var uls = [document.createElement('ul')], strings = [], types = [];
		document.getElementById('viewstate').appendChild(uls[0]);
		try {
			// TODO: Break this out into a script and make it re-usable. 
			// TODO: Allow detection of .NET vs Mono and decode appropriately.

			var i = 0, s = atob(response.viewstate);

			function readInt7() {
				var v = 0, l = 0, b; do { b = s.charCodeAt(i++); v = v | ((b & 0x7f) << l); l += 7; } while (b & 0x80); return v;
			}

			function readInt64() {
				return ((s.charCodeAt(i++) << 56) | (s.charCodeAt(i++) << 48) | (s.charCodeAt(i++) << 40) | (s.charCodeAt(i++) << 32) | (s.charCodeAt(i++) << 24) | (s.charCodeAt(i++) << 16) | (s.charCodeAt(i++) << 8) | s.charCodeAt(i++));
			}

			function readInt32() {
				return ((s.charCodeAt(i++) << 24) | (s.charCodeAt(i++) << 16) | (s.charCodeAt(i++) << 8) | s.charCodeAt(i++));
			}

			function readInt16() {
				return ((s.charCodeAt(i++) << 8) | s.charCodeAt(i++));
			}

			if (s.charCodeAt(i++) != 0xff || s.charCodeAt(i++) != 0x01) {
				throw new Error('Invalid viewstate header.')
			}

			function readString() {
				var l = readInt7(), v = s.substr(i, l);
				strings.push(v);
				i += l;
				return v;
			}

			function readType() {
				var i = NaN;
				switch (s.charCodeAt(i++)) {
					case 0x29:
						types.push("(System.Web.)" + readString());
						return types[types.length - 1]
					case 0x2a:
						types.push(readString());
						return types[types.length - 1]
					case 0x2b:
						var l = readInt7();
						if (l > types.length - 1) {
							return "indexed, not found (" + l.toString() + ")"
						}
						return "indexed, " + types[l];
					default:
						throw new Error("Unknown type subtag: 0x" + s.charCodeAt(i - 1).toString(16));
				}
			}

			function read() {
				var c = 0, li = document.createElement('li');
				li.innerText = s.charCodeAt(i);
				uls[uls.length - 1].appendChild(li);
				switch (s.charCodeAt(i++)) {
					// null 
					case 0x00:
						li.innerText = "null";
						break;

					// short 
					case 0x01:
						li.innerText = "int16: " + readInt16().toString();
						break;

					// int (in 7-bit) 
					case 0x02:
						li.innerText = "int: " + readInt7().toString();
						break;

					// byte 
					case 0x03:
						li.innerText = "byte: 0x" + s.charCodeAt(i++).toString(16);
						break;

					// char 
					case 0x04:
						li.innerText = "char: " + s.charAt(i++);
						break;

					// string 
					case 0x05:
						li.innerText = "string: " + readString();
						break;

					// datetime is ticks, 64-bit int  
					case 0x06:
						li.innerText = "datetime: " + readInt64().toString();
						break;

					// double 
					case 0x07:
						li.innerText = "int64: " + readInt64().toString();
						break;

					// float 
					case 0x08:
						li.innerText = "int64: " + readInt64().toString();
						break;

					// int32 
					case 0x09:
						li.innerText = "int32: " + readInt32().toString();
						break;

					// color 
					case 0x0a:
						li.innerText = "color (known): " + readInt7().toString();
						break;

					// enum 
					case 0x0b:
						li.innerText = "enum: " + readType() + "[" + readInt7() + "]";
						break;

					// color (empty) 
					case 0x0c:
						li.innerText = "color (empty)";
						break;

					// pair 
					case 0x0f:
						li.innerText = "pair: (2):";
						uls.push(document.createElement('ul'));
						li.appendChild(uls[uls.length - 1]);

						read();
						read();

						uls.pop();
						break;

					// tripple 
					case 0x10:
						li.innerText = "triplet: (3): ";
						uls.push(document.createElement('ul'));
						li.appendChild(uls[uls.length - 1]);

						read();
						read();
						read();

						uls.pop();
						break;

					// string[] 
					case 0x15:
						// arraylist
					case 0x16:
						var l = readInt7();
						li.innerText = "arraylist: (" + l.toString() + "): ";
						uls.push(document.createElement('ul'));
						li.appendChild(uls[uls.length - 1]);

						for (var j = 0; j < l; j++) {
							read();
						}

						uls.pop();
						break;

					// hashtable 
					case 0x17:
						// hybriddictionary
					case 0x18:
						var l = readInt7();
						li.innerText = "hashtable: (" + l.toString() + "): ";
						uls.push(document.createElement('ul'));
						li.appendChild(uls[uls.length - 1]);

						for (var j = 0; j < l; j++) {
							read();
							read();
						}

						uls.pop();
						break;

					// type 
					case 0x19:
						li.innerText = "type: " + readType();
						break;

					// unit [value, unittype] 
					case 0x1b:
						li.innerText = "unit: " + readInt64().toString() + ", " + readInt16().toString();
						break;

					// unit (empty) 
					case 0x1c:
						li.innerText = "unit (empty)"
						break;

					// string 
					case 0x1e:
						var string = readString();
						strings.push(string);
						// TODO: Implement weird looping behaviour
						li.innerText = "string: " + string;
						break;

					// string (indexed) 
					case 0x1f:
						return strings[s.charCodeAt(i++)];

						// object (serialized to string)
					case 0x28:
						li.innerText = readType() + ": " + readString();
						break;

					// object (serialized as byte[]) 
					case 0x28:
						var t = readType, l = readInt7();
						li.innerText = t + ": (encoded as " + l.toString() + " bytes)";
						i += l;
						break;

					// sparse T[] 
					case 0x3c:
						var t = readType(), l = readInt7(), c = readInt7();
						li.innerText = t + '[' + l.toString() + '] (sparse):'
						uls.push(document.createElement('ul'));
						li.appendChild(uls[uls.length - 1]);

						for (var j = 0; j < c; j++) {
							readInt7()
							read();
						}

						ul.pop();
						break;

					// null 
					case 0x64:
						li.innerText = "null";
						break;

					// string (empty) 
					case 0x65:
						li.innerText = "string (empty): ";
						break;

					// int (0) 
					case 0x66:
						li.innerText = "int (0): 0";
						break;

					// true 
					case 0x67:
						li.innerText = "true";
						break;

					// false 
					case 0x68:
						li.innerText = "false";
						break;

					case NaN:
						throw new Error("Unexpected end of stream.");

					default:
						throw new Error("Unknown serialized type: 0x" + s.charCodeAt(i - 1).toString(16));
				}
			}
			read();
		} catch (e) {
			var el = document.createElement('div');
			el.id = 'error';
			el.innerText = e.toString();
			document.getElementById('viewstate').appendChild(el);
		}
	});
});
	