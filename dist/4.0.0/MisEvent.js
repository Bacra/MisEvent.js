/** MisEvent v4.0.0 */
var MisEvent = (function(undefined) {
	var blankReg = / +/;


	// bindFromJSON begin
	var bindFromJSONPreg = /^on[A-Z]/;
	function bindFromJSONReplaceFunc(matchStr){
		return matchStr.substring(2).toLowerCase();
	}
	function isFunction(func){
		return func && typeof(func) == 'function';
	}
	function bindFromJSON(obj, config){
		var v;
		for (var i in config) {
			v = config[i];
			if (v && isFunction(v) && bindFromJSONPreg.test(i)) {
				obj['on'](i.replace(bindFromJSONPreg, bindFromJSONReplaceFunc), v);
			}
		}

		return this;	// 放入Object时生效
	}
	// bindFromJSON end




	function toArray(args){
		return Array.prototype.slice.call(args);
	}
	function forEach(arr, callback){
		for(var i = 0, num = arr.length; i < num; i++) {
			if (callback(arr[i], i) === false) return;
		}
	}


	function getOrInitEmitter(obj, eventName, _bindEmitter, _noTransEventNames) {
		var emitter = _bindEmitter[eventName],
			defaultCall;

		if (emitter) return emitter;

		defaultCall = obj[eventName];

		if (!defaultCall || _noTransEventNames[eventName]) {
			emitter = tEmitter(defaultCall, obj);
		} else {
			emitter = tEmitter(function(){
				var args = toArray(arguments);
				args.shift();
				return defaultCall.apply(obj, args);
			}, obj);
		}
		

		obj[eventName] = emitter['emit'];
		_bindEmitter[eventName] = emitter;

		return emitter;
	}

	function parseEventName(eventName, callback) {
		forEach(eventName.split(blankReg), function(name){
			if (name) {
				var arr = name.split('.');
				callback(arr[0], arr[1]);
			}
		});
	}

	function initObject(obj, _noTransEventNames, _addEventFuncName, _removeEventFuncName, _paramFuncName, _removeParamFuncName, _bindEventOnceFuncName, _triggerFuncName){

		var _bindEmitter = {};		// inited emitter

		// ON EVENT
		obj[_addEventFuncName] = function(eventName){
			if (!eventName) return this;

			args = toArray(arguments);

			parseEventName(eventName, function(name, stepName){
				if (!name) return;

				args[0] = stepName;
				var emitter = getOrInitEmitter(obj, name, _bindEmitter, _noTransEventNames);
				emitter['on'].apply(emitter, args);
			});

			return this;
		};

		// OFF EVENT
		obj[_removeEventFuncName] = function(eventName, func){
			var i;
			if (!eventName) {
				for(i in _bindEmitter) {
					_bindEmitter[i]['off']();
				}
			} else if (typeof(eventName) == 'function') {
				for(i in _bindEmitter) {
					_bindEmitter[i]['off'](eventName);
				}
			} else {
				parseEventName(eventName, function(name, stepName){
					if (!name) {
						for(var i in _bindEmitter) {
							_bindEmitter[i]['off'](stepName, func);
						}
					} else {
						var emitter = _bindEmitter[name];
						if (emitter) {
							if (stepName) {
								emitter['off'](stepName, func);
							} else {
								emitter['off'](func);
							}
						}
					}
				});
			}

			return this;
		};

		// PARAM EVENT
		obj[_paramFuncName] = function(eventName, data, widthBaseParam){
			if (!eventName) return this;

			return getOrInitEmitter(obj, eventName, _bindEmitter, _noTransEventNames)['param'](data, widthBaseParam);
		};

		// REMOVE PARAM EVENT
		obj[_removeParamFuncName] = function(eventName, name, widthBaseParam){
			if (!eventName) return this;

			return getOrInitEmitter(obj, eventName, _bindEmitter, _noTransEventNames)['removeParam'](name, widthBaseParam);
		};

		// ONE EVENT
		obj[_bindEventOnceFuncName] = function(eventName){
			if (!eventName) return this;
			args = toArray(arguments);

			parseEventName(eventName, function(name, stepName){
				if (!name) return;

				args[0] = stepName;
				var emitter = getOrInitEmitter(obj, name, _bindEmitter, _noTransEventNames);
				emitter['once'].apply(emitter, args);
			});

			return this;
		};

		// TRIGGER EVENT
		obj[_triggerFuncName] = function(eventName){
			if (eventName) {
				var emitter = _bindEmitter[emitter];
				if (emitter) {
					var args = toArray(arguments);
					args.shift();
					return emitter['trigger'].apply(emitter, args);
				} else if (obj[eventName]){		// 普通方法
					return obj[eventName].apply(obj, arguments);
				}
			}
		};
	}






	// main
	return function(cla, config){
		if (!config) config = {};

		var _addEventFuncName = config['addEventFuncName'] || 'on',
			_removeEventFuncName = config['removeEventFuncName'] || 'off',
			_paramFuncName = config['paramFuncName'] || 'param',
			_removeParamFuncName = config['removeParamFuncName'] || 'removeParam',
			_bindEventOnceFuncName = config['bindEventOnceFuncName'] || 'one',
			_triggerFuncName = config['triggerFuncName'] || 'trigger';

		var _noTransEventNames = {};

		forEach([_addEventFuncName, _removeEventFuncName, _paramFuncName, _removeParamFuncName, _bindEventOnceFuncName, _triggerFuncName], function(bindName){
			cla.prototype[bindName] = function(eventName){
				if (!eventName) return this;

				initObject(this, _noTransEventNames, _addEventFuncName, _removeEventFuncName, _paramFuncName, _removeParamFuncName, _bindEventOnceFuncName, _triggerFuncName);

				return this[bindName].apply(this, arguments);
			};
		});
		

		return {
			'bindFromJSON': bindFromJSON,
			'initEvent': function(eventNames){
				forEach(eventNames.split(blankReg), function(eventName){
					if (!eventName) return;
					_noTransEventNames[eventName] = true;
				});

				return this;
			}
		};
	};

})();