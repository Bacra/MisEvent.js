/** MisEvent v3.0.1 */
/** @define {boolean} */
var DEBUG = true;

window['MisEvent'] = (function(undefined) {
	// 注意：MisEvent属于底层控制，所以不允许出现类似update的操作，防止出现意想不到的问题

	// 注意：Filter模式不同于DOM的事件处理，只有外层运行的函数（不是通过next运行的函数）返回了false，才会终止事件链的执行
	// Filter：由于添加事件是在无序的假象模式下进行的，false表示停止执行，true表示继续执行，所以，在Filter模式下，只要有一个外层函数返回了false，则立即终止事件链的运行


	// gloabl var
	var _TIMESTAMP = new Date().getTime(),
		_callNum = 0;
	// end



	var allEventNameSpace = ['.before', '.after', '.end'];
	var namespace = '_MisEvent' + _TIMESTAMP, // 主要保存event数据集
		defaultFuncEventNamespace = namespace + '_dfEv'; // 默认方法的参数保存位置


	var blankPreg = /\s+/;
	var bindFromConfigPreg = /^on[A-Z]/;



	var ClassIniter = initClass(function(cla, claConfig) {
		cla[namespace] = this;


		this._cla = cla;

		this._addEventFuncName = 'on';
		this._removeEventFuncName = 'off';
		this._paramFuncName = 'param';
		this._removeParamFuncName = 'removeParam';
		this._bindEventOnceFuncName = 'one';
		this._triggerFuncName = 'trigger';

		this._autoInitEvent = false;

		// 定义各类方法的名字
		if (claConfig) {
			var temp = claConfig['addEventFuncName'];
			if (temp) this._addEventFuncName = temp;
			temp = claConfig['removeEventFuncName'];
			if (temp) this._removeEventFuncName = temp;
			temp = claConfig['paramFuncName'];
			if (temp) this._paramFuncName = temp;
			temp = claConfig['removeParamFuncName'];
			if (temp) this._removeParamFuncName = temp;
			temp = claConfig['bindEventOnceFuncName'];
			if (temp) this._bindEventOnceFuncName = temp;
			temp = claConfig['triggerFuncName'];
			if (temp) this._triggerFuncName = temp;


			this._autoInitEvent = claConfig['autoInitEvent'];

			this._EventIniterClass = this._getEventIniterClass(claConfig.bindDefaults);
		} else {
			this._EventIniterClass = this._getEventIniterClass();
		}


		this._bindEventList = {}; // 绑定的事件存放的位置
		this._bindEntrance();
	}, {
		_getEventIniterClass: function(bindDefaults) {
			var _filter = true,
				_afterFilter = false;
			// _returnValue = 'defaultEvent';

			if (bindDefaults) {
				if (hasOwn(bindDefaults, 'filter')) _filter = bindDefaults['filter'];
				if (hasOwn(bindDefaults, 'afterFilter')) _afterFilter = bindDefaults['afterFilter'];
				// if (hasOwn(bindDefaults, 'returnValue')) _returnValue = bindDefaults['returnValue'];
			}


			return function(eventName, defaultFunc, config) {
				this._eventName = eventName;
				this._defaultFunc = isFunction(defaultFunc) ? defaultFunc : null;

				this._filter = _filter;
				this._afterFilter = _afterFilter;
				// this._returnValue = _returnValue;

				if (config) {
					if (hasOwn(config, 'filter')) this._filter = config['filter'];
					if (hasOwn(config, 'afterFilter')) this._afterFilter = config['afterFilter'];
					// if (hasOwn(config, 'returnValue')) this._returnValue = config['returnValue'];
				}
			};
		},
		_initEvent: function(eventName, config) {
			var classIniter = this,
				cla = this._cla,
				eventIniter;

			// 防止对象在没进行初始化的时候，调用出错
			eventIniter = new this._EventIniterClass(eventName, cla.prototype[eventName], config);

			cla.prototype[eventName] = function() {
				var objectIniter;
				if (cla.prototype['on'] == this['on']) { // 判断是否已经改写 (对象是否已经生成Initer)
					objectIniter = new ObjectIniter(this, classIniter);
				} else {
					objectIniter = this['on'][namespace];
				}
				initObjectEvent(eventName, objectIniter);
				return this[eventName].apply(this, arguments);
			};

			this._bindEventList[eventName] = eventIniter;
			return eventIniter;
		},

		'initEvent': function(eventNames, config) {
			var self = this;
			forEach4blankStr(eventNames, function(eventName) {
				if (!self._bindEventList[eventName]) self._initEvent(eventName, config);
			});
		},

		'bindFromConfig': function(obj, config) {
			var v;
			for (var i in config) {
				v = config[i];
				if (v && isFunction(v) && bindFromConfigPreg.test(i)) {
					obj['on'](i.replace(bindFromConfigPreg, bindFromConfigReplaceFunc), v);
				}
			}
		},

		// 放在prototype中的如何函数
		_bindEntrance: function() {
			var cla = this._cla,
				classIniter = this;

			forEach([this._addEventFuncName, this._removeEventFuncName, this._paramFuncName, this._removeParamFuncName, this._bindEventOnceFuncName, this._triggerFuncName], function(bindName) {
				cla.prototype[bindName] = function(eventName) {
					if (!eventName) return this;
					new ObjectIniter(this, classIniter);
					return this[bindName].apply(this, arguments);
				};
			});
		}
	});



	var ObjectIniter = initClass(function(obj, classIniter) {
		this._obj = obj;
		this._objectEventList = {};
		this._classIniter = classIniter;

		this._unique = '_' + (++_callNum);
		this._runWithoutList = 0;

		this._bind();
		this._bindOne();
		this._bindParam();
		this._bindTrigger();

		// 保存数据
		obj['on'][namespace] = this; // 见initEvent
	}, {
		// 仿照jQuery 增加on off方法，实现事件的快速版定
		_bind: function() {
			var _obj = this._obj,
				_objectIniter = this,
				_objectEventList = this._objectEventList,
				_classIniter = this._classIniter,
				_objUnique = this._unique;

			_obj[_classIniter._addEventFuncName] = function(eventNames, data, callback) {
				if (!eventNames) return this;

				if (!callback) {
					callback = data;
					data = undefined;
				}

				forEach4blankStr(eventNames, function(eventName) {
					addEventListener(eventName, callback, data, _objectIniter);
				});


				return this;
			};



			// off 是根据funcData的unique值进行卸载，好处是unique可以进行转移
			// off 只是标记func不可用，真正删除是在执行完成之后
			_obj[_classIniter._removeEventFuncName] = function(eventNames, callback) {
				// off()删除所有通过MisEvent途径绑定的方法
				if (!eventNames) {
					for (var i in _objectEventList) {
						_objectEventList[i].mapFuncData(null, disableFuncData);
					}
					return this;
				}

				// 删除指定的eventName绑定的方法
				var self = this;
				// 如果指定callback，则删除相应的callback
				if (callback) {
					forEach4blankStr(eventNames, function(eventName) {
						var myEventName = new EventName(eventName),
							funcIniter = new FuncIniter(callback),
							objData;

						if (funcIniter.hasObjData(_objUnique)) {
							if (myEventName.hasEventName) {
								if (myEventName.hasNamespace) { // eventName 和 namespace 两个都有
									funcIniter.mapFuncData(_objUnique, myEventName.namespace, disableFuncData);
								} else { // 只有eventName
									forEach(allEventNameSpace, function(namespace) {
										funcIniter.mapFuncData(_objUnique, myEventName.eventName + namespace, disableFuncData);
									});
								}
							} else {
								objData = funcIniter.getObjData(_objUnique);
								if (myEventName.hasNamespace) { // 只有namespace
									funcIniter.mapFuncData(_objUnique, '.' + myEventName.namespace, disableFuncData);
								} else { // 两个都没有
									forEach(allEventNameSpace, function(namespace) {
										funcIniter.mapFuncData(_objUnique, namespace, disableFuncData);
									});
								}
							}
						} else if (DEBUG) {
							throwError('Off Error: callback has No Data');
						}
					});
				} else {



					forEach4blankStr(eventNames, function(eventName) {
						var myEventName = new EventName(eventName),
							objectEvent, mapEventName;

						if (myEventName.hasEventName) {
							objectEvent = _objectEventList[myEventName.eventName];
							if (!objectEvent) return;

							// eventName参数全 以及 只有name
							objectEvent.mapFuncData(myEventName.hasNamespace ? myEventName.namespace : null, disableFuncData);
						} else if (myEventName.hasNamespace) { // 只有命名空间
							for (mapEventName in _objectEventList) {
								_objectEventList[mapEventName].mapFuncData(mapEventName + '.' + myEventName.namespace, disableFuncData);
							}
						} else { // eventName参数两无
							for (mapEventName in _objectEventList) {
								_objectEventList[mapEventName].mapFuncData(null, disableFuncData);
							}
							return false; // 已经把所有的都删除了，直接退出
						}
					});
				}

				return this;
			};
		},



		// 执行过这个方法，不管有没有执行到绑定的函数，都删除这次绑定
		// 注意：Filter模式下，最好还是自己写off，由于涉及到判断eventName是否绑定成功，是否为Filter模式，以及执行的位置（前还是后），暂时不封装这一块的交互；同时，由于off需要在func上创建相应的变量，不要对callback进行拼装，否则会导致无法手动删除
		_bindOne: function() {
			var _objectIniter = this,
				_obj = this._obj,
				_addEventFuncName = this._classIniter._addEventFuncName;

			this._obj[this._classIniter._bindEventOnceFuncName] = function(eventNames, data, callback) {
				if (!eventNames) return this;

				if (!isFunction(callback)) {
					offAfterRunned = callback;
					callback = data;
					data = undefined;
				}

				// 不管有没有执行，只要调用了，就删除方法
				forEach4blankStr(eventNames, function(eventName) {
					var funcData = addEventListener(eventName, callback, data, _objectIniter),
						myEventName;
					if (funcData) {
						myEventName = new EventName(eventName);
						_obj[_addEventFuncName](myEventName.eventName + '.end', function() {
							funcData._disabled = true;
						});
					}
				});

				return this;
			};
		},


		_bindParam: function() {
			var _obj = this._obj,
				_objectIniter = this,
				_classIniter = this._classIniter,
				_objectEventList = this._objectEventList;

			// 默认对runParam操作
			_obj[_classIniter._paramFuncName] = function(eventNames, params, widthBaseParam) {
				if (!eventNames) return this;

				if (isPlainObject(params)) {
					forEach4blankStr(eventNames, function(eventName) {
						var objectEvent = initObjectEvent(eventName, _objectIniter);
						if (!objectEvent) return;
						objectEvent.setParam(params, widthBaseParam);
					});

					return this;
				} else {
					objectEvent = _objectEventList[eventNames];
					if (!objectEvent) return;
					return objectEvent.getParam(params, widthBaseParam);
				}
			};

			// 注意：removeParam不同于param，默认对BaseParam操作
			_obj[_classIniter._removeParamFuncName] = function(eventNames, name, widthBaseParam) {
				if (!eventName) return this;
				widthBaseParam = widthBaseParam !== false;

				var self = this;
				forEach4blankStr(eventNames, function(eventName) {
					objectEvent = _objectEventList[eventName];
					if (!objectEvent) return;

					objectEvent.removeParam(name, widthBaseParam);
				});

				return this;
			};
		},

		// 运行默认方法defaultFunc
		// 注意：preventOther参数为true时，会自动将方法里面，其他处理的方法，也改成运行单一的defaultFunc
		// returnType的值：default(默认值)、last、log
		_bindTrigger: function() {
			var _objectIniter = this,
				_classIniter = this._classIniter,
				_bindEventList = _classIniter._bindEventList;

			this._obj[_classIniter._triggerFuncName] = function(eventName, args, preventOther, returnType) {

				var _eventIniter = _bindEventList[eventName],
					func = _eventIniter ? _eventIniter._defaultFunc : this[eventName],
					rs;

				if (func) {
					if (preventOther) {
						// 前提：JS继续不存在多线程
						_objectIniter._runWithoutList++;
						rs = func.apply(this, args);
						_objectIniter._runWithoutList--;
					} else {
						rs = func.apply(this, args);
					}
				}

				return rs;
			};
		}
	});

	var ObjectEvent = initClass(function(objectIniter, eventIniter) {
		this._objectIniter = objectIniter;
		this._eventIniter = eventIniter;
		this._runParam = {};
		this._baseParam = {};

		this['before'] = [];
		this['after'] = [];
		this['end'] = [];


		// 覆盖原函数
		objectIniter._obj[eventIniter._eventName] = this._getOverrideDefaultFunc(true);
	}, {
		_resetRunParam: function() {
			var _objectEvent = this,
				runParam = function() {
					_objectEvent.param.apply(_objectEvent, arguments);
				};
			extendDeep(runParam, this._baseParam);
			extend(runParam, this._runParam);
			this._runParam = runParam;
			return runParam;
		},

		// 覆盖原来的方法
		_getOverrideDefaultFunc: function(_isReturnDefault) {

			var _objectEvent = this,
				_objectIniter = this._objectIniter,
				_obj = _objectIniter._obj,
				_removeParamFunc = function(name, widthBaseParam) {
					_objectEvent.removeParam(name, widthBaseParam);
					return this;
				},

				_eventIniter = this._eventIniter,
				_beforeFilter = _eventIniter._filter,
				_afterFilter = _eventIniter._afterFilter,
				// _isReturnDefault = _eventIniter._returnValue == 'defaultEvent',

				_defaultFunc = _eventIniter._defaultFunc,
				_beforeFuncDataList = this['before'],
				_afterFuncDataList = this['after'],
				_endFuncDataList = this['end'],
				_defaultNextFunc = defaultNextFunc;


			return function() {
				// 是否阻止运行绑定的函数
				if (_objectIniter._runWithoutList) {
					if (_defaultFunc) return _defaultFunc.apply(this, arguments);
					return;
				}


				var args = toArray(arguments),
					runParam = _objectEvent._resetRunParam(), // 初始化参数
					preReturn, defaultReturn,
					i, funcData,

					isDefaultPrevented = false,
					isImmediatePropagationStopped = false, // 位置锁定，防止只能的嵌套调用
					preventDefaultFn = function() {
						isDefaultPrevented = true;
					},
					stopImmediatePropagationFn = function() {
						isImmediatePropagationStopped = true;
					},

					beforeFilterCreateFunc, afterFilterCreateFunc,
					beforeEventParam, afterEventParam, endEventParam;

				_objectEvent._runParam = {};
				args.unshift(null); // 头部添加一个空位，添加EventParam对象


				i = _beforeFuncDataList.length;
				if (i) {
					// 运行 before中的方法
					if (_beforeFilter) {
						beforeEventParam = function(funcData) {
							this['data'] = funcData._data;
							this['next'] = funcData.nextFunc;
							this['off'] = function() {
								funcData._disabled = true;
							};
						};
						beforeEventParam.prototype = {
							'param': runParam,
							'removeParam': _removeParamFunc,
							'preventDefault': preventDefaultFn,
							'stopImmediatePropagation': stopImmediatePropagationFn
						};
						beforeFilterCreateFunc = function(myNextFuncData) {
							if (DEBUG) myNextFuncData._hasRunned = false;

							return function() {
								if (isImmediatePropagationStopped) return false;

								if (DEBUG && myNextFuncData._hasRunned) throwError('Func has runned before');

								// 判断是否被动态需求，如果取消了，则执行后一个
								// 下一次执行buildLiveFuncDataList的时候，会自动将其删除
								while (myNextFuncData._disabled) myNextFuncData = myNextFuncData.nextFuncData;
								args[0] = new beforeEventParam(myNextFuncData);
								// args为原版的数据（如果是对象的话，有可能会有所改变）

								if (DEBUG) myNextFuncData._hasRunned = true;
								return myNextFuncData._func.apply(_obj, args) !== false;
							};
						};
						// 创建队列
						while (i--) {
							thisFuncData = _beforeFuncDataList[i];
							if (!thisFuncData._disabled) {
								nextFuncData = _beforeFuncDataList[i + 1];
								if (nextFuncData) {
									thisFuncData.nextFunc = beforeFilterCreateFunc(nextFuncData);
									thisFuncData.nextFuncData = nextFuncData;
								} else {
									thisFuncData.nextFunc = _defaultNextFunc;
									nextFuncData = new FuncData(_defaultNextFunc); // 用最简单的，因为thisFunc会自己写
									nextFuncData.thisFunc = _defaultNextFunc;
								}

								thisFuncData.nextFuncData = nextFuncData;
							} else {
								_beforeFuncDataList.splice(i, 1);
							}
						}

						// 运行函数
						funcData = _beforeFuncDataList[0];
						if (funcData) {
							args[0] = new beforeEventParam(funcData);
							if (DEBUG) funcData._hasRunned = true;
							funcData._func.apply(this, args);
							if (DEBUG) checkFilterQueue(_beforeFuncDataList);
						}
					} else {

						beforeEventParam = function(funcData) {
							this['preReturn'] = preReturn;
							this['data'] = funcData._data;
							this['off'] = function() {
								funcData._disabled = true;
							};
						};
						beforeEventParam.prototype = {
							'param': runParam,
							'removeParam': _removeParamFunc,
							'preventDefault': preventDefaultFn,
							'stopImmediatePropagation': stopImmediatePropagationFn
						};
						for (i = 0; i < _beforeFuncDataList.length; i++) {
							funcData = _beforeFuncDataList[i];
							if (!funcData._disabled) {
								args[0] = new beforeEventParam(funcData);
								preReturn = funcData._func.apply(this, args);
								if (isImmediatePropagationStopped) break;
							} else {
								_beforeFuncDataList.splice(i, 1);
								i--;
							}
						}
					}
				}

				if (!isDefaultPrevented && !isImmediatePropagationStopped) {
					// 运行 默认方法
					if (_defaultFunc) {
						// 默认方法为了实现快速添加，获取参数的方式和一般附加的方法有所不同，是通过
						_defaultFunc[defaultFuncEventNamespace] = {
							'preReturn': preReturn,
							'param': runParam,
							'removeParam': _removeParamFunc,
							'stopImmediatePropagation': stopImmediatePropagationFn
						};
						defaultReturn = _defaultFunc.apply(this, arguments);
						preReturn = defaultReturn;
					}

					// 运行 after中的方法
					i = _afterFuncDataList.length;
					if (!isImmediatePropagationStopped && i) {
						if (_afterFilter) {
							afterEventParam = function(funcData) {
								this['preReturn'] = preReturn;
								this['data'] = funcData._data;
								this['next'] = funcData.nextFunc;
								this['off'] = function() {
									funcData._disabled = true;
								};
							};
							afterEventParam.prototype = {
								'defaultReturn': defaultReturn,
								'param': runParam,
								'removeParam': _removeParamFunc,
								'stopImmediatePropagation': stopImmediatePropagation
							};
							afterFilterCreateFunc = function(myNextFuncData) {
								if (DEBUG) myNextFuncData._hasRunned = false;

								return function() {
									if (isImmediatePropagationStopped) return false;

									if (DEBUG && myNextFuncData._hasRunned) throwError('Func has runned before');
									// 判断是否被动态需求，如果取消了，则执行后一个
									// 下一次执行buildLiveFuncDataList的时候，会自动将其删除
									while (myNextFuncData._disabled) myNextFuncData = myNextFuncData.nextFuncData;
									args[0] = new afterEventParam(myNextFuncData);

									if (DEBUG) myNextFuncData._hasRunned = true;
									// args为原版的数据（如果是对象的话，有可能会有所改变）
									return myNextFuncData._func.apply(_obj, args) !== false;
								};
							};
							while (i--) {
								thisFuncData = _afterFuncDataList[i];
								if (!thisFuncData._disabled) {
									nextFuncData = _afterFuncDataList[i + 1];
									if (nextFuncData) {
										nextFunc = afterFilterCreateFunc(nextFuncData);
										thisFuncData.nextFuncData = nextFuncData;
									} else {
										nextFunc = defaultNextFunc;
										thisFuncData.nextFuncData = new FuncData(nextFunc); // 用最简单的，因为thisFunc会自己写
										thisFuncData.nextFuncData.thisFunc = nextFunc;
									}

									thisFuncData.nextFunc = nextFunc;

								} else {
									_afterFuncDataList.splice(i, 1);
								}
							}

							// 运行函数
							funcData = _afterFuncDataList[0];
							if (funcData) {
								args[0] = new afterEventParam(funcData);
								if (DEBUG) funcData._hasRunned = true;
								funcData._func.apply(this, args);
								if (DEBUG) checkFilterQueue(_afterFuncDataList);
							}
						} else {

							afterEventParam = function(funcData) {
								this['preReturn'] = preReturn;
								this['data'] = funcData._data;
								this['off'] = function() {
									funcData._disabled = true;
								};
							};
							afterEventParam.prototype = {
								'defaultReturn': defaultReturn,
								'param': runParam,
								'removeParam': _removeParamFunc,
								'stopImmediatePropagation': stopImmediatePropagationFn
							};
							for (i = 0; i < _afterFuncDataList.length; i++) {
								funcData = _afterFuncDataList[i];
								if (!funcData._disabled) {
									args[0] = new afterEventParam(funcData);
									preReturn = funcData._func.apply(this, args);
									if (isImmediatePropagationStopped) break;
								} else {
									_afterFuncDataList.splice(i, 1);
									i--;
								}
							}
						}
					}
				}

				// 运行 end中的方法
				if (_endFuncDataList.length) {
					endEventParam = function(funcData) {
						this['preReturn'] = preReturn;
						this['data'] = funcData._data;
						this['off'] = function() {
							funcData._disabled = true;
						};
					};
					endEventParam.prototype = {
						'defaultReturn': defaultReturn,
						'param': runParam,
						'removeParam': _removeParamFunc
					};
					for (i = 0; i < _endFuncDataList.length; i++) {
						funcData = _endFuncDataList[i];
						if (!funcData._disabled) {
							args[0] = new endEventParam(funcData);
							funcData._func.apply(this, args);
							if (isImmediatePropagationStopped) break;
						} else {
							_endFuncDataList.splice(i, 1);
							i--;
						}
					}
				}

				// return _isReturnDefault ? defaultReturn : preReturn;
				return defaultReturn;
			};
		},


		addFuncData: function(namespace, funcData) {
			this[namespace].push(funcData);
		},
		getFuncData: function(namespace) {
			return this[namespace];
		},
		mapFuncData: function(namespace, callback) {
			if (namespace) {
				forEach(this[namespace], callback);
			} else {
				forEach(this['before'], callback);
				forEach(this['after'], callback);
				forEach(this['end'], callback);
			}
		},


		param: function(params, widthBaseParam) {
			if (isPlainObject(params)) {
				this.setParam(params, widthBaseParam);
				return this;
			} else {
				return this.getParam(params, widthBaseParam);
			}
		},
		getParam: function(name, isBaseParam) {
			return isBaseParam ? this._baseParam[name] : this._runParam[name];
		},
		setParam: function(params, widthBaseParam) {
			if (widthBaseParam) extend(this._baseParam, params);
			extend(this._runParam, params);
		},
		removeParam: function(name, widthBaseParam) {
			if (widthBaseParam) delete this._baseParam[name];
			delete this._runParam[name];
		}
	});

	// 初始化添加的回调函数信息
	var FuncIniter = initClass(function(func) {
		if (func[namespace]) {
			return func[namespace];
		}
		this.func = func;
		func[namespace] = this;
	}, {
		hasObjData: function(objUnique) {
			return this[objUnique] ? true : false;
		},
		getObjData: function(objUnique) {
			var data = this[objUnique];
			if (!data) {
				data = {};
				this[objUnique] = data;
			}
			return data;
		},
		hasFuncData: function(objUnique, name) {
			try {
				return this[objUnique][name] ? true : false;
			} catch (e) {
				return false;
			}
		},
		getFuncData: function(objUnique, name) {
			var data = this[objUnique],
				funcData;
			if (!data) {
				data = {};
				funcData = data[name] = [];
				this[objUnique] = data;
			} else {
				funcData = data[name];
				if (!funcData) funcData = data[name] = [];
			}
			return funcData;
		},
		mapFuncData: function(objUnique, name, callback) {
			try {
				forEach(this[objUnique][name], callback);
			} catch (e) {}
		},
		addFuncData: function(objUnique, eventName, funcData) {
			this.getFuncData(objUnique, eventName.fullEventName).push(funcData);
			this.getFuncData(objUnique, '.' + eventName.namespace).push(funcData); // 加快整个 及对namespace的遍历
		}
	});



	// simple Class
	/**
	 * FuncData 数据格式如下
	 * _func
	 * _data
	 * _disabled
	 *
	 * Filter模式下，程序运行时，还会动态添加
	 * extFunc nextFuncData两个属性
	 */

	function FuncData(func, data, isFilter) {
		this._func = func;
		this._data = data;
		this._disabled = false; // 只能通过off设置成true，不能通过其他途径设置
	}
	// 可以有的名字有：
	// done done.after .after

	function EventName(eventName) {
		var arr = eventName.split('.');

		if (arr.length == 2) {
			this.eventName = arr[0];
			this.namespace = arr[1];
			this.hasNamespace = true;
			if (DEBUG && this.namespace != 'after' && this.namespace != 'end' && this.namespace != 'before') {
				throwError('EventName Error: EventName Piex NOT "after" "before" or "end"');
			}
		} else {
			this.namespace = 'before';
			this.eventName = eventName;
			this.hasNamespace = false;
		}

		this.hasEventName = Boolean(eventName);
		this.fullEventName = this.eventName + '.' + this.namespace;
	}



	// util func

	function forEach4blankStr(str, callback) {
		if (blankPreg.test(str)) {
			forEach(str.split(blankPreg), callback);
		} else {
			callback(str, 0);
		}
	}

	function bindFromConfigReplaceFunc($match) {
		return $match.substring(2).toLowerCase();
	}



	// 针对forEach增加的方法

	function disableFuncData(funcData) {
		funcData._disabled = true;
	}

	function defaultNextFunc() {
		return true;
	}



	// 只有在debug模式下才有用的函数

	function throwError(str) {
		throw ('[MisEvent]' + str);
	}

	function checkFilterQueue(funcDataList) {
		var fullLength = funcDataList.length,
			funcData = funcDataList[fullLength - 1],
			isSkip = !funcData._disabled && !funcData._hasRunned,
			blockFunc, skipFunc = [],
			lastRunnedFuncIndex = 0;

		if (isSkip) {
			forEach(funcDataList, function(funcData, index) {
				if (!funcData._disabled && !funcData._hasRunned) {
					lastRunnedFuncIndex = index;

					while (index < fullLength) {
						skipFunc.push(funcDataList[index]);
						index++;
					}
					return false;
				}
				blockFunc = funcData;
			});

			console.group('[MisEvent] <Filter Mod> Skip Func');
			console.warn('blockFunc', blockFunc);
			console.warn('lastRunnedFuncIndex', lastRunnedFuncIndex);
			console.warn('skipFunc', skipFunc);
			console.groupEnd();
		}

	}
	// DEBUG FUNC END

	function addEventListener(eventName, callback, data, objectIniter) {
		var myEventName = new EventName(eventName),
			objectEvent, funcIniter, funcData, eventIniter;
		if (!myEventName.hasEventName) return false;

		objectEvent = initObjectEvent(myEventName.eventName, objectIniter);
		if (!objectEvent) return false;

		eventIniter = objectEvent._eventIniter;
		funcData = new FuncData(callback, data);
		funcIniter = new FuncIniter(callback);
		funcIniter.addFuncData(objectIniter._unique, myEventName, funcData);

		// 注意：FuncData对象必须新建才行，会造成对象共用
		objectEvent.addFuncData(myEventName.namespace, funcData);

		return funcData;
	}

	function initObjectEvent(eventName, objectIniter) {
		var objectEvent = objectIniter._objectEventList[eventName],
			classIniter, eventIniter;

		if (!objectEvent) {
			classIniter = objectIniter._classIniter;
			eventIniter = classIniter._bindEventList[eventName];
			if (!eventIniter) {
				if (!classIniter._autoInitEvent) {
					if (DEBUG) throwError('On Error: NOT initEvent "' + eventName + '"');
					return false;
				}
				eventIniter = classIniter._initEvent(eventName, classIniter._bindDefaults);
			}
			objectEvent = new ObjectEvent(objectIniter, eventIniter);
			objectIniter._objectEventList[eventName] = objectEvent;
		}

		return objectEvent;
	}



	// global util begin

	function extend(obj, obj2) {
		for (var i in obj2) {
			obj[i] = obj2[i];
		}
	}

	function extendDeep(obj, obj2) {
		var temp, temp2;
		for (var i in obj2) {
			temp = obj2[i];
			if (isPlainObject(temp)) {
				temp2 = obj[i];
				if (!temp2) obj[i] = temp2 = {};
				extendDeep(temp2, obj[i]);
			}
		}
	}
	/*function extendDeepAll(obj, obj2){
	var temp, temp2;
	for (var i in obj2) {
		temp = obj2[i];
		if (isPlainObject(temp)) {
			temp2 = obj[i];
			if (!temp2) obj[i] = temp2 = {};
			extendDeepAll(temp2, obj[i]);
		}
	}
}*/

	function hasOwn(cla, pro) {
		return cla.hasOwnProperty(pro);
	}

	function toArray(arr) {
		return Array.prototype.slice.call(arr);
	}
	// 注意：不同于jquery，callback第一个参数为value，而不是index

	function forEach(arr, callback) {
		for (var i = 0, num = arr.length; i < num; i++) {
			if (callback(arr[i], i) === false) break;
		}
	}

	function isFunction(func) {
		return func && typeof(func) == 'function';
	}

	function isPlainObject(obj) {
		return obj && obj !== null && typeof(obj) == 'object';
	}

	function initClass(func, proto) {
		func.prototype = proto;
		return func;
	}
	// global util end



	//  对外接口封装

	function __main__(cla, claConfig) {
		var claMisevent = cla[namespace];

		if (!claMisevent) {
			claMisevent = new ClassIniter(cla, claConfig);
			cla[namespace] = claMisevent;
		}

		return claMisevent;
	}



	__main__['namespace'] = namespace;
	__main__['event'] = function(args) {
		return isFunction(args) ? args[defaultFuncEventNamespace] : args.callee[defaultFuncEventNamespace];
	};


	return __main__;


})();