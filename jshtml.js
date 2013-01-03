// JSHTML v4.0.0 MIT/GPL2 @jon_neal
(function (global) {
	function Document() {}

	Document.prototype.write = Array.prototype.push;
	Document.prototype.close = function () { return Array.prototype.splice.call(this, 0, this.length).join(""); };

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

	function JSHTML() {
		var
		instance   = this;

		instance.template = '';
		instance.context = {};
		instance.render = function () {
			return Function(
				'scope',
				'document',
				'with(scope){' + TemplateWalk(instance.template, instance.delimiters) + '}return document;'
			).call(instance, instance.context, new Document).close();
		};
		instance.delimiters = {
			'START_PROP': '<%',
			'END_PROP': '%>'
		};
	}

	global.JSHTML = JSHTML;
})(this);