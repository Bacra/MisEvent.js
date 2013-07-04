MisEvent
========

`MisEvent` 是针对 [tEmitter](https://github.com/Bacra/tEmitter.js)项目的一个实例化补充

使用`MisEvent`可以很方便地针对具体的类，增加事件绑定相关函数，具体见`tEmitter`项目




## Get Started

	var bindFromJSON = MisEvent(class, config);

其中

返回值`bindFromJSON`可以很方便地从对象初始化参数中，获取可以绑定的事件，并通过`on`方法写入相应的时间队列中

`config`参数可以修改初始化时附加在`class`上的方法名，可以修改的参数名及其默认值如下：

* `addEventFuncName` => `on`
* `removeEventFuncName` => `off`
* `paramFuncName` => `param`
* `removeParamFuncName` => `removeParam`
* `bindEventOnceFuncName` => `once`
* `triggerFuncName` => `trigger`

更多信息及实例请关注 [Wiki](./wiki) 页面；
或参考[tEmitter](/Bacra/tEmitter.js) 项目




## License

MisEvent.js is available under the terms of the [MIT License](./LICENSE.md).