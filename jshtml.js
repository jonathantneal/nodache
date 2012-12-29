// JSHTML v4.0.0 MIT/GPL2 @jon_neal
(function (global) {
	function escapeJS(str) {
		return str.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
	}

	function TemplateWalk(str, chars) {
		// check for the opening delimiters and init our array buffer
		var index = str.indexOf(chars.START_PROP), buffer = '', helper;

		// if the opening delimiters are encountered
		if (index > -1) {
			// add to the buffer the contents before the opening delimiters
			buffer += 'document.write("' + escapeJS(str.substr(0, index)) + '");';

			// move the string to after the opening delimiters
			str = str.substr(index + chars.START_PROP.length);

			// get the helper character of the string
			helper = str.substr(0, 1);

			// get the index of the closing delimiters
			index = str.indexOf(chars.END_PROP);

			// if the closing delimiters are encountered
			if (index > -1) {
				if (helper == "=") {
					// add to the buffer the return of the helper function
					buffer += 'document.write(' + str.substr(helper.length, index - helper.length) + ');';

					// move the string to after the closing delimiters
					str = str.substr(index + chars.END_PROP.length);

					// add to the buffer the return of this function
					buffer += TemplateWalk(str, chars);
				} else {
					// add to the buffer the contents before the closing delimiters
					buffer += str.substr(0, index);

					// add to the buffer the return of this function
					buffer += TemplateWalk(str.substr(index + chars.END_PROP.length), chars);
				}
			}
		}
		// if the opening delimiters are not encountered
		else {
			buffer += 'document.write("' + escapeJS(str) + '");';
		}

		// return the buffer
		return buffer;
	}

	function JSHTML(val) {
		var instance = this, data = instance.data = {
			template: '',
			compiled: function () {},
			cached: ''
		}, delimiters = instance.delimiters = {
			'START_PROP': '<%',
			'END_PROP': '%>'
		}, extenders = instance.extenders = {
			'if':     function (js, end) { return end ? '}}' : '{if((' + js + ')){'; },
			'each':   function (js, end) { return end ? '}}' : 'for(var __property__ in ' + js + '){with(' + js + '[__property__]){'; },
			'else':   function (js, end) { return end ? '}}' : '}else if((' + (js.replace(/\s+/, '') ? js : 'true') + ')){'; },
			'unless': function (js, end) { return end ? '}}' : '{if(!(' + js + ')){'; },
			'with':   function (js, end) { return end ? '}}' : '{with(' + js + '){'; },
			'while':  function (js, end) { return end ? '}}' : '{while((' + js + ')){'; }
		}, helpers = instance.helpers = {
			'=': function (js) { return '__out__+=' + js + ';'; },
			'?': extenders.if,
			':': extenders.else,
			'!': extenders.unless,
			'@': extenders.with,
			'-': extenders.while, 
			'#': function (js) {
				var index = js.indexOf(' '), script = js.substr(index > -1 ? index : 0);

				return (extenders[js.substr(0, indexOf)] || extenders.each)(script);
			},
			'/': function (js) {
				var index = js.indexOf(' '), script = js.substr(index > -1 ? index : 0);

				return (extenders[js.substr(0, index)] || extenders.each)(script, true);
			}
		}

		instance.template = function (val) {
			if (val === undefined) {
				return data.template;
			} else {
				if (val !== data.template) {
					data.template = val;

					data.compiled = Function(
						'scope',
						'document',
						'with(scope){' + TemplateWalk(val, delimiters) + '}return document.innerHTML;'
					);

					delete data.cached;
				}

				return instance;
			}
		};

		instance.context = function (val) {
			if (val === undefined) {
				return data.context;
			} else {
				if (val !== data.context) {
					data.context = val;

					delete data.cached;
				}

				return instance;
			}
		};

		instance.render = function (val) {
			if (val !== undefined) {
				instance.context(val);
			}

			return data.cached !== undefined ? data.cached : data.cached = data.compiled.call(global, data.context, {
				innerHTML: "",
				write: function (value) {
					this.innerHTML += String(value);
				}
			});
		};

		if (val) {
			instance.template(val);
		}

		return instance;
	}

	global.JSHTML = JSHTML;
})(this);